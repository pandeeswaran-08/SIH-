import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application
from app.models.document import ApplicationDocument, DocumentType, DocumentStatus
from app.models.extracted_field import ExtractedField
from app.models.user import User
from app.schemas.schemas import DocumentResponse, ExtractedFieldResponse
from app.security.deps import get_current_user
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from ai_engine.ocr.pipeline import ocr_pipeline
from ai_engine.extraction.field_extractor import field_extractor

router = APIRouter(tags=["Documents"])

@router.post("/applications/{id}/documents", response_model=DocumentResponse)
async def upload_document(
    id: int,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    try:
        doc_type_enum = DocumentType(document_type)
    except ValueError:
        doc_type_enum = DocumentType.OTHER

    # Save file and calculate SHA-256
    rel_path, sha256_hash, file_size = await storage_service.save_file(file, subfolder="documents")
    full_path = storage_service.get_full_path(rel_path)

    # Perform instant lightweight OCR extraction
    ocr_res = ocr_pipeline.extract_from_file(full_path)
    
    doc = ApplicationDocument(
        application_id=app.id,
        document_type=doc_type_enum,
        filename=os.path.basename(rel_path),
        original_filename=file.filename or "upload.pdf",
        storage_path=rel_path,
        file_size_bytes=file_size,
        sha256_hash=sha256_hash,
        mime_type=file.content_type or "application/octet-stream",
        status=DocumentStatus.UPLOADED,
        page_count=ocr_res.get("page_count", 1),
        is_unreadable=ocr_res.get("is_unreadable", False),
        ocr_completed=True,
        extracted_text=ocr_res.get("text"),
        metadata_json=json.dumps(ocr_res.get("metadata", {}))
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Extract fields and persist
    extracted = field_extractor.extract_fields(ocr_res, doc_type_enum.value)
    for f in extracted:
        ef = ExtractedField(
            application_id=app.id,
            document_id=doc.id,
            field_name=f["field_name"],
            extracted_value=f["extracted_value"],
            confidence=f["confidence"],
            source_page=f["source_page"],
            bbox_json=json.dumps(f["bbox"]),
            evidence_ref=f["evidence_ref"]
        )
        db.add(ef)
    db.commit()

    # Record audit event
    actor_id = str(current_user.id) if current_user else "APPLICANT"
    actor_role = current_user.role.value if current_user else "APPLICANT"
    audit_service.record_event(
        db=db,
        actor_id=actor_id,
        actor_role=actor_role,
        action="DOCUMENT_UPLOADED",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        metadata={
            "filename": doc.filename,
            "document_type": doc.document_type.value,
            "sha256": sha256_hash,
            "file_size": file_size
        }
    )

    return doc

@router.get("/applications/{id}/documents", response_model=List[DocumentResponse])
def get_application_documents(id: int, db: Session = Depends(get_db)):
    docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == id).all()
    return docs

@router.get("/documents/{doc_id}/file")
def get_document_file(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    full_path = storage_service.get_full_path(doc.storage_path)
    return FileResponse(
        path=full_path,
        media_type=doc.mime_type,
        filename=doc.original_filename
    )

@router.get("/applications/{id}/extracted-fields", response_model=List[ExtractedFieldResponse])
def get_application_extracted_fields(id: int, db: Session = Depends(get_db)):
    fields = db.query(ExtractedField).filter(ExtractedField.application_id == id).all()
    return fields

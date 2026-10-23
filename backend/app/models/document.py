from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base

class DocumentType(str, enum.Enum):
    LAND_OWNERSHIP = "LAND_OWNERSHIP"
    AFFILIATION_CERT = "AFFILIATION_CERT"
    BUILDING_PLAN = "BUILDING_PLAN"
    FIRE_SAFETY = "FIRE_SAFETY"
    FACULTY_LIST = "FACULTY_LIST"
    BANK_GUARANTEE = "BANK_GUARANTEE"
    PCI_APPROVAL = "PCI_APPROVAL"
    COA_REGISTRATION = "COA_REGISTRATION"
    LAB_INVENTORY = "LAB_INVENTORY"
    INFRASTRUCTURE_PHOTO = "INFRASTRUCTURE_PHOTO"
    CORPUS_FUND = "CORPUS_FUND"
    PWD_COMPLIANCE = "PWD_COMPLIANCE"
    OTHER = "OTHER"

class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    VERIFIED = "VERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    EXPIRED = "EXPIRED"
    UNREADABLE = "UNREADABLE"
    REJECTED = "REJECTED"

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    document_type = Column(Enum(DocumentType), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), index=True, nullable=False)
    mime_type = Column(String(100), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    page_count = Column(Integer, default=1)
    is_unreadable = Column(Boolean, default=False)
    ocr_completed = Column(Boolean, default=False)
    extracted_text = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True) # JSON with EXIF, PDF producer, creation date
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

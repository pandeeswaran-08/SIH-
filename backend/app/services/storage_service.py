import os
import shutil
import hashlib
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        self.local_dir = settings.STORAGE_LOCAL_DIR
        os.makedirs(self.local_dir, exist_ok=True)
        os.makedirs(os.path.join(self.local_dir, "documents"), exist_ok=True)
        os.makedirs(os.path.join(self.local_dir, "evidence"), exist_ok=True)
        os.makedirs(os.path.join(self.local_dir, "reports"), exist_ok=True)

    def validate_file(self, file: UploadFile) -> None:
        # 1. File extension validation
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Permitted: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # 2. MIME type check
        if file.content_type and file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MIME type '{file.content_type}'. Permitted: {', '.join(settings.ALLOWED_MIME_TYPES)}"
            )

    async def save_file(self, file: UploadFile, subfolder: str = "documents") -> Tuple[str, str, int]:
        """
        Saves uploaded file securely, calculates SHA-256 fingerprint.
        Returns: (relative_storage_path, sha256_hash, file_size_bytes)
        """
        self.validate_file(file)

        # Read contents to memory for hashing & signature inspection
        contents = await file.read()
        file_size = len(contents)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # File signature (Magic byte) verification
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext == ".pdf" and not contents.startswith(b"%PDF"):
            raise HTTPException(status_code=400, detail="Invalid PDF file signature.")
        elif ext in [".png"] and not contents.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=400, detail="Invalid PNG image signature.")
        elif ext in [".jpg", ".jpeg"] and not (contents.startswith(b"\xff\xd8\xff")):
            raise HTTPException(status_code=400, detail="Invalid JPEG image signature.")

        # Compute SHA-256 hash
        hasher = hashlib.sha256()
        hasher.update(contents)
        sha256_hash = hasher.hexdigest()

        # Generate unique storage filename with hash prefix to eliminate collisions
        safe_filename = f"{sha256_hash[:16]}_{os.path.basename(file.filename or 'upload')}"
        target_dir = os.path.join(self.local_dir, subfolder)
        os.makedirs(target_dir, exist_ok=True)
        full_path = os.path.join(target_dir, safe_filename)

        # Save to local secure storage
        with open(full_path, "wb") as f:
            f.write(contents)

        relative_path = os.path.join(subfolder, safe_filename).replace("\\", "/")
        await file.seek(0)
        return relative_path, sha256_hash, file_size

    def save_bytes(self, data: bytes, filename: str, subfolder: str = "reports") -> Tuple[str, str, int]:
        hasher = hashlib.sha256()
        hasher.update(data)
        sha256_hash = hasher.hexdigest()

        target_dir = os.path.join(self.local_dir, subfolder)
        os.makedirs(target_dir, exist_ok=True)
        safe_filename = f"{sha256_hash[:16]}_{filename}"
        full_path = os.path.join(target_dir, safe_filename)

        with open(full_path, "wb") as f:
            f.write(data)

        relative_path = os.path.join(subfolder, safe_filename).replace("\\", "/")
        return relative_path, sha256_hash, len(data)

    def get_full_path(self, relative_path: str) -> str:
        # Prevent directory traversal
        clean_path = os.path.normpath(relative_path).lstrip("/\\")
        full_path = os.path.abspath(os.path.join(self.local_dir, clean_path))
        if not full_path.startswith(os.path.abspath(self.local_dir)):
            raise HTTPException(status_code=403, detail="Unauthorized storage path access.")
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Requested document file not found on storage.")
        return full_path

storage_service = StorageService()

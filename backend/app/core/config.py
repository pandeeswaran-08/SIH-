from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import os
import sys
from pathlib import Path

# Add project root to sys.path so ai_engine and rules can be resolved cleanly
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


DATA_DIR = os.path.join(BACKEND_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DEFAULT_DB_PATH = os.path.join(DATA_DIR, "aicte_validation.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "AICTE AI-Powered Application Validation Platform"
    PROJECT_DESCRIPTION: str = "Decision-support platform for automated document scrutiny, infrastructure verification, and explainable risk analysis."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = Field(default="aicte-super-secure-production-ready-jwt-secret-key-2026-v1", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Absolute path ensures consistency between tests and server runs)
    DATABASE_URL: str = Field(
        default=f"sqlite:///{DEFAULT_DB_PATH}",
        env="DATABASE_URL"
    )
    
    # Private Storage (Local encrypted/fingerprinted directory or MinIO)
    STORAGE_BACKEND: str = Field(default="LOCAL", env="STORAGE_BACKEND") # "LOCAL" or "MINIO"
    STORAGE_LOCAL_DIR: str = Field(default="./storage_data", env="STORAGE_LOCAL_DIR")
    MINIO_ENDPOINT: str = Field(default="localhost:9000", env="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: str = Field(default="minioadmin", env="MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: str = Field(default="minioadmin", env="MINIO_SECRET_KEY")
    MINIO_BUCKET_NAME: str = Field(default="aicte-documents", env="MINIO_BUCKET_NAME")
    MINIO_SECURE: bool = Field(default=False, env="MINIO_SECURE")
    
    # Limits & Validation
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".png", ".jpg", ".jpeg"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]
    MAX_PDF_PAGES: int = 150
    
    # Hardware & Performance Tuning (Windows 11, Intel Core i7 8th Gen, 8GB RAM, NVIDIA MX130 2GB VRAM)
    EXECUTION_MODE: str = "CPU_OPTIMIZED"
    ENABLE_OPTIONAL_MODELS: bool = True
    MAX_CONCURRENT_WORKERS: int = 4
    
    # Rules Directory
    RULES_DIR: str = str(Path(__file__).resolve().parent.parent.parent.parent / "rules")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure storage directories exist
os.makedirs("./data", exist_ok=True)
os.makedirs(settings.STORAGE_LOCAL_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_LOCAL_DIR, "documents"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_LOCAL_DIR, "evidence"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_LOCAL_DIR, "reports"), exist_ok=True)

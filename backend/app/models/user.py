from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from datetime import datetime, timezone
import enum
from app.db.base import Base

class RoleEnum(str, enum.Enum):
    APPLICANT = "APPLICANT"
    VALIDATION_OFFICER = "VALIDATION_OFFICER"
    SENIOR_REVIEWING_OFFICER = "SENIOR_REVIEWING_OFFICER"
    SYSTEM_ADMINISTRATOR = "SYSTEM_ADMINISTRATOR"
    AUDITOR = "AUDITOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.VALIDATION_OFFICER, nullable=False)
    institution_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

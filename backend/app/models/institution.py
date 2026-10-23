from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime, timezone
from app.db.base import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    aicte_permanent_id = Column(String(50), unique=True, index=True, nullable=False)
    legal_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    sub_category = Column(String(100), nullable=True)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pin_code = Column(String(10), nullable=False)
    address = Column(Text, nullable=False)
    establishment_year = Column(Integer, nullable=False)
    land_area_acres = Column(Float, nullable=True)
    builtup_area_sqm = Column(Float, nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    trust_or_society_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

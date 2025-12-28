from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Office(Base):
    """
    Office mode: maps to 'offices table'
    An office is a workspace created by an employer
    """

    __tablename__ = "offices"

   # Columns
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    invite_code = Column(String(20), unique=True, nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_offices")
    members = relationship("OfficeMember", back_populates="office")
    availabilities = relationship("Availability", back_populates="office")
    shifts = relationship("Shift", back_populates="office")
from sqlalchemy import Column, Integer, Date, Time, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Shift(Base):
    """
    Shift model: maps to 'shifts' table.
    Stores assigned shifts for employees.
    """
    
    __tablename__ = "shifts"
    
    # Columns
    id = Column(Integer, primary_key=True, index=True)
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    office = relationship("Office", back_populates="shifts")
    user = relationship("User", back_populates="shifts")
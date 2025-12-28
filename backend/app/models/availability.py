from sqlalchemy import Column, Integer, Time, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from app.database import Base


class Availability(Base):
    """
    Availability model: maps to 'availability' table.
    Stores time blocks when an employee is available to work.
    """
    
    __tablename__ = "availability"
    
    # Columns
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=False)
    day_of_week = Column(SmallInteger, nullable=False)  # 0=Mon, 6=Sun
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="availabilities")
    office = relationship("Office", back_populates="availabilities")
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """
    User model: maps to 'users' table in database
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    owned_offices = relationship("Office", back_populates="owner")
    memberships = relationship("OfficeMember", back_populates="user")
    availabilities = relationship("Availability", back_populates="user")
    shifts = relationship("Shift", back_populates="user")
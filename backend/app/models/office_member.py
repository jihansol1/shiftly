from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class OfficeMember(Base):
    """
    OfficeMember model - maps to 'office_members' table.
    Junction table connecting users to offices with their role.
    """
    
    __tablename__ = "office_members"
    
    # Columns
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=False)
    role = Column(Enum("employer", "employee", name="role_enum"), nullable=False)
    joined_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="memberships")
    office = relationship("Office", back_populates="members")
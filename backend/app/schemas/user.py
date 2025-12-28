from re import S
from pydantic import BaseModel, EmailStr # email validator
from datetime import datetime


# schema for user registration
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

# Schema for user login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# schema for returning user data
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    created_at: datetime

class Config:
    from_attribites = True




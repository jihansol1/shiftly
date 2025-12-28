from pydantic import BaseModel
from datetime import datetime

# schema for creating an office
class OfficeCreate(BaseModel):
    name: str

# schema for joining an office with invite code
class OfficeJoin(BaseModel):
    invite_code: str

# schema for returning office data
class OfficeResponse(BaseModel):
    id: int
    name: str
    invite_code: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# schema for returning office member info
class OfficeMemberResponse(BaseModel):
    id: int
    user_id: int
    office_id: int
    role: str
    joined_at: datetime

    first_name: str | None = None
    last_name: str | None = None
    emaol: str | None = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import time

# schema for single time block an employee submits
class AvailabilityCreate(BaseModel):
    day_of_week: int # 0 = Monday, 6 = Sunday
    start_time: time
    end_time: time

# schema to update all availability at once. Replace existing availability with new list
class AvailabilityUpdate(BaseModel):
    availabilities: list[AvailabilityCreate]

# schema for single availability block returned
class AvailabilityResponse(BaseModel):
    id: int
    user_id: int
    office_id: int
    day_of_week: int
    start_time: time
    end_time: time
    
    class Config:
        from_attribute = True

# schema for all availability grouped by day with user info
class AvailabilityWithUser(BaseModel):
    id: int
    user_id: int
    day_of_week: int
    start_time: time
    end_time: time
    first_name: str
    last_name: str

    class Config:
        from_attribute = True


    




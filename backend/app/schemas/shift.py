from pydantic import BaseModel
from datetime import date, time

# schema to manually create a single shift
class ShiftCreate(BaseModel):
    user_id: int
    shift_date: time
    start_time: time
    end_time: time

# schema to return shift data
class ShiftResponse(BaseModel):
    id: int
    office_id: int
    user_id: int
    shift_date: time
    start_time: time
    end_time: time

    class Config:
        from_attributes = True

# schema to show shift with assigned employee info
class ShiftWithUser(BaseModel):
    id: int
    office_id: int
    user_id: int
    shift_date: date
    start_time: time
    end_time: time
    first_name: str
    last_name: str

    class Config:
        from_attributes = True

# defines what shifts need coverage
class ShiftRequirement(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    min_workers: int = 1

# schema to request for AI to generate schedule
class GenerateScheduleRequest(BaseModel):
    week_start_date: date  # Monday of the week to generate
    shifts_needed: list[ShiftRequirement]

# schema to show AI - generated shifts
class GenerateScheduleResponse(BaseModel):
    shifts: list[ShiftWithUser]
    message: str | None = None
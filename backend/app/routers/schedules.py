from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.database import get_db
from app.models import User, OfficeMember, Availability, Shift
from app.schemas import (
    ShiftCreate,
    ShiftResponse,
    ShiftWithUser,
    GenerateScheduleRequest,
    GenerateScheduleResponse
)
from app.dependencies import get_current_user
from app.services.ai_scheduler import generate_schedule

router = APIRouter(
    tags=["Schedules"]
)


def require_employer(user_id: int, office_id: int, db: Session) -> OfficeMember:
    """
    Helper to verify user is employer of office.
    """
    membership = db.query(OfficeMember).filter(
        OfficeMember.user_id == user_id,
        OfficeMember.office_id == office_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this office"
        )
    
    if membership.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can manage schedules"
        )
    
    return membership


@router.post("/offices/{office_id}/schedule/generate", response_model=GenerateScheduleResponse)
def generate_schedule_endpoint(
    office_id: int,
    request: GenerateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Use AI to auto-generate shift assignments based on availability.
    """
    # Verify employer
    require_employer(current_user.id, office_id, db)
    
    # Get all availability for this office
    availabilities = db.query(Availability).filter(
        Availability.office_id == office_id
    ).all()
    
    if not availabilities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee availability found"
        )
    
    # Format availability for AI
    availability_data = []
    for avail in availabilities:
        user = db.query(User).filter(User.id == avail.user_id).first()
        availability_data.append({
            "user_id": avail.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "day_of_week": avail.day_of_week,
            "start_time": avail.start_time.strftime("%H:%M"),
            "end_time": avail.end_time.strftime("%H:%M")
        })
    
    # Format shift requirements
    shift_requirements = [
        {
            "day_of_week": req.day_of_week,
            "start_time": req.start_time.strftime("%H:%M"),
            "end_time": req.end_time.strftime("%H:%M"),
            "min_workers": req.min_workers
        }
        for req in request.shifts_needed
    ]
    
    # Call AI scheduler
    try:
        generated_shifts = generate_schedule(
            availabilities=availability_data,
            shift_requirements=shift_requirements,
            week_start_date=request.week_start_date
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI scheduling failed: {str(e)}"
        )
    
    # Save generated shifts to database
    saved_shifts = []
    for shift_data in generated_shifts:
        shift = Shift(
            office_id=office_id,
            user_id=shift_data["user_id"],
            shift_date=datetime.strptime(shift_data["shift_date"], "%Y-%m-%d").date(),
            start_time=datetime.strptime(shift_data["start_time"], "%H:%M").time(),
            end_time=datetime.strptime(shift_data["end_time"], "%H:%M").time()
        )
        db.add(shift)
        saved_shifts.append(shift)
    
    db.commit()
    
    # Build response with user details
    result = []
    for shift in saved_shifts:
        db.refresh(shift)
        user = db.query(User).filter(User.id == shift.user_id).first()
        result.append(ShiftWithUser(
            id=shift.id,
            office_id=shift.office_id,
            user_id=shift.user_id,
            shift_date=shift.shift_date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            first_name=user.first_name,
            last_name=user.last_name
        ))
    
    return GenerateScheduleResponse(
        shifts=result,
        message=f"Generated {len(result)} shifts"
    )


@router.get("/offices/{office_id}/schedule", response_model=list[ShiftWithUser])
def get_schedule(
    office_id: int,
    week_start: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all shifts for a specific week.
    Any member can view the schedule.
    """
    # Verify membership
    membership = db.query(OfficeMember).filter(
        OfficeMember.user_id == current_user.id,
        OfficeMember.office_id == office_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this office"
        )
    
    # Calculate week end (7 days from start)
    from datetime import timedelta
    week_end = week_start + timedelta(days=6)
    
    # Get shifts for the week
    shifts = db.query(Shift).filter(
        Shift.office_id == office_id,
        Shift.shift_date >= week_start,
        Shift.shift_date <= week_end
    ).order_by(Shift.shift_date, Shift.start_time).all()
    
    # Build response with user details
    result = []
    for shift in shifts:
        user = db.query(User).filter(User.id == shift.user_id).first()
        result.append(ShiftWithUser(
            id=shift.id,
            office_id=shift.office_id,
            user_id=shift.user_id,
            shift_date=shift.shift_date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            first_name=user.first_name,
            last_name=user.last_name
        ))
    
    return result


@router.post("/offices/{office_id}/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(
    office_id: int,
    shift_data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually create a single shift.
    Only employers can create shifts.
    """
    # Verify employer
    require_employer(current_user.id, office_id, db)
    
    # Verify assigned user is member of office
    membership = db.query(OfficeMember).filter(
        OfficeMember.user_id == shift_data.user_id,
        OfficeMember.office_id == office_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user is not a member of this office"
        )
    
    # Create shift
    shift = Shift(
        office_id=office_id,
        user_id=shift_data.user_id,
        shift_date=shift_data.shift_date,
        start_time=shift_data.start_time,
        end_time=shift_data.end_time
    )
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
    
    return shift


@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a shift.
    Only employers can delete shifts.
    """
    # Get shift
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    # Verify employer
    require_employer(current_user.id, shift.office_id, db)
    
    db.delete(shift)
    db.commit()
    
    return None
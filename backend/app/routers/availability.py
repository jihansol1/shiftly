from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Office, OfficeMember, Availability
from app.schemas import (
    AvailabilityUpdate,
    AvailabilityResponse,
    AvailabilityWithUser
)
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/offices",
    tags=["Availability"]
)


def get_membership(user_id: int, office_id: int, db: Session) -> OfficeMember:
    """
    Helper to check if user is member of office.
    Raises 403 if not a member.
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
    
    return membership


@router.put("/{office_id}/availability", response_model=list[AvailabilityResponse])
def update_availability(
    office_id: int,
    availability_data: AvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit or update availability for an office.
    Replaces all existing availability with new data.
    """
    # Verify membership
    get_membership(current_user.id, office_id, db)
    
    # Delete existing availability
    db.query(Availability).filter(
        Availability.user_id == current_user.id,
        Availability.office_id == office_id
    ).delete()
    
    # Add new availability blocks
    new_availabilities = []
    for block in availability_data.availabilities:
        avail = Availability(
            user_id=current_user.id,
            office_id=office_id,
            day_of_week=block.day_of_week,
            start_time=block.start_time,
            end_time=block.end_time
        )
        db.add(avail)
        new_availabilities.append(avail)
    
    db.commit()
    
    # Refresh to get IDs
    for avail in new_availabilities:
        db.refresh(avail)
    
    return new_availabilities


@router.get("/{office_id}/availability/me", response_model=list[AvailabilityResponse])
def get_my_availability(
    office_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's availability for an office.
    """
    # Verify membership
    get_membership(current_user.id, office_id, db)
    
    availabilities = db.query(Availability).filter(
        Availability.user_id == current_user.id,
        Availability.office_id == office_id
    ).order_by(Availability.day_of_week, Availability.start_time).all()
    
    return availabilities


@router.get("/{office_id}/availability/all", response_model=list[AvailabilityWithUser])
def get_all_availability(
    office_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all employees' availability for an office.
    Only employers can access this.
    """
    # Verify employer
    membership = get_membership(current_user.id, office_id, db)
    
    if membership.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can view all availability"
        )
    
    # Get all availability with user info
    availabilities = db.query(Availability).filter(
        Availability.office_id == office_id
    ).order_by(Availability.day_of_week, Availability.start_time).all()
    
    # Build response with user details
    result = []
    for avail in availabilities:
        user = db.query(User).filter(User.id == avail.user_id).first()
        result.append(AvailabilityWithUser(
            id=avail.id,
            user_id=avail.user_id,
            day_of_week=avail.day_of_week,
            start_time=avail.start_time,
            end_time=avail.end_time,
            first_name=user.first_name,
            last_name=user.last_name
        ))
    
    return result
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets
from app.database import get_db
from app.models import User, Office, OfficeMember
from app.schemas import OfficeCreate, OfficeJoin, OfficeResponse, OfficeMemberResponse
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/offices",
    tags=["Offices"]
)


def generate_invite_code() -> str:
    """Generate a random 8-character invite code."""
    return secrets.token_urlsafe(6)[:8].upper()


@router.post("", response_model=OfficeResponse, status_code=status.HTTP_201_CREATED)
def create_office(
    office_data: OfficeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new office. The creator becomes the employer.
    """
    # Generate unique invite code
    invite_code = generate_invite_code()
    
    # Ensure invite code is unique
    while db.query(Office).filter(Office.invite_code == invite_code).first():
        invite_code = generate_invite_code()
    
    # Create office
    new_office = Office(
        name=office_data.name,
        invite_code=invite_code,
        owner_id=current_user.id
    )
    
    db.add(new_office)
    db.commit()
    db.refresh(new_office)
    
    # Add creator as employer member
    membership = OfficeMember(
        user_id=current_user.id,
        office_id=new_office.id,
        role="employer"
    )
    
    db.add(membership)
    db.commit()
    
    return new_office


@router.get("", response_model=list[OfficeResponse])
def get_my_offices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all offices the current user is a member of.
    """
    memberships = db.query(OfficeMember).filter(
        OfficeMember.user_id == current_user.id
    ).all()
    
    office_ids = [m.office_id for m in memberships]
    
    offices = db.query(Office).filter(Office.id.in_(office_ids)).all()
    
    return offices


@router.post("/join", response_model=OfficeResponse)
def join_office(
    join_data: OfficeJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Join an office using invite code.
    """
    # Find office by invite code
    office = db.query(Office).filter(
        Office.invite_code == join_data.invite_code.upper()
    ).first()
    
    if not office:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code"
        )
    
    # Check if already a member
    existing = db.query(OfficeMember).filter(
        OfficeMember.user_id == current_user.id,
        OfficeMember.office_id == office.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this office"
        )
    
    # Add as employee
    membership = OfficeMember(
        user_id=current_user.id,
        office_id=office.id,
        role="employee"
    )
    
    db.add(membership)
    db.commit()
    
    return office


@router.get("/{office_id}/members", response_model=list[OfficeMemberResponse])
def get_office_members(
    office_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all members of an office. Only employers can view this.
    """
    # Check if user is employer of this office
    membership = db.query(OfficeMember).filter(
        OfficeMember.user_id == current_user.id,
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
            detail="Only employers can view all members"
        )
    
    # Get all members with user info
    members = db.query(OfficeMember).filter(
        OfficeMember.office_id == office_id
    ).all()
    
    # Build response with user details
    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        result.append(OfficeMemberResponse(
            id=member.id,
            user_id=member.user_id,
            office_id=member.office_id,
            role=member.role,
            joined_at=member.joined_at,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email
        ))
    
    return result
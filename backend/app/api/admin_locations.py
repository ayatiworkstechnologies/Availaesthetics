
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.csrf import verify_admin_request_origin
from app.core.permissions import require_super_admin
from app.database import get_db
from app.models.admin_user import AdminUser
from app.models.location import Location
from app.schemas.admin_location import (
    AdminLocationCreate,
    AdminLocationUpdate,
    AdminLocationResponse,
)


router = APIRouter(
    prefix="/api/v1/admin/locations",
    tags=["Admin Locations"],
)


# 1. List all clinics
@router.get(
    "",
    response_model=list[AdminLocationResponse],
)
def list_admin_locations(
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    statement = select(Location).order_by(
        Location.id.desc()
    )

    return db.scalars(statement).all()


# 2. Create a draft clinic
@router.post(
    "",
    response_model=AdminLocationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_location(
    payload: AdminLocationCreate,
    request: Request,
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    verify_admin_request_origin(request)

    location = Location(
        name=payload.name,
        slug=payload.slug,
        is_active=True,
        publication_status="draft",
    )

    db.add(location)

    try:
        db.commit()
        db.refresh(location)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Clinic slug already exists",
        )

    return location


# 3. Get a single clinic by ID
@router.get(
    "/{location_id}",
    response_model=AdminLocationResponse,
)
def get_admin_location(
    location_id: int,
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic location not found",
        )

    return location


# 4. Update a draft clinic
@router.put(
    "/{location_id}",
    response_model=AdminLocationResponse,
)
def update_admin_location(
    location_id: int,
    payload: AdminLocationUpdate,
    request: Request,
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    verify_admin_request_origin(request)

    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic location not found",
        )

    # Published clinic editing requires a versioned workflow.
    if location.publication_status != "draft":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only draft clinics can be edited here. "
                "Published clinic changes require a "
                "version-controlled workflow."
            ),
        )

    location.name = payload.name
    location.slug = payload.slug

    try:
        db.commit()
        db.refresh(location)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Clinic slug already exists",
        )

    return location

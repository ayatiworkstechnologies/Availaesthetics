
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
from app.models.location_configuration import (
    LocationConfiguration,
)

from app.schemas.location_configuration import (
    LocationConfigurationUpdate,
    LocationConfigurationResponse,
)


router = APIRouter(
    prefix="/api/v1/admin/locations",
    tags=["Admin Location Configuration"],
)


# GET: Retrieve clinic configuration
@router.get(
    "/{location_id}/configuration",
    response_model=LocationConfigurationResponse,
)
def get_location_configuration(
    location_id: int,
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic location not found",
        )

    configuration = db.scalar(
        select(LocationConfiguration).where(
            LocationConfiguration.location_id
            == location_id
        )
    )

    # A newly created clinic may not have configuration yet.
    if configuration is None:
        return LocationConfigurationResponse(
            location_id=location_id
        )

    return configuration


# PUT: Create or update draft clinic configuration
@router.put(
    "/{location_id}/configuration",
    response_model=LocationConfigurationResponse,
)
def save_location_configuration(
    location_id: int,
    payload: LocationConfigurationUpdate,
    request: Request,
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    # CSRF protection
    verify_admin_request_origin(request)

    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic location not found",
        )

    # Do not directly modify published configurations.
    if location.publication_status != "draft":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only draft clinic configurations "
                "can be edited directly"
            ),
        )

    configuration = db.scalar(
        select(LocationConfiguration).where(
            LocationConfiguration.location_id
            == location_id
        )
    )

    values = payload.model_dump()

    if configuration is None:
        # First-time configuration
        configuration = LocationConfiguration(
            location_id=location_id,
            **values,
        )
        db.add(configuration)

    else:
        # Update existing configuration
        for field_name, value in values.items():
            setattr(
                configuration,
                field_name,
                value,
            )

    try:
        db.commit()
        db.refresh(configuration)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Configuration could not be saved",
        )

    return configuration

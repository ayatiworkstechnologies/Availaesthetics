
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
from app.models.location_operating_hour import (
    LocationOperatingHour,
)

from app.schemas.location_operating_hour import (
    OperatingHoursWeekUpdate,
    OperatingHoursWeekResponse,
)


router = APIRouter(
    prefix="/api/v1/admin/locations",
    tags=["Admin Operating Hours"],
)


def get_clinic_or_404(
    db: Session,
    location_id: int,
) -> Location:
    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic location not found",
        )

    return location


def load_operating_hours(
    db: Session,
    location_id: int,
):
    statement = (
        select(LocationOperatingHour)
        .where(
            LocationOperatingHour.location_id
            == location_id
        )
        .order_by(LocationOperatingHour.day_of_week)
    )

    return db.scalars(statement).all()


# GET: Retrieve clinic operating hours
@router.get(
    "/{location_id}/operating-hours",
    response_model=OperatingHoursWeekResponse,
)
def get_operating_hours(
    location_id: int,
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    get_clinic_or_404(db, location_id)

    hours = load_operating_hours(
        db,
        location_id,
    )

    return {
        "location_id": location_id,
        "configured": len(hours) == 7,
        "days": hours,
    }


# PUT: Save full weekly operating hours
@router.put(
    "/{location_id}/operating-hours",
    response_model=OperatingHoursWeekResponse,
)
def save_operating_hours(
    location_id: int,
    payload: OperatingHoursWeekUpdate,
    request: Request,
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    # Verify the request origin for CSRF protection
    verify_admin_request_origin(request)

    location = get_clinic_or_404(
        db,
        location_id,
    )

    # Only draft clinics can be edited directly.
    if location.publication_status != "draft":
        raise HTTPException(
            status_code=409,
            detail=(
                "Operating hours for published clinics "
                "require a version-controlled workflow"
            ),
        )

    existing_hours = load_operating_hours(
        db,
        location_id,
    )

    existing_by_day = {
        record.day_of_week: record
        for record in existing_hours
    }

    for day in payload.days:
        record = existing_by_day.get(
            day.day_of_week
        )

        if record is None:
            record = LocationOperatingHour(
                location_id=location_id,
                day_of_week=day.day_of_week,
            )
            db.add(record)

        record.is_closed = day.is_closed
        record.opening_time = day.opening_time
        record.closing_time = day.closing_time

    try:
        # All seven days are saved in one transaction.
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to save clinic operating hours",
        )

    updated_hours = load_operating_hours(
        db,
        location_id,
    )

    return {
        "location_id": location_id,
        "configured": len(updated_hours) == 7,
        "days": updated_hours,
    }

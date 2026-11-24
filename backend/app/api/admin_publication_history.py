
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.permissions import require_super_admin
from app.database import get_db

from app.models.admin_user import AdminUser
from app.models.location import Location
from app.models.location_publication_event import (
    LocationPublicationEvent,
)

from app.schemas.publication_history import (
    PublicationHistoryResponse,
)


router = APIRouter(
    prefix="/api/v1/admin/locations",
    tags=["Admin Publication History"],
)


@router.get(
    "/{location_id}/publication-history",
    response_model=PublicationHistoryResponse,
)
def get_publication_history(
    location_id: int,
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    # Step 1: Check clinic exists
    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic location not found",
        )

    # Step 2: Count publication history records
    total = db.scalar(
        select(func.count())
        .select_from(LocationPublicationEvent)
        .where(
            LocationPublicationEvent.location_id
            == location_id
        )
    ) or 0

    # Step 3: Load the most recent publication events
    statement = (
        select(LocationPublicationEvent)
        .where(
            LocationPublicationEvent.location_id
            == location_id
        )
        .order_by(
            LocationPublicationEvent.version_number.desc()
        )
        .limit(limit)
    )

    events = db.scalars(statement).all()

    # Step 4: Return history
    return PublicationHistoryResponse(
        location_id=location.id,
        total=total,
        events=events,
    )


from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.location import Location
from app.schemas.location import LocationPublic


router = APIRouter(
    prefix="/api/v1/public/locations",
    tags=["Public Locations"],
)


@router.get("", response_model=list[LocationPublic])
def list_locations(
    db: Session = Depends(get_db),
):
    statement = (
        select(Location)
        .where(
            Location.is_active.is_(True),
            Location.publication_status == "published",
        )
        .order_by(Location.name)
    )

    locations = db.scalars(statement).all()

    return locations

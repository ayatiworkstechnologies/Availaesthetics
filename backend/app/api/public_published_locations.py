
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.public_published_location import (
    PublicPublishedLocationResponse,
)
from app.services.publication_reader import (
    get_published_location_by_slug,
)


router = APIRouter(
    prefix="/api/v1/public/locations",
    tags=["Public Published Locations"],
)


@router.get(
    "/{slug}/published-content",
    response_model=PublicPublishedLocationResponse,
)
def get_published_location_content(
    slug: str = Path(
        min_length=2,
        max_length=150,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    ),
    db: Session = Depends(get_db),
):
    published_location = (
        get_published_location_by_slug(
            db=db,
            slug=slug,
        )
    )

    if published_location is None:
        raise HTTPException(
            status_code=404,
            detail="Published clinic not found",
        )

    return PublicPublishedLocationResponse(
        location_id=published_location.location_id,
        slug=published_location.slug,
        version_number=published_location.version_number,
        content=published_location.content,
    )

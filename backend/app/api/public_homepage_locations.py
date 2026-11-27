from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.homepage_locations_settings import (
    HomepageLocationsPublicResponse,
)
from app.services.homepage_locations_settings_service import (
    get_homepage_locations_settings,
)


router = APIRouter(
    prefix="/public/homepage/locations",
    tags=["Public Homepage Locations"],
)


@router.get(
    "",
    response_model=HomepageLocationsPublicResponse,
)
def get_public_homepage_locations(
    db: Session = Depends(get_db),
):
    settings = get_homepage_locations_settings(db=db)

    if settings is None or settings.published_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homepage Locations settings are not published.",
        )

    return HomepageLocationsPublicResponse.model_validate(
        settings.published_content
    )


from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.homepage_why_avail import (
    HomepageWhyAvailPublicResponse,
)

from app.services.homepage_why_avail_service import (
    get_global_homepage_why_avail,
)


# =====================================
# PUBLIC ROUTER
# =====================================

router = APIRouter(
    prefix="/public/homepage/why-avail",
    tags=["Public Homepage Why Avail"],
)


# =====================================
# GET PUBLISHED WHY AVAIL CONTENT
# =====================================

@router.get(
    "",
    response_model=HomepageWhyAvailPublicResponse,
)
def get_published_why_avail(
    db: Session = Depends(get_db),
):
    record = get_global_homepage_why_avail(db)

    # Never expose unpublished draft data.
    if (
        record is None
        or record.published_content is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homepage Why Avail is not published",
        )

    return HomepageWhyAvailPublicResponse.model_validate(
        record.published_content
    )

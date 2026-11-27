
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.homepage_testimonials import (
    HomepageTestimonialsPublicResponse,
)

from app.services.homepage_testimonials_service import (
    get_global_homepage_testimonials,
)


# =====================================
# PUBLIC ROUTER
# =====================================

router = APIRouter(
    prefix="/public/homepage/testimonials",
    tags=["Public Homepage Testimonials"],
)


# =====================================
# GET PUBLISHED TESTIMONIALS
# =====================================

@router.get(
    "",
    response_model=HomepageTestimonialsPublicResponse,
)
def get_published_testimonials(
    db: Session = Depends(get_db),
):
    record = get_global_homepage_testimonials(db)

    # Never expose unpublished draft data.
    if (
        record is None
        or record.published_content is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homepage Testimonials is not published",
        )

    return HomepageTestimonialsPublicResponse.model_validate(
        record.published_content
    )

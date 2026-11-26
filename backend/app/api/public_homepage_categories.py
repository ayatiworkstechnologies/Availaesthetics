
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.homepage_categories import (
    HomepageCategoriesPublicResponse,
)

from app.services.homepage_categories_service import (
    get_global_homepage_categories,
)


router = APIRouter(
    prefix="/public/homepage/categories",
    tags=["Public Homepage Categories"],
)


# =====================================
# GET PUBLISHED CATEGORIES
# =====================================

@router.get(
    "",
    response_model=HomepageCategoriesPublicResponse,
)
def get_published_homepage_categories(
    db: Session = Depends(get_db),
):
    record = get_global_homepage_categories(db)

    if record is None or record.published_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homepage Categories are not published",
        )

    return HomepageCategoriesPublicResponse.model_validate(
        record.published_content
    )

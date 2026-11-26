
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.homepage_signature import (
    HomepageSignaturePublicResponse,
)

from app.services.homepage_signature_service import (
    get_global_homepage_signature,
)


# =====================================
# PUBLIC ROUTER
# =====================================

router = APIRouter(
    prefix="/public/homepage/signature",
    tags=["Public Homepage Signature"],
)


# =====================================
# GET PUBLISHED SIGNATURE CONTENT
# =====================================

@router.get(
    "",
    response_model=HomepageSignaturePublicResponse,
)
def get_published_homepage_signature(
    db: Session = Depends(get_db),
):
    record = get_global_homepage_signature(db)

    # Never expose unpublished draft content.
    if (
        record is None
        or record.published_content is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Homepage Signature is not published",
        )

    return HomepageSignaturePublicResponse.model_validate(
        record.published_content
    )

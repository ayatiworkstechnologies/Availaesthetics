
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.homepage_faq import (
    HomepageFaqContent,
    HomepageFaqPublicResponse,
)

from app.services.homepage_faq_service import (
    get_homepage_faq,
)


# =====================================
# PUBLIC FAQ ROUTER
# =====================================

router = APIRouter(
    prefix="/public/homepage/faq",
    tags=["Public Homepage FAQ"],
)


# =====================================
# GET PUBLISHED HOMEPAGE FAQ
# =====================================

@router.get(
    "",
    response_model=HomepageFaqPublicResponse,
)
def get_public_homepage_faq(
    db: Session = Depends(get_db),
):
    """
    Retrieve published global FAQ content.

    Public response includes:
    - Section heading
    - Ordered questions
    - Approved answers or null

    Never expose:
    - Draft content
    - Admin identifiers
    - CMS version metadata
    """

    # ---------------------------------
    # 1. GET GLOBAL FAQ RECORD
    # ---------------------------------

    record = get_homepage_faq(
        db=db,
    )

    # ---------------------------------
    # 2. REQUIRE PUBLISHED CONTENT
    # ---------------------------------

    if (
        record is None
        or record.published_content is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Homepage FAQ content "
                "is not published."
            ),
        )

    # ---------------------------------
    # 3. VALIDATE PUBLISHED SNAPSHOT
    # ---------------------------------

    content = HomepageFaqContent.model_validate(
        record.published_content
    )

    # ---------------------------------
    # 4. RETURN PUBLIC CONTENT ONLY
    # ---------------------------------

    return HomepageFaqPublicResponse(
        heading=content.heading,
        faqs=content.faqs,
    )

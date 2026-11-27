
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db

from app.core.permissions import (
    require_super_admin,
)

from app.core.csrf import (
    verify_admin_request_origin,
)

from app.models.homepage_faq import (
    HomepageFaq,
)

from app.schemas.homepage_faq import (
    HomepageFaqAdminResponse,
    HomepageFaqDraftUpdate,
    HomepageFaqPublishRequest,
)

from app.services.homepage_faq_service import (
    HomepageFaqConflictError,
    HomepageFaqNotFoundError,
    get_homepage_faq,
    save_homepage_faq_draft,
    publish_homepage_faq,
)


# =====================================
# ADMIN FAQ ROUTER
# =====================================

router = APIRouter(
    prefix="/admin/homepage/faq",
    tags=["Admin Homepage FAQ"],
)


# =====================================
# BUILD ADMIN FAQ RESPONSE
# =====================================

def build_admin_response(
    record: HomepageFaq | None,
) -> HomepageFaqAdminResponse:
    """
    Return FAQ draft and published
    content to the Super Admin.

    Never expose this response
    through a public API.
    """

    if record is None:
        return HomepageFaqAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageFaqAdminResponse(
        scope="global",
        draft_content=record.draft_content,
        published_content=record.published_content,
        draft_version=record.draft_version,
        published_version=record.published_version,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


# =====================================
# 1. GET HOMEPAGE FAQ CMS
# =====================================

@router.get(
    "",
    response_model=HomepageFaqAdminResponse,
)
def get_admin_homepage_faq(
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    """
    Retrieve the global FAQ CMS record.

    Returns:
    - Draft content
    - Published content
    - Draft version
    - Published version
    - Relevant timestamps

    Super Admin only.
    """

    record = get_homepage_faq(
        db=db,
    )

    return build_admin_response(
        record
    )


# =====================================
# 2. SAVE HOMEPAGE FAQ DRAFT
# =====================================

@router.put(
    "/draft",
    response_model=HomepageFaqAdminResponse,
)
def save_admin_homepage_faq_draft(
    payload: HomepageFaqDraftUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    """
    Save FAQ heading, questions,
    answers, and ordering as a draft.

    Does not update public content.
    """

    # Existing CSRF protection.
    verify_admin_request_origin(request)

    try:
        record = save_homepage_faq_draft(
            db=db,
            content=payload.content,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            updated_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(
            record
        )

    except HomepageFaqConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Homepage FAQ content was modified "
                "concurrently. Refresh and try again."
            ),
        ) from exc


# =====================================
# 3. PUBLISH HOMEPAGE FAQ
# =====================================

@router.post(
    "/publish",
    response_model=HomepageFaqAdminResponse,
)
def publish_admin_homepage_faq(
    payload: HomepageFaqPublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    """
    Publish the currently saved FAQ draft.

    The published snapshot contains
    only validated content.

    Super Admin only.
    """

    verify_admin_request_origin(request)

    try:
        record = publish_homepage_faq(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(
            record
        )

    except HomepageFaqConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except HomepageFaqNotFoundError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Homepage FAQ could not be published "
                "because of a concurrent update."
            ),
        ) from exc

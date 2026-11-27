
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

from app.core.permissions import require_super_admin
from app.core.csrf import verify_admin_request_origin

from app.models.homepage_why_avail import (
    HomepageWhyAvail,
)

from app.schemas.homepage_why_avail import (
    HomepageWhyAvailAdminResponse,
    HomepageWhyAvailDraftUpdate,
    HomepageWhyAvailPublishRequest,
)

from app.services.homepage_why_avail_service import (
    WhyAvailConflictError,
    WhyAvailNotFoundError,
    get_global_homepage_why_avail,
    save_homepage_why_avail_draft,
    publish_homepage_why_avail,
)


# =====================================
# ADMIN ROUTER
# =====================================

router = APIRouter(
    prefix="/admin/homepage/why-avail",
    tags=["Admin Homepage Why Avail"],
)


# =====================================
# BUILD ADMIN RESPONSE
# =====================================

def build_admin_response(
    record: HomepageWhyAvail | None,
) -> HomepageWhyAvailAdminResponse:

    if record is None:
        return HomepageWhyAvailAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageWhyAvailAdminResponse(
        scope="global",
        draft_content=record.draft_content,
        published_content=record.published_content,
        draft_version=record.draft_version,
        published_version=record.published_version,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


# =====================================
# 1. GET WHY AVAIL CMS DATA
# =====================================

@router.get(
    "",
    response_model=HomepageWhyAvailAdminResponse,
)
def get_why_avail_admin(
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    record = get_global_homepage_why_avail(db)

    return build_admin_response(record)


# =====================================
# 2. SAVE WHY AVAIL DRAFT
# =====================================

@router.put(
    "/draft",
    response_model=HomepageWhyAvailAdminResponse,
)
def save_why_avail_draft(
    payload: HomepageWhyAvailDraftUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = save_homepage_why_avail_draft(
            db=db,
            content=payload.content,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            updated_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(record)

    except WhyAvailConflictError as exc:
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
                "Why Avail content was updated concurrently. "
                "Refresh the CMS and try again."
            ),
        ) from exc


# =====================================
# 3. PUBLISH WHY AVAIL CONTENT
# =====================================

@router.post(
    "/publish",
    response_model=HomepageWhyAvailAdminResponse,
)
def publish_why_avail(
    payload: HomepageWhyAvailPublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = publish_homepage_why_avail(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(record)

    except WhyAvailConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except WhyAvailNotFoundError as exc:
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
                "Why Avail could not be published "
                "because of a concurrent update."
            ),
        ) from exc

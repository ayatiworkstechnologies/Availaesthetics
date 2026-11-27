
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

from app.schemas.homepage_testimonials import (
    HomepageTestimonialsAdminResponse,
    HomepageTestimonialsDraftUpdate,
    HomepageTestimonialsPublishRequest,
)

from app.services.homepage_testimonials_service import (
    TestimonialsConflictError,
    TestimonialsNotFoundError,
    get_global_homepage_testimonials,
    save_homepage_testimonials_draft,
    publish_homepage_testimonials,
)


# =====================================
# ADMIN ROUTER
# =====================================

router = APIRouter(
    prefix="/admin/homepage/testimonials",
    tags=["Admin Homepage Testimonials"],
)


# =====================================
# BUILD ADMIN RESPONSE
# =====================================

def build_admin_response(
    record,
) -> HomepageTestimonialsAdminResponse:

    if record is None:
        return HomepageTestimonialsAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageTestimonialsAdminResponse(
        scope="global",
        draft_content=record.draft_content,
        published_content=record.published_content,
        draft_version=record.draft_version,
        published_version=record.published_version,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


# =====================================
# 1. GET TESTIMONIALS CMS DATA
# =====================================

@router.get(
    "",
    response_model=HomepageTestimonialsAdminResponse,
)
def get_testimonials_admin(
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    record = get_global_homepage_testimonials(db)

    return build_admin_response(record)


# =====================================
# 2. SAVE TESTIMONIALS DRAFT
# =====================================

@router.put(
    "/draft",
    response_model=HomepageTestimonialsAdminResponse,
)
def save_testimonials_draft(
    payload: HomepageTestimonialsDraftUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = save_homepage_testimonials_draft(
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

    except TestimonialsConflictError as exc:
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
                "Testimonials content was updated "
                "concurrently. Refresh and try again."
            ),
        ) from exc


# =====================================
# 3. PUBLISH TESTIMONIALS
# =====================================

@router.post(
    "/publish",
    response_model=HomepageTestimonialsAdminResponse,
)
def publish_testimonials(
    payload: HomepageTestimonialsPublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = publish_homepage_testimonials(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(record)

    except TestimonialsConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except TestimonialsNotFoundError as exc:
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
                "Testimonials could not be published "
                "because of a concurrent update."
            ),
        ) from exc

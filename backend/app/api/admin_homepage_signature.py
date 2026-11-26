
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

from app.schemas.homepage_signature import (
    HomepageSignatureAdminResponse,
    HomepageSignatureDraftUpdate,
    HomepageSignaturePublishRequest,
)

from app.services.homepage_signature_service import (
    SignatureConflictError,
    SignatureNotFoundError,
    get_global_homepage_signature,
    save_homepage_signature_draft,
    publish_homepage_signature,
)


# =====================================
# ADMIN ROUTER
# =====================================

router = APIRouter(
    prefix="/admin/homepage/signature",
    tags=["Admin Homepage Signature"],
)


# =====================================
# RESPONSE HELPER
# =====================================

def build_admin_response(
    record,
) -> HomepageSignatureAdminResponse:

    if record is None:
        return HomepageSignatureAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageSignatureAdminResponse(
        scope="global",
        draft_content=record.draft_content,
        published_content=record.published_content,
        draft_version=record.draft_version,
        published_version=record.published_version,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


# =====================================
# 1. GET SIGNATURE CMS DATA
# =====================================

@router.get(
    "",
    response_model=HomepageSignatureAdminResponse,
)
def get_signature_admin(
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    record = get_global_homepage_signature(db)

    return build_admin_response(record)


# =====================================
# 2. SAVE SIGNATURE DRAFT
# =====================================

@router.put(
    "/draft",
    response_model=HomepageSignatureAdminResponse,
)
def save_signature_draft(
    payload: HomepageSignatureDraftUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = save_homepage_signature_draft(
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

    except SignatureConflictError as exc:
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
                "Signature content was updated concurrently. "
                "Refresh the CMS and try again."
            ),
        ) from exc


# =====================================
# 3. PUBLISH SIGNATURE CONTENT
# =====================================

@router.post(
    "/publish",
    response_model=HomepageSignatureAdminResponse,
)
def publish_signature(
    payload: HomepageSignaturePublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = publish_homepage_signature(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(record)

    except SignatureConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except SignatureNotFoundError as exc:
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
                "Signature content could not be published "
                "because of a concurrent update."
            ),
        ) from exc

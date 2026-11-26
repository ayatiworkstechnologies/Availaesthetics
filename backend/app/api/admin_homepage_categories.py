
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

from app.schemas.homepage_categories import (
    HomepageCategoriesAdminResponse,
    HomepageCategoriesDraftUpdate,
    HomepageCategoriesPublishRequest,
)

from app.services.homepage_categories_service import (
    CategoriesConflictError,
    CategoriesNotFoundError,
    get_global_homepage_categories,
    save_homepage_categories_draft,
    publish_homepage_categories,
)


router = APIRouter(
    prefix="/admin/homepage/categories",
    tags=["Admin Homepage Categories"],
)


# =====================================
# ADMIN RESPONSE HELPER
# =====================================

def build_admin_response(record):
    if record is None:
        return HomepageCategoriesAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageCategoriesAdminResponse(
        scope="global",
        draft_content=record.draft_content,
        published_content=record.published_content,
        draft_version=record.draft_version,
        published_version=record.published_version,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


# =====================================
# 1. GET CATEGORIES CMS
# =====================================

@router.get(
    "",
    response_model=HomepageCategoriesAdminResponse,
)
def get_homepage_categories_admin(
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    record = get_global_homepage_categories(db)

    return build_admin_response(record)


# =====================================
# 2. SAVE CATEGORIES DRAFT
# =====================================

@router.put(
    "/draft",
    response_model=HomepageCategoriesAdminResponse,
)
def save_categories_draft(
    payload: HomepageCategoriesDraftUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = save_homepage_categories_draft(
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

    except CategoriesConflictError as exc:
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
                "Categories were updated concurrently. "
                "Refresh the CMS and try again."
            ),
        ) from exc


# =====================================
# 3. PUBLISH CATEGORIES
# =====================================

@router.post(
    "/publish",
    response_model=HomepageCategoriesAdminResponse,
)
def publish_categories(
    payload: HomepageCategoriesPublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    verify_admin_request_origin(request)

    try:
        record = publish_homepage_categories(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(record)

    except CategoriesConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except CategoriesNotFoundError as exc:
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
                "Categories could not be published "
                "because of a concurrent update."
            ),
        ) from exc

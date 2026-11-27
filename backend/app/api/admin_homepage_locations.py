
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

from app.models.homepage_locations_settings import (
    HomepageLocationsSettings,
)

from app.schemas.homepage_locations_settings import (
    HomepageLocationsAdminResponse,
    HomepageLocationsDraftUpdate,
    HomepageLocationsPublishRequest,
)

from app.services.homepage_locations_settings_service import (
    HomepageLocationsConflictError,
    HomepageLocationsNotFoundError,
    HomepageLocationsValidationError,
    get_homepage_locations_settings,
    save_homepage_locations_draft,
    publish_homepage_locations,
)


# =====================================
# ADMIN HOMEPAGE LOCATIONS ROUTER
# =====================================

router = APIRouter(
    prefix="/admin/homepage/locations",
    tags=["Admin Homepage Locations"],
)


# =====================================
# BUILD ADMIN RESPONSE
# =====================================

def build_admin_response(
    record: HomepageLocationsSettings | None,
) -> HomepageLocationsAdminResponse:
    """
    Build the response for the
    Super Admin homepage locations CMS.
    """

    if record is None:
        return HomepageLocationsAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageLocationsAdminResponse(
        scope="global",
        draft_content=record.draft_content,
        published_content=record.published_content,
        draft_version=record.draft_version,
        published_version=record.published_version,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


# =====================================
# 1. GET HOMEPAGE LOCATIONS CMS
# =====================================

@router.get(
    "",
    response_model=HomepageLocationsAdminResponse,
)
def get_admin_homepage_locations(
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    """
    Retrieve global homepage locations
    settings, including draft and
    published content.

    Super Admin only.
    """

    record = get_homepage_locations_settings(
        db=db,
    )

    return build_admin_response(record)


# =====================================
# 2. SAVE HOMEPAGE LOCATIONS DRAFT
# =====================================

@router.put(
    "/draft",
    response_model=HomepageLocationsAdminResponse,
)
def save_admin_homepage_locations_draft(
    payload: HomepageLocationsDraftUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    """
    Save heading, description, location
    order and default selected clinic.

    Does not modify published content.
    """

    verify_admin_request_origin(request)

    try:
        record = save_homepage_locations_draft(
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

    except HomepageLocationsConflictError as exc:
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
                "Homepage Locations settings "
                "were modified concurrently. "
                "Refresh the CMS and try again."
            ),
        ) from exc


# =====================================
# 3. PUBLISH HOMEPAGE LOCATIONS
# =====================================

@router.post(
    "/publish",
    response_model=HomepageLocationsAdminResponse,
)
def publish_admin_homepage_locations(
    payload: HomepageLocationsPublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(require_super_admin),
):
    """
    Publish saved homepage locations
    settings after validating clinics.

    A clinic is eligible only when
    the existing publication reader
    confirms its published snapshot.
    """

    verify_admin_request_origin(request)

    try:
        record = publish_homepage_locations(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=admin.id,
        )

        db.commit()
        db.refresh(record)

        return build_admin_response(record)

    except HomepageLocationsConflictError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except HomepageLocationsNotFoundError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except HomepageLocationsValidationError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Homepage Locations could not "
                "be published due to a "
                "concurrent database update."
            ),
        ) from exc

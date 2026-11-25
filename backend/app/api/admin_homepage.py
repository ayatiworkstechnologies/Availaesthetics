
import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.csrf import (
    verify_admin_request_origin,
)

from app.core.permissions import (
    require_super_admin,
)

from app.database import get_db

from app.models.admin_user import AdminUser
from app.models.homepage_hero import HomepageHero

from app.schemas.homepage_hero import (
    HomepageHeroAdminResponse,
    HomepageHeroDraftUpdate,
    HomepageHeroPublishRequest,
)

from app.services.homepage_hero_service import (
    HeroDraftVersionConflict,
    HeroPublishConflict,
    get_global_homepage_hero,
    save_homepage_hero_draft,
    publish_homepage_hero,
)


# =====================================
# ROUTER
# =====================================

router = APIRouter(
    prefix="/api/v1/admin/homepage",
    tags=["Admin Homepage"],
)

logger = logging.getLogger(__name__)


# =====================================
# BUILD ADMIN HERO RESPONSE
# =====================================

def build_hero_response(
    hero: HomepageHero | None,
) -> HomepageHeroAdminResponse:
    """
    Format Hero data for the authenticated
    Super Admin dashboard.
    """

    if hero is None:
        return HomepageHeroAdminResponse(
            scope="global",
            draft_content=None,
            published_content=None,
            draft_version=0,
            published_version=0,
            updated_at=None,
            published_at=None,
        )

    return HomepageHeroAdminResponse(
        scope="global",
        draft_content=hero.draft_content,
        published_content=hero.published_content,
        draft_version=hero.draft_version,
        published_version=hero.published_version,
        updated_at=hero.updated_at,
        published_at=hero.published_at,
    )


# =====================================
# 1. GET ADMIN HOMEPAGE HERO
# =====================================

@router.get(
    "/hero",
    response_model=HomepageHeroAdminResponse,
)
def get_admin_homepage_hero(
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Super Admin only.

    Return the draft and published versions.
    """

    hero = get_global_homepage_hero(db)

    return build_hero_response(hero)


# =====================================
# 2. SAVE HOMEPAGE HERO DRAFT
# =====================================

@router.put(
    "/hero/draft",
    response_model=HomepageHeroAdminResponse,
    status_code=status.HTTP_200_OK,
)
def update_admin_homepage_hero_draft(
    payload: HomepageHeroDraftUpdate,
    request: Request,
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Save the Hero draft without publishing.
    """

    # Verify existing CSRF origin policy.
    verify_admin_request_origin(request)

    try:
        hero = save_homepage_hero_draft(
            db=db,
            content=payload.content,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            updated_by_admin_id=current_admin.id,
        )

        db.commit()
        db.refresh(hero)

    except HeroDraftVersionConflict:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Hero draft was modified. "
                "Reload the latest version "
                "before saving."
            ),
        ) from None

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Hero record changed during saving. "
                "Reload and retry."
            ),
        ) from None

    return build_hero_response(hero)


# =====================================
# 3. PUBLISH HOMEPAGE HERO - NEW
# =====================================

@router.post(
    "/hero/publish",
    response_model=HomepageHeroAdminResponse,
    status_code=status.HTTP_200_OK,
)
def publish_admin_homepage_hero(
    payload: HomepageHeroPublishRequest,
    request: Request,
    current_admin: AdminUser = Depends(
        require_super_admin
    ),
    db: Session = Depends(get_db),
):
    """
    Publish a saved global Homepage Hero.

    Security:
    - Valid admin session required.
    - SUPER_ADMIN role required.
    - Existing origin verification required.

    Publishing:
    - Check requested draft version.
    - Validate saved draft content.
    - Update the published snapshot.
    - Record the publishing admin.
    - Commit the transaction.
    """

    # ---------------------------------
    # 1. Verify request origin
    # ---------------------------------

    verify_admin_request_origin(request)

    # ---------------------------------
    # 2. Publish the saved draft
    # ---------------------------------

    try:
        hero = publish_homepage_hero(
            db=db,
            expected_draft_version=(
                payload.expected_draft_version
            ),
            published_by_admin_id=current_admin.id,
        )

        # ---------------------------------
        # 3. Commit the transaction
        # ---------------------------------

        db.commit()

        # Refresh database-generated values.
        db.refresh(hero)

    # ---------------------------------
    # 4. Handle version conflicts
    # ---------------------------------

    except HeroPublishConflict as exc:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    # ---------------------------------
    # 5. Handle invalid saved content
    # ---------------------------------

    except ValidationError:
        db.rollback()

        logger.exception(
            "Saved Homepage Hero draft failed validation"
        )

        raise HTTPException(
            status_code=409,
            detail=(
                "The saved Hero draft is invalid. "
                "Correct and save it before publishing."
            ),
        ) from None

    # ---------------------------------
    # 6. Return published content
    # ---------------------------------

    return build_hero_response(hero)

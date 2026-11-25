
import logging

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine
from app.models.homepage_hero import HomepageHero
from app.schemas.homepage_hero import (
    HomepageHeroPublicResponse,
)


# =====================================
# PUBLIC HOMEPAGE ROUTER
# =====================================

router = APIRouter(
    prefix="/api/v1/public/homepage",
    tags=["Public Homepage"],
)

logger = logging.getLogger(__name__)


# =====================================
# GET PUBLISHED HOMEPAGE HERO
# =====================================

@router.get(
    "/hero",
    response_model=HomepageHeroPublicResponse,
)
def get_published_homepage_hero():
    """
    Return the published global homepage
    Hero content.

    Draft content is never returned.
    """

    # ---------------------------------
    # 1. Connect to the database
    # ---------------------------------

    with Session(engine) as db:

        # ---------------------------------
        # 2. Find the global Hero record
        # ---------------------------------

        statement = select(HomepageHero).where(
            HomepageHero.scope == "global"
        )

        hero = db.scalar(statement)

        # ---------------------------------
        # 3. Check publication status
        # ---------------------------------

        if (
            hero is None
            or hero.published_content is None
        ):
            raise HTTPException(
                status_code=404,
                detail="Homepage Hero is not published",
            )

        # ---------------------------------
        # 4. Validate published JSON
        # ---------------------------------

        try:
            published_hero = (
                HomepageHeroPublicResponse.model_validate(
                    hero.published_content
                )
            )

        except ValidationError:
            logger.exception(
                "Invalid published homepage Hero content"
            )

            raise HTTPException(
                status_code=500,
                detail="Published homepage content is invalid",
            ) from None

        # ---------------------------------
        # 5. Return published content
        # ---------------------------------

        return published_hero

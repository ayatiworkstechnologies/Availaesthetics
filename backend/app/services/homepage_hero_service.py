
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import utc_now
from app.models.homepage_hero import HomepageHero
from app.schemas.homepage_hero import (
    HomepageHeroContent,
)


# =====================================
# EXCEPTIONS
# =====================================

class HeroDraftVersionConflict(Exception):
    """
    Raised when an admin tries to save
    an outdated draft.
    """

    pass


class HeroPublishConflict(Exception):
    """
    Raised when the requested Hero draft
    cannot be published.
    """

    pass


# =====================================
# GET GLOBAL HOMEPAGE HERO
# =====================================

def get_global_homepage_hero(
    db: Session,
) -> HomepageHero | None:
    """
    Read the global Homepage Hero record.
    """

    statement = select(HomepageHero).where(
        HomepageHero.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# SAVE HOMEPAGE HERO DRAFT
# =====================================

def save_homepage_hero_draft(
    db: Session,
    content: HomepageHeroContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageHero:
    """
    Save a validated global Hero draft.

    - Check the expected draft version.
    - Record the admin who saved the draft.
    - Do not modify published content.
    - Do not commit the transaction.
    """

    statement = (
        select(HomepageHero)
        .where(HomepageHero.scope == "global")
        .with_for_update()
    )

    hero = db.scalar(statement)

    validated_content = content.model_dump(
        mode="json"
    )

    # Create the first draft
    if hero is None:

        if expected_draft_version != 0:
            raise HeroDraftVersionConflict(
                "Hero draft version conflict"
            )

        hero = HomepageHero(
            scope="global",
            draft_content=validated_content,
            published_content=None,
            draft_version=1,
            published_version=0,
            updated_by_admin_id=updated_by_admin_id,
            published_by_admin_id=None,
        )

        db.add(hero)

    # Update an existing draft
    else:

        if (
            hero.draft_version
            != expected_draft_version
        ):
            raise HeroDraftVersionConflict(
                "Hero draft version conflict"
            )

        hero.draft_content = validated_content
        hero.draft_version += 1

        hero.updated_by_admin_id = (
            updated_by_admin_id
        )

    db.flush()

    return hero


# =====================================
# PUBLISH HOMEPAGE HERO - NEW
# =====================================

def publish_homepage_hero(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageHero:
    """
    Publish the current global Hero draft.

    Rules:
    - Only a protected API may call this.
    - Verify that a draft exists.
    - Reject an outdated draft version.
    - Reject publishing the same version twice.
    - Revalidate the stored draft.
    - Update the published snapshot.
    - Record the publishing admin and time.
    - Do not commit the transaction here.
    """

    # ---------------------------------
    # 1. Lock the existing Hero record
    # ---------------------------------

    statement = (
        select(HomepageHero)
        .where(HomepageHero.scope == "global")
        .with_for_update()
    )

    hero = db.scalar(statement)

    # ---------------------------------
    # 2. Verify a saved draft exists
    # ---------------------------------

    if (
        hero is None
        or hero.draft_content is None
    ):
        raise HeroPublishConflict(
            "No Hero draft exists to publish."
        )

    # ---------------------------------
    # 3. Verify the expected version
    # ---------------------------------

    if (
        hero.draft_version
        != expected_draft_version
    ):
        raise HeroPublishConflict(
            "Hero draft has changed. "
            "Reload the latest draft before publishing."
        )

    # ---------------------------------
    # 4. Prevent duplicate publishing
    # ---------------------------------

    if (
        hero.published_content is not None
        and hero.published_version
        == hero.draft_version
    ):
        raise HeroPublishConflict(
            "This Hero draft version is already published."
        )

    # ---------------------------------
    # 5. Validate the stored JSON
    # ---------------------------------

    validated_content = (
        HomepageHeroContent.model_validate(
            hero.draft_content
        ).model_dump(mode="json")
    )

    # ---------------------------------
    # 6. Publish the validated snapshot
    # ---------------------------------

    hero.published_content = validated_content

    hero.published_version = hero.draft_version

    # ---------------------------------
    # 7. Record publishing information
    # ---------------------------------

    hero.published_by_admin_id = (
        published_by_admin_id
    )

    hero.published_at = utc_now()

    # ---------------------------------
    # 8. Flush without committing
    # ---------------------------------

    db.flush()

    return hero

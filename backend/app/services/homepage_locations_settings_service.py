
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.homepage_locations_settings import (
    HomepageLocationsSettings,
)

from app.schemas.homepage_locations_settings import (
    HomepageLocationsContent,
)



# =====================================
# SERVICE EXCEPTIONS
# =====================================

class HomepageLocationsConflictError(Exception):
    """Draft version does not match."""
    pass


class HomepageLocationsNotFoundError(Exception):
    """No saved draft is available."""
    pass


class HomepageLocationsValidationError(Exception):
    """Selected clinics are not eligible."""
    pass


# =====================================
# UTC TIMESTAMP
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# 1. GET GLOBAL HOMEPAGE SETTINGS
# =====================================

def get_homepage_locations_settings(
    db: Session,
) -> HomepageLocationsSettings | None:
    """
    Retrieve the global homepage
    locations CMS record.

    Returns None when no settings
    record exists yet.
    """

    statement = select(
        HomepageLocationsSettings
    ).where(
        HomepageLocationsSettings.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# 2. SAVE HOMEPAGE LOCATIONS DRAFT
# =====================================

def save_homepage_locations_draft(
    db: Session,
    content: HomepageLocationsContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageLocationsSettings:
    """
    Save homepage settings as a draft.

    Draft content includes:
    - Section heading
    - Section description
    - Ordered clinic location IDs
    - Default selected location ID

    Saving a draft does not modify
    published content.

    Database commit is managed by
    the API endpoint.
    """

    statement = (
        select(HomepageLocationsSettings)
        .where(
            HomepageLocationsSettings.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # INITIAL DRAFT
    # ---------------------------------

    if record is None:
        if expected_draft_version != 0:
            raise HomepageLocationsConflictError(
                "Homepage Locations draft version "
                "conflict. Refresh before saving."
            )

        record = HomepageLocationsSettings(
            scope="global",
            draft_version=0,
            published_version=0,
        )

        db.add(record)

    # ---------------------------------
    # EXISTING DRAFT VERSION CHECK
    # ---------------------------------

    elif (
        record.draft_version
        != expected_draft_version
    ):
        raise HomepageLocationsConflictError(
            "Homepage Locations content was "
            "modified by another administrator. "
            "Refresh and try again."
        )

    # ---------------------------------
    # SAVE VALIDATED DRAFT CONTENT
    # ---------------------------------

    record.draft_content = content.model_dump(
        mode="json"
    )

    record.draft_version += 1

    record.updated_by_admin_id = (
        updated_by_admin_id
    )

    record.updated_at = utc_now()

    # Flush changes without committing.
    db.flush()

    return record


# =====================================
# 3. VALIDATE HOMEPAGE LOCATIONS
# =====================================

def validate_selected_locations(
    content: HomepageLocationsContent,
) -> None:
    """
    Validate the selected homepage clinics.

    The actual clinic verification is
    performed by the supplied validator.

    Reject publication if:
    - No clinic is selected.
    - Validator returns invalid data.
    - Any selected clinic is not published.
    """

    if not content.locations:
        raise HomepageLocationsValidationError(
            "Add at least one homepage location "
            "before publishing."
        )


# =====================================
# 5. PUBLISH HOMEPAGE LOCATIONS
# =====================================

def publish_homepage_locations(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageLocationsSettings:
    """
    Publish validated homepage settings.

    Published JSON contains:
    - Heading
    - Description
    - Ordered clinic location IDs
    - Default selected clinic ID

    Clinic addresses, phone numbers
    and other details are not duplicated.

    Database commit is managed by
    the API endpoint.
    """

    statement = (
        select(HomepageLocationsSettings)
        .where(
            HomepageLocationsSettings.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # REQUIRE EXISTING DRAFT
    # ---------------------------------

    if (
        record is None
        or record.draft_content is None
    ):
        raise HomepageLocationsNotFoundError(
            "No Homepage Locations draft exists. "
            "Save a draft before publishing."
        )

    # ---------------------------------
    # CHECK DRAFT VERSION
    # ---------------------------------

    if (
        record.draft_version
        != expected_draft_version
    ):
        raise HomepageLocationsConflictError(
            "Homepage Locations draft has changed. "
            "Refresh before publishing."
        )

    # ---------------------------------
    # PREVENT DUPLICATE PUBLICATION
    # ---------------------------------

    if (
        record.published_content is not None
        and record.published_version
        == record.draft_version
    ):
        raise HomepageLocationsConflictError(
            "This Homepage Locations draft "
            "is already published."
        )

    # ---------------------------------
    # REVALIDATE STORED DRAFT
    # ---------------------------------

    validated_content = (
        HomepageLocationsContent.model_validate(
            record.draft_content
        )
    )

    # ---------------------------------
    # VERIFY SELECTED CLINICS
    # ---------------------------------

    validate_selected_locations(
        content=validated_content,
    )

    # ---------------------------------
    # CREATE PUBLISHED SNAPSHOT
    # ---------------------------------

    record.published_content = (
        validated_content.model_dump(
            mode="json"
        )
    )

    record.published_version = (
        record.draft_version
    )

    record.published_by_admin_id = (
        published_by_admin_id
    )

    record.published_at = utc_now()

    # Flush without committing.
    db.flush()

    return record


from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.homepage_why_avail import (
    HomepageWhyAvail,
)

from app.schemas.homepage_why_avail import (
    HomepageWhyAvailContent,
)


# =====================================
# CUSTOM SERVICE EXCEPTIONS
# =====================================

class WhyAvailConflictError(Exception):
    """
    Raised when the expected draft version
    does not match the database version.
    """
    pass


class WhyAvailNotFoundError(Exception):
    """
    Raised when there is no saved draft
    available for publishing.
    """
    pass


# =====================================
# UTC TIMESTAMP
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# 1. GET GLOBAL WHY AVAIL CONTENT
# =====================================

def get_global_homepage_why_avail(
    db: Session,
) -> HomepageWhyAvail | None:
    """
    Retrieve the global Why Avail CMS record.
    """

    statement = select(HomepageWhyAvail).where(
        HomepageWhyAvail.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# 2. SAVE WHY AVAIL DRAFT
# =====================================

def save_homepage_why_avail_draft(
    db: Session,
    content: HomepageWhyAvailContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageWhyAvail:
    """
    Save the validated Why Avail content
    as a draft without modifying the
    published snapshot.

    Transaction commit is managed by
    the FastAPI endpoint.
    """

    # Lock the existing record to prevent
    # concurrent modifications.
    statement = (
        select(HomepageWhyAvail)
        .where(
            HomepageWhyAvail.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # FIRST-TIME DRAFT
    # ---------------------------------

    if record is None:
        if expected_draft_version != 0:
            raise WhyAvailConflictError(
                "Why Avail draft version conflict. "
                "Refresh the CMS before saving."
            )

        record = HomepageWhyAvail(
            scope="global",
            draft_version=0,
            published_version=0,
        )

        db.add(record)

    # ---------------------------------
    # EXISTING DRAFT VERSION CHECK
    # ---------------------------------

    elif (
        record.draft_version !=
        expected_draft_version
    ):
        raise WhyAvailConflictError(
            "Another administrator has updated "
            "the Why Avail content. "
            "Refresh the CMS and try again."
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

    # Flush SQL changes but do not commit.
    db.flush()

    return record


# =====================================
# 3. PUBLISH WHY AVAIL CONTENT
# =====================================

def publish_homepage_why_avail(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageWhyAvail:
    """
    Publish an existing saved draft.

    Published content is a validated
    snapshot of the current draft.
    """

    statement = (
        select(HomepageWhyAvail)
        .where(
            HomepageWhyAvail.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # DRAFT MUST EXIST
    # ---------------------------------

    if (
        record is None
        or record.draft_content is None
    ):
        raise WhyAvailNotFoundError(
            "No Why Avail draft exists. "
            "Save a draft before publishing."
        )

    # ---------------------------------
    # VERIFY DRAFT VERSION
    # ---------------------------------

    if (
        record.draft_version !=
        expected_draft_version
    ):
        raise WhyAvailConflictError(
            "Why Avail draft has changed. "
            "Refresh the CMS before publishing."
        )

    # ---------------------------------
    # PREVENT DUPLICATE PUBLISHING
    # ---------------------------------

    if (
        record.published_content is not None
        and record.published_version ==
        record.draft_version
    ):
        raise WhyAvailConflictError(
            "This Why Avail draft is already published."
        )

    # ---------------------------------
    # REVALIDATE STORED DRAFT
    # ---------------------------------

    validated_content = (
        HomepageWhyAvailContent.model_validate(
            record.draft_content
        )
    )

    # ---------------------------------
    # COPY DRAFT TO PUBLISHED SNAPSHOT
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

    # Database commit happens in API layer.
    db.flush()

    return record

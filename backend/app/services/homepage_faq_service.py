
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.homepage_faq import HomepageFaq

from app.schemas.homepage_faq import (
    HomepageFaqContent,
)


# =====================================
# SERVICE EXCEPTIONS
# =====================================

class HomepageFaqConflictError(Exception):
    """
    Raised when a request uses
    an outdated draft version.
    """

    pass


class HomepageFaqNotFoundError(Exception):
    """
    Raised when no saved FAQ
    draft is available.
    """

    pass


# =====================================
# UTC TIMESTAMP
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# 1. GET GLOBAL HOMEPAGE FAQ SETTINGS
# =====================================

def get_homepage_faq(
    db: Session,
) -> HomepageFaq | None:
    """
    Retrieve the global Homepage FAQ
    CMS record.

    Returns None when the CMS has
    not been initialized.
    """

    statement = select(
        HomepageFaq
    ).where(
        HomepageFaq.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# 2. SAVE HOMEPAGE FAQ DRAFT
# =====================================

def save_homepage_faq_draft(
    db: Session,
    content: HomepageFaqContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageFaq:
    """
    Save the FAQ heading and ordered
    question/answer list as a draft.

    Saving does not change the
    published homepage content.

    The API endpoint manages the
    transaction commit.
    """

    statement = (
        select(HomepageFaq)
        .where(
            HomepageFaq.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # INITIAL FAQ DRAFT
    # ---------------------------------

    if record is None:
        if expected_draft_version != 0:
            raise HomepageFaqConflictError(
                "Homepage FAQ draft version conflict. "
                "Refresh the CMS before saving."
            )

        record = HomepageFaq(
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
        raise HomepageFaqConflictError(
            "Homepage FAQ content was modified "
            "by another administrator. "
            "Refresh before saving."
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

    # Flush without committing.
    db.flush()

    return record


# =====================================
# 3. PUBLISH HOMEPAGE FAQ
# =====================================

def publish_homepage_faq(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageFaq:
    """
    Publish the current saved FAQ draft.

    The published snapshot contains:
    - Section heading
    - Ordered FAQ entries
    - Questions
    - Approved answers or null

    The API endpoint handles commit.
    """

    statement = (
        select(HomepageFaq)
        .where(
            HomepageFaq.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # REQUIRE EXISTING SAVED DRAFT
    # ---------------------------------

    if (
        record is None
        or record.draft_content is None
    ):
        raise HomepageFaqNotFoundError(
            "No Homepage FAQ draft exists. "
            "Save a draft before publishing."
        )

    # ---------------------------------
    # CHECK OPTIMISTIC CONCURRENCY
    # ---------------------------------

    if (
        record.draft_version
        != expected_draft_version
    ):
        raise HomepageFaqConflictError(
            "Homepage FAQ draft has changed. "
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
        raise HomepageFaqConflictError(
            "This Homepage FAQ draft "
            "has already been published."
        )

    # ---------------------------------
    # REVALIDATE SAVED DRAFT CONTENT
    # ---------------------------------

    validated_content = (
        HomepageFaqContent.model_validate(
            record.draft_content
        )
    )

    # ---------------------------------
    # PUBLISH VALIDATED SNAPSHOT
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

    db.flush()

    return record

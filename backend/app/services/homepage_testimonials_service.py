
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.homepage_testimonials import (
    HomepageTestimonials,
)

from app.schemas.homepage_testimonials import (
    HomepageTestimonialsContent,
)


# =====================================
# CUSTOM SERVICE EXCEPTIONS
# =====================================

class TestimonialsConflictError(Exception):
    """
    Raised when an outdated draft version
    is used for saving or publishing.
    """
    pass


class TestimonialsNotFoundError(Exception):
    """
    Raised when no saved draft exists
    for publishing.
    """
    pass


# =====================================
# UTC TIMESTAMP
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# 1. GET GLOBAL TESTIMONIALS
# =====================================

def get_global_homepage_testimonials(
    db: Session,
) -> HomepageTestimonials | None:

    statement = select(HomepageTestimonials).where(
        HomepageTestimonials.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# 2. SAVE TESTIMONIALS DRAFT
# =====================================

def save_homepage_testimonials_draft(
    db: Session,
    content: HomepageTestimonialsContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageTestimonials:

    # Lock an existing record during editing.
    statement = (
        select(HomepageTestimonials)
        .where(
            HomepageTestimonials.scope == "global"
        )
        .with_for_update()
    )

    record = db.scalar(statement)

    # ---------------------------------
    # FIRST-TIME DRAFT
    # ---------------------------------

    if record is None:
        if expected_draft_version != 0:
            raise TestimonialsConflictError(
                "Testimonials draft version conflict. "
                "Refresh the CMS before saving."
            )

        record = HomepageTestimonials(
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
        raise TestimonialsConflictError(
            "Another administrator has updated "
            "the Testimonials content. "
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

    # The FastAPI endpoint manages
    # transaction commit/rollback.
    db.flush()

    return record


# =====================================
# 3. PUBLISH TESTIMONIALS
# =====================================

def publish_homepage_testimonials(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageTestimonials:

    statement = (
        select(HomepageTestimonials)
        .where(
            HomepageTestimonials.scope == "global"
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
        raise TestimonialsNotFoundError(
            "No Testimonials draft exists. "
            "Save a draft before publishing."
        )

    # ---------------------------------
    # VERSION CONFLICT CHECK
    # ---------------------------------

    if (
        record.draft_version !=
        expected_draft_version
    ):
        raise TestimonialsConflictError(
            "Testimonials draft has changed. "
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
        raise TestimonialsConflictError(
            "This Testimonials draft "
            "is already published."
        )

    # ---------------------------------
    # REVALIDATE SAVED CONTENT
    # ---------------------------------

    validated_content = (
        HomepageTestimonialsContent.model_validate(
            record.draft_content
        )
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

    # No commit here.
    db.flush()

    return record

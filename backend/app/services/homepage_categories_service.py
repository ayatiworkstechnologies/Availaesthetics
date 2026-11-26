
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.homepage_categories import HomepageCategories
from app.schemas.homepage_categories import (
    HomepageCategoriesContent,
)


# =====================================
# CUSTOM SERVICE ERRORS
# =====================================

class CategoriesConflictError(Exception):
    pass


class CategoriesNotFoundError(Exception):
    pass


# =====================================
# CURRENT UTC TIME
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# 1. GET GLOBAL HOMEPAGE CATEGORIES
# =====================================

def get_global_homepage_categories(
    db: Session,
) -> HomepageCategories | None:

    statement = select(HomepageCategories).where(
        HomepageCategories.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# 2. SAVE CATEGORY DRAFT
# =====================================

def save_homepage_categories_draft(
    db: Session,
    content: HomepageCategoriesContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageCategories:

    # Lock existing record during updates.
    statement = (
        select(HomepageCategories)
        .where(HomepageCategories.scope == "global")
        .with_for_update()
    )

    record = db.scalar(statement)

    # First-time draft creation.
    if record is None:

        if expected_draft_version != 0:
            raise CategoriesConflictError(
                "Category draft version conflict. "
                "Refresh the CMS and try again."
            )

        record = HomepageCategories(
            scope="global",
            draft_version=0,
            published_version=0,
        )

        db.add(record)

    # Protect against stale admin changes.
    elif record.draft_version != expected_draft_version:

        raise CategoriesConflictError(
            "Another admin has updated the categories. "
            "Refresh the CMS before saving."
        )

    # Save validated JSON.
    record.draft_content = content.model_dump(
        mode="json"
    )

    # Increment draft version.
    record.draft_version += 1

    # Record authenticated admin.
    record.updated_by_admin_id = updated_by_admin_id

    record.updated_at = utc_now()

    # Do not commit here.
    # API route controls the transaction.
    db.flush()

    return record


# =====================================
# 3. PUBLISH CATEGORY DRAFT
# =====================================

def publish_homepage_categories(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageCategories:

    # Lock record to avoid concurrent publishing.
    statement = (
        select(HomepageCategories)
        .where(HomepageCategories.scope == "global")
        .with_for_update()
    )

    record = db.scalar(statement)

    if record is None:
        raise CategoriesNotFoundError(
            "No category draft exists. "
            "Save a draft before publishing."
        )

    if record.draft_content is None:
        raise CategoriesNotFoundError(
            "No category draft is available."
        )

    # Ensure requested version is current.
    if record.draft_version != expected_draft_version:
        raise CategoriesConflictError(
            "Category draft has changed. "
            "Refresh the CMS before publishing."
        )

    # Prevent unnecessary duplicate publication.
    if (
        record.published_content is not None
        and record.published_version == record.draft_version
    ):
        raise CategoriesConflictError(
            "This category draft is already published."
        )

    # Revalidate stored JSON before publishing.
    validated_content = (
        HomepageCategoriesContent.model_validate(
            record.draft_content
        )
    )

    # Store a separate published JSON snapshot.
    record.published_content = (
        validated_content.model_dump(
            mode="json"
        )
    )

    record.published_version = record.draft_version

    record.published_by_admin_id = published_by_admin_id

    record.published_at = utc_now()

    # Commit happens in API route.
    db.flush()

    return record

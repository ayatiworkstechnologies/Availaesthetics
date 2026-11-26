
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.homepage_signature import HomepageSignature
from app.schemas.homepage_signature import (
    HomepageSignatureContent,
)


# =====================================
# CUSTOM SERVICE ERRORS
# =====================================

class SignatureConflictError(Exception):
    """Raised when a draft or publish version conflicts."""
    pass


class SignatureNotFoundError(Exception):
    """Raised when no draft exists to publish."""
    pass


# =====================================
# CURRENT UTC TIMESTAMP
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# 1. GET GLOBAL SIGNATURE CONTENT
# =====================================

def get_global_homepage_signature(
    db: Session,
) -> HomepageSignature | None:
    statement = select(HomepageSignature).where(
        HomepageSignature.scope == "global"
    )

    return db.scalar(statement)


# =====================================
# 2. SAVE SIGNATURE DRAFT
# =====================================

def save_homepage_signature_draft(
    db: Session,
    content: HomepageSignatureContent,
    expected_draft_version: int,
    updated_by_admin_id: int,
) -> HomepageSignature:

    # Lock the existing record to prevent
    # simultaneous updates from overwriting data.
    statement = (
        select(HomepageSignature)
        .where(HomepageSignature.scope == "global")
        .with_for_update()
    )

    record = db.scalar(statement)

    # First-time draft creation.
    if record is None:
        if expected_draft_version != 0:
            raise SignatureConflictError(
                "Signature draft version conflict. "
                "Refresh the CMS and try again."
            )

        record = HomepageSignature(
            scope="global",
            draft_version=0,
            published_version=0,
        )

        db.add(record)

    # Existing record version check.
    elif record.draft_version != expected_draft_version:
        raise SignatureConflictError(
            "Another admin has updated the Signature "
            "Aesthetics content. Refresh the CMS."
        )

    # Store validated content in draft only.
    record.draft_content = content.model_dump(
        mode="json"
    )

    record.draft_version += 1

    # Record the authenticated admin.
    record.updated_by_admin_id = updated_by_admin_id

    record.updated_at = utc_now()

    # No commit here. The API layer commits.
    db.flush()

    return record


# =====================================
# 3. PUBLISH SIGNATURE CONTENT
# =====================================

def publish_homepage_signature(
    db: Session,
    expected_draft_version: int,
    published_by_admin_id: int,
) -> HomepageSignature:

    statement = (
        select(HomepageSignature)
        .where(HomepageSignature.scope == "global")
        .with_for_update()
    )

    record = db.scalar(statement)

    if record is None or record.draft_content is None:
        raise SignatureNotFoundError(
            "No Signature Aesthetics draft exists. "
            "Save a draft before publishing."
        )

    if record.draft_version != expected_draft_version:
        raise SignatureConflictError(
            "Signature draft has changed. "
            "Refresh the CMS before publishing."
        )

    # Prevent duplicate publishing.
    if (
        record.published_content is not None
        and record.published_version == record.draft_version
    ):
        raise SignatureConflictError(
            "This Signature Aesthetics draft "
            "is already published."
        )

    # Revalidate stored content before publishing.
    validated_content = (
        HomepageSignatureContent.model_validate(
            record.draft_content
        )
    )

    # Copy validated draft into published snapshot.
    record.published_content = validated_content.model_dump(
        mode="json"
    )

    record.published_version = record.draft_version

    record.published_by_admin_id = published_by_admin_id

    record.published_at = utc_now()

    db.flush()

    return record

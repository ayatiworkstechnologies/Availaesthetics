
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


# =====================================
# UTC TIMESTAMP
# =====================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================
# HOMEPAGE WHY AVAIL CMS
# =====================================

class HomepageWhyAvail(Base):

    __tablename__ = "homepage_why_avail"

    # ---------------------------------
    # PRIMARY KEY
    # ---------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    # ---------------------------------
    # GLOBAL HOMEPAGE SCOPE
    # ---------------------------------

    scope: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        default="global",
    )

    # ---------------------------------
    # DRAFT CONTENT
    # ---------------------------------

    draft_content: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # ---------------------------------
    # PUBLISHED CONTENT
    # ---------------------------------

    published_content: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # ---------------------------------
    # DRAFT VERSION
    # ---------------------------------

    draft_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # ---------------------------------
    # PUBLISHED VERSION
    # ---------------------------------

    published_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # ---------------------------------
    # ADMIN AUDIT FIELDS
    # ---------------------------------

    updated_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id"),
        nullable=True,
    )

    published_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id"),
        nullable=True,
    )

    # ---------------------------------
    # CREATED TIMESTAMP
    # ---------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # ---------------------------------
    # UPDATED TIMESTAMP
    # ---------------------------------

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    # ---------------------------------
    # PUBLISHED TIMESTAMP
    # ---------------------------------

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

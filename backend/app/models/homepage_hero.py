
from datetime import datetime
from typing import Any

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


# =====================================
# HOMEPAGE HERO MODEL
# =====================================

class HomepageHero(Base):
    """
    Global Homepage Hero CMS.

    Stores draft and published content
    independently.

    Also records which Super Admin last
    edited and published the Hero.
    """

    __tablename__ = "homepage_heroes"

    # ---------------------------------
    # PRIMARY KEY
    # ---------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    # ---------------------------------
    # HOMEPAGE SCOPE
    # ---------------------------------

    scope: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
        default="global",
    )

    # ---------------------------------
    # DRAFT CONTENT
    # ---------------------------------

    draft_content: Mapped[
        dict[str, Any] | None
    ] = mapped_column(
        JSON,
        nullable=True,
    )

    # ---------------------------------
    # PUBLISHED CONTENT
    # ---------------------------------

    published_content: Mapped[
        dict[str, Any] | None
    ] = mapped_column(
        JSON,
        nullable=True,
    )

    # ---------------------------------
    # CONTENT VERSIONING
    # ---------------------------------

    draft_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    published_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # ---------------------------------
    # ADMIN AUDIT FIELDS - NEW
    # ---------------------------------

    updated_by_admin_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "admin_users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    published_by_admin_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "admin_users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # ---------------------------------
    # TIMESTAMPS
    # ---------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    published_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

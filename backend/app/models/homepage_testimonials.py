
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
)

from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HomepageTestimonials(Base):

    __tablename__ = "homepage_testimonials"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    scope: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        default="global",
    )

    draft_content: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    published_content: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

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

    updated_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id"),
        nullable=True,
    )

    published_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

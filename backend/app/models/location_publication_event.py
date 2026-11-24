
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LocationPublicationEvent(Base):
    __tablename__ = "location_publication_events"

    __table_args__ = (
        UniqueConstraint(
            "location_id",
            "version_number",
            name="uq_location_publication_version",
        ),
        CheckConstraint(
            "version_number >= 1",
            name="ck_location_publication_version",
        ),
        CheckConstraint(
            "event_type IN ('publish', 'unpublish')",
            name="ck_location_publication_event_type",
        ),
        CheckConstraint(
            """
            (
                event_type = 'publish'
                AND snapshot_data IS NOT NULL
            )
            OR
            (
                event_type = 'unpublish'
                AND snapshot_data IS NULL
            )
            """,
            name="ck_location_publication_snapshot",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    # Clinic this publication event belongs to
    location_id: Mapped[int] = mapped_column(
        ForeignKey(
            "locations.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    # Version sequence for this clinic
    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # publish or unpublish
    event_type: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
    )

    # Exact public content captured when publishing.
    # Null for unpublish events.
    snapshot_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # Super Admin who performed the action
    performed_by_admin_id: Mapped[int] = mapped_column(
        ForeignKey(
            "admin_users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

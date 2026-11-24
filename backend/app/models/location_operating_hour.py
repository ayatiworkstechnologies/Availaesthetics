
from datetime import datetime, time

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Time,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LocationOperatingHour(Base):
    __tablename__ = "location_operating_hours"

    __table_args__ = (
        UniqueConstraint(
            "location_id",
            "day_of_week",
            name="uq_location_operating_hours_day",
        ),
        CheckConstraint(
            "day_of_week BETWEEN 0 AND 6",
            name="ck_location_operating_hours_day",
        ),
        CheckConstraint(
            """
            (
                is_closed = 1
                AND opening_time IS NULL
                AND closing_time IS NULL
            )
            OR
            (
                is_closed = 0
                AND opening_time IS NOT NULL
                AND closing_time IS NOT NULL
                AND opening_time < closing_time
            )
            """,
            name="ck_location_operating_hours_times",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    location_id: Mapped[int] = mapped_column(
        ForeignKey(
            "locations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # Monday = 0, Sunday = 6
    day_of_week: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    is_closed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("1"),
    )

    opening_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    closing_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

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

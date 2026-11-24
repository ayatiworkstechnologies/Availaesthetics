
from sqlalchemy import (
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AdminLocationAssignment(Base):
    __tablename__ = "admin_location_assignments"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "location_id",
            name="uq_admin_location",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("admin_users.id"),
        nullable=False,
    )

    location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
        nullable=False,
    )

    publishing_mode: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="on_request",
        server_default="on_request",
    )

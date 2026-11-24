
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.location_publication_event import (
    LocationPublicationEvent,
)


@dataclass(frozen=True)
class PublishedLocation:
    location_id: int
    slug: str
    version_number: int
    content: dict[str, Any]


def get_published_location_by_slug(
    db: Session,
    slug: str,
) -> PublishedLocation | None:
    """
    Retrieve the currently published clinic snapshot.

    Return None if:
    - The clinic does not exist.
    - The clinic is inactive.
    - The clinic is not published.
    - No publication event exists.
    - The latest event is an unpublish event.
    - The latest publish event lacks a valid snapshot.

    Never return editable draft content.
    """

    # 1. Find an active, published clinic
    location = db.scalar(
        select(Location).where(
            Location.slug == slug,
            Location.is_active.is_(True),
            Location.publication_status == "published",
        )
    )

    if location is None:
        return None

    # 2. Retrieve the latest publication event
    latest_event = db.scalar(
        select(LocationPublicationEvent)
        .where(
            LocationPublicationEvent.location_id
            == location.id
        )
        .order_by(
            LocationPublicationEvent.version_number.desc()
        )
        .limit(1)
    )

    if latest_event is None:
        return None

    # 3. Latest event must be a publish action
    if latest_event.event_type != "publish":
        return None

    # 4. Reject missing or invalid snapshots
    if not isinstance(
        latest_event.snapshot_data, dict
    ):
        return None

    if not latest_event.snapshot_data:
        return None

    # 5. Return only the published snapshot
    return PublishedLocation(
        location_id=location.id,
        slug=location.slug,
        version_number=latest_event.version_number,
        content=latest_event.snapshot_data,
    )

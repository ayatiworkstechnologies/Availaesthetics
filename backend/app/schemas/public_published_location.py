
from typing import Any

from pydantic import BaseModel


class PublicPublishedLocationResponse(BaseModel):
    location_id: int
    slug: str
    version_number: int
    content: dict[str, Any]

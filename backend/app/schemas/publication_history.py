
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PublicationEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version_number: int
    event_type: str
    performed_by_admin_id: int
    created_at: datetime


class PublicationHistoryResponse(BaseModel):
    location_id: int
    total: int
    events: list[PublicationEventResponse]

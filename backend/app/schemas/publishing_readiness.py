
from pydantic import BaseModel


class ReadinessCheck(BaseModel):
    key: str
    label: str
    passed: bool
    message: str


class PublishingReadinessResponse(BaseModel):
    location_id: int
    location_name: str
    publication_status: str

    foundation_ready: bool
    can_publish: bool

    checks: list[ReadinessCheck]
    pending_modules: list[str]


from datetime import datetime
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
)


ClinicName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=2,
        max_length=150,
    ),
]


# Public location response
class LocationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


# Create Clinic request
class AdminLocationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: ClinicName

    slug: str = Field(
        min_length=2,
        max_length=150,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )


# Edit Clinic request
class AdminLocationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: ClinicName

    slug: str = Field(
        min_length=2,
        max_length=150,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )


# API response
class AdminLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    is_active: bool
    publication_status: str
    created_at: datetime

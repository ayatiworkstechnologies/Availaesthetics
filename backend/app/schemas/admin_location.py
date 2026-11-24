
from datetime import datetime
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
)


# Validate clinic names
ClinicName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=2,
        max_length=150,
    ),
]


# Schema for creating a new clinic
class AdminLocationCreate(BaseModel):
    name: ClinicName

    slug: str = Field(
        min_length=2,
        max_length=150,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )


# Schema for editing a clinic
class AdminLocationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: ClinicName

    slug: str = Field(
        min_length=2,
        max_length=150,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )


# Schema for returning clinic information
class AdminLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    is_active: bool
    publication_status: str
    created_at: datetime

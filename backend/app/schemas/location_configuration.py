
import re
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class LocationConfigurationUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    # Address
    address_line1: str | None = Field(
        default=None, max_length=255
    )
    address_line2: str | None = Field(
        default=None, max_length=255
    )
    city: str | None = Field(
        default=None, max_length=100
    )
    state: str | None = Field(
        default=None, max_length=100
    )
    postal_code: str | None = Field(
        default=None, max_length=20
    )
    country: str | None = Field(
        default=None, max_length=100
    )

    # Contact
    phone: str | None = Field(
        default=None, max_length=30
    )
    email: str | None = Field(
        default=None, max_length=254
    )

    # SEO
    seo_title: str | None = Field(
        default=None, max_length=160
    )
    seo_description: str | None = Field(
        default=None, max_length=300
    )

    @field_validator("*", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        if value and not re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            value,
        ):
            raise ValueError("Invalid email address")
        return value


class LocationConfigurationResponse(
    LocationConfigurationUpdate
):
    model_config = ConfigDict(from_attributes=True)

    location_id: int
    updated_at: datetime | None = None

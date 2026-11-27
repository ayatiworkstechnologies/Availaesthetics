
from datetime import datetime
from typing import Literal
from urllib.parse import urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class HomepageLocationCard(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    regionLabel: str = Field(default="", max_length=150)
    addressLine1: str = Field(min_length=1, max_length=255)
    addressLine2: str = Field(default="", max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postalCode: str = Field(default="", max_length=20)
    country: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    phoneHref: str | None = Field(default=None, max_length=50)
    mapsUrl: str = Field(min_length=1, max_length=2000)
    mapEmbedUrl: str = Field(min_length=1, max_length=4000)

    @field_validator("phoneHref")
    @classmethod
    def validate_phone_href(cls, value: str | None) -> str | None:
        if value is None or not value:
            return None
        if not value.startswith("tel:"):
            raise ValueError("Phone link must start with tel:.")
        return value

    @field_validator("mapsUrl", "mapEmbedUrl")
    @classmethod
    def validate_maps_url(cls, value: str) -> str:
        parsed = urlsplit(value)
        hostname = (parsed.hostname or "").lower()
        if (
            parsed.scheme != "https"
            or not hostname
            or not (
                hostname == "maps.app.goo.gl"
                or hostname == "google.com"
                or hostname.endswith(".google.com")
            )
        ):
            raise ValueError("Map URLs must use an approved HTTPS Google Maps URL.")
        return value


# =====================================
# 1. HOMEPAGE LOCATIONS CONTENT
# =====================================

class HomepageLocationsContent(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    # ---------------------------------
    # SECTION HEADING
    # ---------------------------------

    heading: str = Field(
        min_length=1,
        max_length=200,
    )

    # ---------------------------------
    # SECTION DESCRIPTION
    # ---------------------------------

    description: str = Field(
        min_length=1,
        max_length=1000,
    )

    # ---------------------------------
    # ORDERED HOMEPAGE LOCATION CARDS
    # ---------------------------------

    # The order determines the order
    # of cards on the homepage.

    locations: list[HomepageLocationCard] = Field(
        default_factory=list,
        max_length=20,
    )

    # ---------------------------------
    # DEFAULT SELECTED CLINIC
    # ---------------------------------

    defaultSelectedLocationId: str | None = Field(
        default=None,
        max_length=100,
    )

    # ---------------------------------
    # VALIDATE LOCATION IDS
    # ---------------------------------

    @field_validator("locations")
    @classmethod
    def validate_location_ids(
        cls,
        value: list[HomepageLocationCard],
    ) -> list[HomepageLocationCard]:
        ids = [location.id for location in value]
        if len(ids) != len(set(ids)):
            raise ValueError(
                "Duplicate homepage location IDs are not allowed."
            )

        return value

    # ---------------------------------
    # VALIDATE DEFAULT SELECTION
    # ---------------------------------

    @model_validator(mode="after")
    def validate_default_selection(self):

        if (
            self.defaultSelectedLocationId is not None
            and self.defaultSelectedLocationId
            not in {location.id for location in self.locations}
        ):
            raise ValueError(
                "Default selected clinic must be included "
                "in the selected homepage locations."
            )

        return self


# =====================================
# 2. SAVE DRAFT REQUEST
# =====================================

class HomepageLocationsDraftUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    expected_draft_version: int = Field(
        ge=0,
    )

    content: HomepageLocationsContent


# =====================================
# 3. PUBLISH REQUEST
# =====================================

class HomepageLocationsPublishRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    expected_draft_version: int = Field(
        ge=1,
    )


# =====================================
# 4. SUPER ADMIN RESPONSE
# =====================================

class HomepageLocationsAdminResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    scope: Literal["global"] = "global"

    draft_content: HomepageLocationsContent | None = None

    published_content: HomepageLocationsContent | None = None

    draft_version: int = 0

    published_version: int = 0

    updated_at: datetime | None = None

    published_at: datetime | None = None


# =====================================
# 5. PUBLIC HOMEPAGE SETTINGS RESPONSE
# =====================================

class HomepageLocationsPublicResponse(
    HomepageLocationsContent
):
    pass

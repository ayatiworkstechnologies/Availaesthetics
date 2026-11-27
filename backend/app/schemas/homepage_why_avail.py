
from datetime import datetime
from typing import Literal
from urllib.parse import unquote, urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    field_validator,
    model_validator,
)


# =====================================
# 1. VALIDATE INTERNAL IMAGE PATHS
# =====================================

def validate_image_path(
    value: str | None,
    field_name: str,
) -> str | None:
    """
    Validate local image paths used by
    the Why Avail CMS.

    Allowed examples:
        /avail/home/why-avail-profile.png
        /avail/brand/logo.svg

    Rejected examples:
        https://example.com/image.png
        //example.com/image.png
        /../private/image.png
        /avail/%2e%2e/private.png
        /avail%2fprivate.png
        /avail/image.png?version=1
        /avail/image.png#preview

    Empty paths are normalized to None.
    """

    if value is None:
        return None

    value = value.strip()

    if not value:
        return None

    # ---------------------------------
    # BASIC INTERNAL PATH CHECKS
    # ---------------------------------

    if (
        not value.startswith("/")
        or value.startswith("//")
        or "\\" in value
        or "?" in value
        or "#" in value
        or any(
            ord(char) < 32 or ord(char) == 127
            for char in value
        )
        or any(
            segment in {".", ".."}
            for segment in value.split("/")
        )
    ):
        raise ValueError(
            f"{field_name} must be a valid internal image path."
        )

    # ---------------------------------
    # REJECT EXTERNAL URL COMPONENTS
    # ---------------------------------

    parsed = urlsplit(value)

    if (
        parsed.scheme
        or parsed.netloc
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError(
            f"{field_name} cannot contain an external URL, "
            "query string or fragment."
        )

    # ---------------------------------
    # DECODE ENCODED PATH CHARACTERS
    # ---------------------------------

    decoded_value = value

    # Repeated decoding detects nested
    # percent-encoded traversal attempts.
    for _ in range(10):
        next_value = unquote(decoded_value)

        if next_value == decoded_value:
            break

        decoded_value = next_value

    # Keep image paths unencoded.
    # This prevents ambiguous URL handling
    # between validators and the web server.
    if decoded_value != value:
        raise ValueError(
            f"{field_name} cannot contain percent-encoded characters."
        )

    # ---------------------------------
    # REJECT UNSAFE CHARACTERS
    # ---------------------------------

    if (
        "%" in value
        or any(
            char.isspace()
            for char in value
        )
    ):
        raise ValueError(
            f"{field_name} contains unsupported characters."
        )

    return value


# =====================================
# 2. COMPARISON FEATURE SCHEMA
# =====================================

class HomepageWhyAvailFeature(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    # Unique identifier
    id: str = Field(
        min_length=1,
        max_length=100,
    )

    # Comparison feature label
    label: str = Field(
        min_length=1,
        max_length=200,
    )

    # ---------------------------------
    # STRICT THREE-STATE VALUES
    # ---------------------------------

    # True  = Available
    # False = Not available
    # None  = Not verified
    #
    # StrictBool rejects:
    # "true", "false", 1, 0, etc.

    avail: StrictBool | None = None

    others: StrictBool | None = None


# =====================================
# 3. WHY AVAIL SECTION CONTENT
# =====================================

class HomepageWhyAvailContent(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    # ---------------------------------
    # DYNAMIC SECTION HEADING
    # ---------------------------------

    heading: str = Field(
        min_length=1,
        max_length=200,
    )

    # ---------------------------------
    # DYNAMIC PROFILE IMAGE
    # ---------------------------------

    imageSrc: str | None = Field(
        default=None,
        max_length=500,
    )

    imageAlt: str = Field(
        default="",
        max_length=250,
    )

    # ---------------------------------
    # DYNAMIC AVAIL LOGO
    # ---------------------------------

    logoSrc: str | None = Field(
        default=None,
        max_length=500,
    )

    logoAlt: str = Field(
        default="",
        max_length=250,
    )

    # ---------------------------------
    # DYNAMIC OTHERS HEADING
    # ---------------------------------

    othersHeading: str = Field(
        min_length=1,
        max_length=100,
    )

    # ---------------------------------
    # DYNAMIC CONSULTATION BUTTON TEXT
    # ---------------------------------

    consultationLabel: str = Field(
        min_length=1,
        max_length=150,
    )

    # Consultation URL is not duplicated.
    # The public component will reuse
    # the published Hero CMS consultation URL.

    # ---------------------------------
    # ORDERED COMPARISON FEATURES
    # ---------------------------------

    features: list[HomepageWhyAvailFeature] = Field(
        default_factory=list,
        min_length=1,
        max_length=5,
    )

    # ---------------------------------
    # VALIDATE PROFILE IMAGE PATH
    # ---------------------------------

    @field_validator("imageSrc")
    @classmethod
    def validate_profile_image(
        cls,
        value: str | None,
    ) -> str | None:
        return validate_image_path(
            value,
            "Profile image path",
        )

    # ---------------------------------
    # VALIDATE LOGO IMAGE PATH
    # ---------------------------------

    @field_validator("logoSrc")
    @classmethod
    def validate_logo_image(
        cls,
        value: str | None,
    ) -> str | None:
        return validate_image_path(
            value,
            "Logo image path",
        )

    # ---------------------------------
    # VALIDATE IMAGE ALT TEXT
    # AND UNIQUE FEATURE IDS
    # ---------------------------------

    @model_validator(mode="after")
    def validate_section_content(self):

        # Profile image requires alt text.
        if self.imageSrc and not self.imageAlt:
            raise ValueError(
                "Profile image alt text is required "
                "when a profile image is configured."
            )

        # Logo image requires alt text.
        if self.logoSrc and not self.logoAlt:
            raise ValueError(
                "Logo alt text is required "
                "when a logo image is configured."
            )

        # Prevent duplicate feature IDs.
        ids = [
            feature.id
            for feature in self.features
        ]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Why Avail feature IDs must be unique."
            )

        return self


# =====================================
# 4. SAVE DRAFT REQUEST
# =====================================

class HomepageWhyAvailDraftUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    expected_draft_version: int = Field(
        ge=0,
    )

    content: HomepageWhyAvailContent


# =====================================
# 5. PUBLISH REQUEST
# =====================================

class HomepageWhyAvailPublishRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    expected_draft_version: int = Field(
        ge=1,
    )


# =====================================
# 6. SUPER ADMIN RESPONSE
# =====================================

class HomepageWhyAvailAdminResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    scope: Literal["global"] = "global"

    draft_content: HomepageWhyAvailContent | None = None

    published_content: HomepageWhyAvailContent | None = None

    draft_version: int = 0

    published_version: int = 0

    updated_at: datetime | None = None

    published_at: datetime | None = None


# =====================================
# 7. PUBLIC RESPONSE
# =====================================

class HomepageWhyAvailPublicResponse(
    HomepageWhyAvailContent
):
    pass


from datetime import datetime
from typing import Literal
from urllib.parse import urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


# =====================================
# 1. HOMEPAGE HERO CONTENT
# =====================================

class HomepageHeroContent(BaseModel):
    """
    Validates the content displayed by
    the Next.js Homepage Hero component.
    """

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    # Main banner heading
    heading: str = Field(
        min_length=1,
        max_length=160,
    )

    # Banner supporting description
    description: str = Field(
        min_length=1,
        max_length=2000,
    )

    # Desktop banner image
    imageSrc: str = Field(
        min_length=1,
        max_length=1024,
    )

    # Optional separate mobile image
    mobileImageSrc: str | None = Field(
        default=None,
        min_length=1,
        max_length=1024,
    )

    # Accessible image description
    imageAlt: str = Field(
        min_length=1,
        max_length=250,
    )

    # External consultation URL
    consultationUrl: str | None = Field(
        default=None,
        max_length=2048,
    )

    # CTA button label
    consultationLabel: str = Field(
        min_length=1,
        max_length=100,
    )

    # HSA / FSA eligibility text
    eligibilityText: str = Field(
        min_length=1,
        max_length=200,
    )

    # ---------------------------------
    # IMAGE PATH VALIDATION
    # ---------------------------------

    @field_validator(
        "imageSrc",
        "mobileImageSrc",
    )
    @classmethod
    def validate_image_path(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        # Currently, images are referenced
        # using local paths from /public.
        #
        # Example:
        # /avail/home/hero.png

        if (
            not value.startswith("/")
            or value.startswith("//")
            or "\\" in value
            or ".." in value.split("/")
            or "?" in value
            or "#" in value
        ):
            raise ValueError(
                "Image must use a valid local path "
                "starting with /"
            )

        return value

    # ---------------------------------
    # CONSULTATION URL VALIDATION
    # ---------------------------------

    @field_validator("consultationUrl")
    @classmethod
    def validate_consultation_url(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        if not value:
            return None

        if any(char.isspace() for char in value):
            raise ValueError(
                "Consultation URL must not contain whitespace"
            )

        parsed = urlsplit(value)

        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise ValueError(
                "Consultation URL must be a valid HTTPS URL"
            )

        return value


# =====================================
# 2. ADMIN DRAFT UPDATE REQUEST
# =====================================

class HomepageHeroDraftUpdate(BaseModel):
    """
    Request schema for saving Hero edits.

    Saving a draft must not automatically
    update published content.

    expected_draft_version helps prevent
    overwriting changes made by another admin.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    # Version the admin expects to update.
    #
    # First draft: 0
    # Second save: 1
    # Third save: 2
    expected_draft_version: int = Field(
        ge=0,
    )

    # Validated homepage Hero content
    content: HomepageHeroContent


# =====================================
# 3. PUBLIC HERO RESPONSE
# =====================================

class HomepageHeroPublicResponse(
    HomepageHeroContent
):
    """
    Public response contains only
    published Hero content.

    Do not expose:
    - Database IDs
    - Draft data
    - Admin information
    - Internal version details
    """

    pass


# =====================================
# 4. ADMIN HERO RESPONSE
# =====================================

class HomepageHeroAdminResponse(BaseModel):
    """
    Returns draft and published Hero
    content to an authorized Super Admin.

    Used by the CMS management dashboard.

    Authentication and role permissions
    must be enforced by the API.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    # Global homepage only
    scope: Literal["global"] = "global"

    # Latest saved draft
    draft_content: HomepageHeroContent | None = None

    # Currently published content
    published_content: HomepageHeroContent | None = None

    # Increments whenever a draft is saved
    draft_version: int = Field(
        default=0,
        ge=0,
    )

    # Tracks which draft version
    # is currently published
    published_version: int = Field(
        default=0,
        ge=0,
    )

    # Last updated timestamp
    updated_at: datetime | None = None

    # Last published timestamp
    published_at: datetime | None = None


# =====================================
# 5. PUBLISH HERO REQUEST
# =====================================

class HomepageHeroPublishRequest(BaseModel):
    """
    Request schema for publishing
    an existing Hero draft.

    The expected version prevents an
    outdated draft from being published
    accidentally.

    The API must compare this version
    with the stored draft_version.
    """

    model_config = ConfigDict(
        extra="forbid",
    )

    # Publishing requires at least
    # one successfully saved draft.
    expected_draft_version: int = Field(
        ge=1,
    )

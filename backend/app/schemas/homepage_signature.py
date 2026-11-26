
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


# =====================================
# VALIDATE LOCAL WEBSITE PATHS
# =====================================

def validate_local_path(
    value: str | None,
    field_name: str,
) -> str | None:
    if value is None:
        return None

    value = value.strip()

    if not value:
        return None

    if (
        not value.startswith("/")
        or value.startswith("//")
        or "\\" in value
        or any(
            segment in {".", ".."}
            for segment in value.split("/")
        )
        or any(ord(char) < 32 for char in value)
    ):
        raise ValueError(
            f"{field_name} must be a valid local path"
        )

    parsed = urlsplit(value)

    if (
        parsed.scheme
        or parsed.netloc
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError(
            f"{field_name} cannot contain an external URL, "
            "query string or fragment"
        )

    return value


# =====================================
# 1. SIGNATURE TREATMENT CARD
# =====================================

class HomepageSignatureCard(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    id: str = Field(
        min_length=1,
        max_length=100,
    )

    title: str = Field(
        min_length=1,
        max_length=150,
    )

    imageSrc: str | None = Field(
        default=None,
        max_length=500,
    )

    imageAlt: str = Field(
        default="",
        max_length=250,
    )

    href: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator("imageSrc")
    @classmethod
    def validate_image(
        cls,
        value: str | None,
    ) -> str | None:
        return validate_local_path(
            value,
            "Image path",
        )

    @field_validator("href")
    @classmethod
    def validate_link(
        cls,
        value: str | None,
    ) -> str | None:
        return validate_local_path(
            value,
            "Treatment link",
        )

    @model_validator(mode="after")
    def validate_alt_text(self):
        if self.imageSrc and not self.imageAlt:
            raise ValueError(
                "Image alt text is required when "
                "an image is configured"
            )
        return self


# =====================================
# 2. SIGNATURE SECTION CONTENT
# =====================================

class HomepageSignatureContent(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    cards: list[HomepageSignatureCard] = Field(
        default_factory=list,
        max_length=20,
    )

    @model_validator(mode="after")
    def validate_unique_card_ids(self):
        ids = [card.id for card in self.cards]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Signature card IDs must be unique"
            )

        return self


# =====================================
# 3. SAVE DRAFT REQUEST
# =====================================

class HomepageSignatureDraftUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_draft_version: int = Field(ge=0)

    content: HomepageSignatureContent


# =====================================
# 4. PUBLISH REQUEST
# =====================================

class HomepageSignaturePublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_draft_version: int = Field(ge=1)


# =====================================
# 5. ADMIN RESPONSE
# =====================================

class HomepageSignatureAdminResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scope: Literal["global"] = "global"

    draft_content: HomepageSignatureContent | None = None

    published_content: HomepageSignatureContent | None = None

    draft_version: int = 0

    published_version: int = 0

    updated_at: datetime | None = None

    published_at: datetime | None = None


# =====================================
# 6. PUBLIC RESPONSE
# =====================================

class HomepageSignaturePublicResponse(
    HomepageSignatureContent
):
    pass

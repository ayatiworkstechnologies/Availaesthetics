
from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


# =====================================
# 1. CATEGORY CARD
# =====================================

class HomepageCategoryCard(BaseModel):
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

    # ---------------------------------
    # Validate local image path
    # ---------------------------------

    @field_validator("imageSrc")
    @classmethod
    def validate_image_path(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None or value == "":
            return None

        if (
            not value.startswith("/")
            or value.startswith("//")
            or "\\" in value
            or "?" in value
            or "#" in value
            or any(
                segment in {".", ".."}
                for segment in value.split("/")
            )
        ):
            raise ValueError(
                "Image must use a valid local path"
            )

        return value

    # ---------------------------------
    # Validate card URL
    # ---------------------------------

    @field_validator("href")
    @classmethod
    def validate_href(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None or value == "":
            return None

        if (
            not value.startswith("/")
            or value.startswith("//")
            or "\\" in value
            or any(
                segment in {".", ".."}
                for segment in value.split("/")
            )
        ):
            raise ValueError(
                "Category link must be a local path"
            )

        return value

    # ---------------------------------
    # Image accessibility
    # ---------------------------------

    @model_validator(mode="after")
    def validate_image_alt(self):

        if self.imageSrc and not self.imageAlt:
            raise ValueError(
                "Image Alt is required when an image is configured"
            )

        return self


# =====================================
# 2. COMPLETE SECTION CONTENT
# =====================================

class HomepageCategoriesContent(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    heading: str = Field(
        default="Explore by Category",
        min_length=1,
        max_length=200,
    )

    cards: list[HomepageCategoryCard] = Field(
        default_factory=list,
        max_length=20,
    )

    allTreatmentsHref: str | None = Field(
        default=None,
        max_length=500,
    )

    # ---------------------------------
    # Validate CTA URL
    # ---------------------------------

    @field_validator("allTreatmentsHref")
    @classmethod
    def validate_all_treatments_href(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None or value.strip() == "":
            return None

        value = value.strip()

        if (
            not value.startswith("/")
            or value.startswith("//")
            or "\\" in value
            or any(
                segment in {".", ".."}
                for segment in value.split("/")
            )
        ):
            raise ValueError(
                "All Treatments link must be a local path"
            )

        return value

    # ---------------------------------
    # Prevent duplicate category IDs
    # ---------------------------------

    @model_validator(mode="after")
    def validate_unique_ids(self):

        ids = [card.id for card in self.cards]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Category IDs must be unique"
            )

        return self


# =====================================
# 3. SAVE DRAFT REQUEST
# =====================================

class HomepageCategoriesDraftUpdate(BaseModel):

    expected_draft_version: int = Field(
        ge=0,
    )

    content: HomepageCategoriesContent


# =====================================
# 4. PUBLISH REQUEST
# =====================================

class HomepageCategoriesPublishRequest(BaseModel):

    expected_draft_version: int = Field(
        ge=1,
    )


# =====================================
# 5. ADMIN RESPONSE
# =====================================

class HomepageCategoriesAdminResponse(BaseModel):

    scope: Literal["global"] = "global"

    draft_content: HomepageCategoriesContent | None

    published_content: HomepageCategoriesContent | None

    draft_version: int

    published_version: int

    updated_at: datetime | None = None

    published_at: datetime | None = None


# =====================================
# 6. PUBLIC RESPONSE
# =====================================

class HomepageCategoriesPublicResponse(
    HomepageCategoriesContent
):
    pass

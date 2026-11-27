
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
# 1. FAQ ITEM SCHEMA
# =====================================

class HomepageFaqItem(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    id: str = Field(
        min_length=1,
        max_length=100,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$",
    )

    question: str = Field(
        min_length=1,
        max_length=500,
    )

    # Null means the client has not yet
    # approved or provided an answer.
    answer: str | None = Field(
        default=None,
        max_length=5000,
    )

    @field_validator("answer", mode="before")
    @classmethod
    def normalize_empty_answer(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None

        return value


# =====================================
# 2. FAQ CONTENT SCHEMA
# =====================================

class HomepageFaqContent(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    heading: str = Field(
        min_length=1,
        max_length=200,
    )

    # Keep FAQ order exactly as saved
    # by the Super Admin.
    #
    # At least 1 FAQ is required.
    # Maximum 30 FAQs per homepage.

    faqs: list[HomepageFaqItem] = Field(
        min_length=1,
        max_length=30,
    )

    @model_validator(mode="after")
    def validate_unique_faq_ids(self):
        ids = [faq.id for faq in self.faqs]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Duplicate FAQ IDs are not allowed."
            )

        return self


# =====================================
# 3. SAVE DRAFT REQUEST
# =====================================

class HomepageFaqDraftUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_draft_version: int = Field(ge=0)

    content: HomepageFaqContent


# =====================================
# 4. PUBLISH REQUEST
# =====================================

class HomepageFaqPublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_draft_version: int = Field(ge=1)


# =====================================
# 5. SUPER ADMIN RESPONSE
# =====================================

class HomepageFaqAdminResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scope: Literal["global"] = "global"

    draft_content: HomepageFaqContent | None = None

    published_content: HomepageFaqContent | None = None

    draft_version: int = 0

    published_version: int = 0

    updated_at: datetime | None = None

    published_at: datetime | None = None


# =====================================
# 6. PUBLIC HOMEPAGE RESPONSE
# =====================================

class HomepageFaqPublicResponse(HomepageFaqContent):
    """
    Public API returns only published
    FAQ heading and FAQ entries.

    Never exposes draft content,
    admin IDs or CMS version metadata.
    """

    pass

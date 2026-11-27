
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
# 1. INDIVIDUAL TESTIMONIAL
# =====================================

class HomepageTestimonialItem(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    id: str = Field(
        min_length=1,
        max_length=100,
    )

    quote: str = Field(
        min_length=1,
        max_length=2000,
    )

    author: str = Field(
        min_length=1,
        max_length=150,
    )


# =====================================
# 2. TESTIMONIALS SECTION CONTENT
# =====================================

class HomepageTestimonialsContent(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    heading: str = Field(
        min_length=1,
        max_length=200,
    )

    testimonials: list[HomepageTestimonialItem] = Field(
        default_factory=list,
        max_length=30,
    )

    @field_validator("heading")
    @classmethod
    def validate_heading(cls, value: str) -> str:
        if not value.strip():
            raise ValueError(
                "Testimonials section heading is required."
            )
        return value

    @model_validator(mode="after")
    def validate_unique_testimonial_ids(self):
        ids = [item.id for item in self.testimonials]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Testimonial IDs must be unique."
            )

        return self


# =====================================
# 3. SAVE DRAFT REQUEST
# =====================================

class HomepageTestimonialsDraftUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_draft_version: int = Field(
        ge=0,
    )

    content: HomepageTestimonialsContent


# =====================================
# 4. PUBLISH REQUEST
# =====================================

class HomepageTestimonialsPublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_draft_version: int = Field(
        ge=1,
    )


# =====================================
# 5. SUPER ADMIN RESPONSE
# =====================================

class HomepageTestimonialsAdminResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scope: Literal["global"] = "global"

    draft_content: HomepageTestimonialsContent | None = None

    published_content: HomepageTestimonialsContent | None = None

    draft_version: int = 0

    published_version: int = 0

    updated_at: datetime | None = None

    published_at: datetime | None = None


# =====================================
# 6. PUBLIC RESPONSE
# =====================================

class HomepageTestimonialsPublicResponse(
    HomepageTestimonialsContent
):
    pass

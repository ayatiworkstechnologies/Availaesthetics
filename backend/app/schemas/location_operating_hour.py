
from datetime import time

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class OperatingHourDayInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Monday = 0, Sunday = 6
    day_of_week: int = Field(ge=0, le=6)

    is_closed: bool

    opening_time: time | None = None
    closing_time: time | None = None

    @model_validator(mode="after")
    def validate_hours(self):
        if self.is_closed:
            if (
                self.opening_time is not None
                or self.closing_time is not None
            ):
                raise ValueError(
                    "Closed days must not contain opening "
                    "or closing times"
                )
        else:
            if (
                self.opening_time is None
                or self.closing_time is None
            ):
                raise ValueError(
                    "Open days require opening and closing times"
                )

            if self.opening_time >= self.closing_time:
                raise ValueError(
                    "Closing time must be later than opening time"
                )

        return self


class OperatingHoursWeekUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    days: list[OperatingHourDayInput] = Field(
        min_length=7,
        max_length=7,
    )

    @model_validator(mode="after")
    def validate_week(self):
        submitted_days = {
            day.day_of_week for day in self.days
        }

        if submitted_days != set(range(7)):
            raise ValueError(
                "Provide exactly one record for each "
                "day from Monday through Sunday"
            )

        return self


class OperatingHourDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_of_week: int
    is_closed: bool
    opening_time: time | None
    closing_time: time | None


class OperatingHoursWeekResponse(BaseModel):
    location_id: int
    configured: bool
    days: list[OperatingHourDayResponse]

import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator


def _window_hours(start: dt.time, end: dt.time) -> float:
    delta = dt.datetime.combine(dt.date.min, end) - dt.datetime.combine(dt.date.min, start)
    return delta.total_seconds() / 3600


def _normalize_weekdays(days: list[int]) -> list[int]:
    unique = sorted(set(days))
    if any(d < 0 or d > 6 for d in unique):
        raise ValueError("working_days must be weekday numbers 0-6 (Mon-Sun)")
    return unique


class TherapistBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    specialty: str = Field(min_length=1, max_length=120)
    working_days: list[int] = Field(min_length=1)
    start_time: dt.time
    end_time: dt.time
    slot_duration_minutes: int = Field(default=30, gt=0, le=240)

    @field_validator("working_days")
    @classmethod
    def _valid_weekdays(cls, days: list[int]) -> list[int]:
        return _normalize_weekdays(days)

    @model_validator(mode="after")
    def _end_after_start(self) -> "TherapistBase":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class TherapistCreate(TherapistBase):
    pass


class TherapistUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    specialty: str | None = Field(default=None, min_length=1, max_length=120)
    working_days: list[int] | None = Field(default=None, min_length=1)
    start_time: dt.time | None = None
    end_time: dt.time | None = None
    slot_duration_minutes: int | None = Field(default=None, gt=0, le=240)
    is_active: bool | None = None

    @field_validator("working_days")
    @classmethod
    def _valid_weekdays(cls, days: list[int] | None) -> list[int] | None:
        return _normalize_weekdays(days) if days is not None else None


class ScheduleOverrideCreate(BaseModel):
    date: dt.date
    is_day_off: bool = False
    start_time: dt.time | None = None
    end_time: dt.time | None = None

    @model_validator(mode="after")
    def _check_window(self) -> "ScheduleOverrideCreate":
        # A working override needs an explicit, valid window; a day off ignores times.
        if not self.is_day_off:
            if self.start_time is None or self.end_time is None:
                raise ValueError("start_time and end_time are required unless is_day_off is true")
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class ScheduleOverrideRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: dt.date
    is_day_off: bool
    start_time: dt.time | None
    end_time: dt.time | None


class TherapistRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    specialty: str
    working_days: list[int]
    start_time: dt.time
    end_time: dt.time
    slot_duration_minutes: int
    is_active: bool

    @computed_field
    @property
    def weekly_hours(self) -> float:
        return round(_window_hours(self.start_time, self.end_time) * len(self.working_days), 1)


class TherapistDetail(TherapistRead):
    schedule_overrides: list[ScheduleOverrideRead] = []

import datetime as dt

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Time,
    UniqueConstraint,
    text,
    true,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel


class Therapist(BaseModel):
    __tablename__ = "therapists"

    full_name: Mapped[str] = mapped_column(String(120))
    specialty: Mapped[str] = mapped_column(String(120))
    # Weekday numbers the therapist works, Mon=0..Sun=6 (matches date.weekday()).
    working_days: Mapped[list[int]] = mapped_column(ARRAY(SmallInteger))
    start_time: Mapped[dt.time] = mapped_column(Time)
    end_time: Mapped[dt.time] = mapped_column(Time)
    slot_duration_minutes: Mapped[int] = mapped_column(
        Integer, default=30, server_default=text("30")
    )
    # Soft delete: deactivating keeps a therapist's historical appointments/invoices intact.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())

    schedule_overrides: Mapped[list["TherapistScheduleOverride"]] = relationship(
        back_populates="therapist",
        cascade="all, delete-orphan",
        order_by="TherapistScheduleOverride.date",
    )


class TherapistScheduleOverride(BaseModel):
    __tablename__ = "therapist_schedule_overrides"
    __table_args__ = (
        UniqueConstraint(
            "therapist_id", "date", name="uq_therapist_schedule_overrides_therapist_id_date"
        ),
    )

    therapist_id: Mapped[int] = mapped_column(ForeignKey("therapists.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)
    is_day_off: Mapped[bool] = mapped_column(Boolean, default=False)
    # Null when it's a day off; otherwise the custom window for that single date.
    start_time: Mapped[dt.time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[dt.time | None] = mapped_column(Time, nullable=True)

    therapist: Mapped["Therapist"] = relationship(back_populates="schedule_overrides")

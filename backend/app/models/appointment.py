import datetime as dt
import enum

from sqlalchemy import Date, ForeignKey, Text, Time, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.models.patient import Patient
from app.models.therapist import Therapist


class AppointmentStatus(enum.StrEnum):
    scheduled = "scheduled"
    completed = "completed"


class PaymentMethod(enum.StrEnum):
    cash = "cash"
    card = "card"
    insurance = "insurance"


class Appointment(BaseModel):
    __tablename__ = "appointments"
    __table_args__ = (
        # Hard guard against double-booking one therapist on the same date and slot start.
        UniqueConstraint(
            "therapist_id",
            "date",
            "start_time",
            name="uq_appointments_therapist_id_date_start_time",
        ),
    )

    # Deleting a patient removes their appointments; therapists soft-delete, so keep their link.
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    therapist_id: Mapped[int] = mapped_column(ForeignKey("therapists.id"))
    date: Mapped[dt.date] = mapped_column(Date)
    start_time: Mapped[dt.time] = mapped_column(Time)
    end_time: Mapped[dt.time] = mapped_column(Time)
    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus, name="appointment_status"),
        default=AppointmentStatus.scheduled,
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, name="payment_method")
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped[Patient] = relationship()
    therapist: Mapped[Therapist] = relationship()

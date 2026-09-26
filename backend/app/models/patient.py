import datetime as dt
import enum

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.models.therapist import Therapist


class PatientStatus(enum.StrEnum):
    active = "active"
    completed = "completed"
    on_hold = "on_hold"


class Patient(BaseModel):
    __tablename__ = "patients"

    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Free-text intake notes (conditions, referral reason); shown on the patient record.
    medical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PatientStatus] = mapped_column(
        SAEnum(PatientStatus, name="patient_status"), default=PatientStatus.active
    )
    # Assignment is optional and cleared (not cascaded) if the therapist row is ever removed;
    # soft-deleted therapists keep the link so historical records stay attributable.
    assigned_therapist_id: Mapped[int | None] = mapped_column(
        ForeignKey("therapists.id", ondelete="SET NULL"), nullable=True
    )
    assigned_therapist: Mapped[Therapist | None] = relationship()

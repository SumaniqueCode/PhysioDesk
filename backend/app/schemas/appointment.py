import datetime as dt

from pydantic import BaseModel, ConfigDict, Field

from app.models.appointment import AppointmentStatus, PaymentMethod
from app.models.patient import PatientStatus


class PatientSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    status: PatientStatus


class TherapistSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    specialty: str


class AppointmentCreate(BaseModel):
    patient_id: int
    therapist_id: int
    date: dt.date
    start_time: dt.time
    payment_method: PaymentMethod
    notes: str | None = Field(default=None, max_length=2000)


class AppointmentUpdate(BaseModel):
    # Reschedule moves date/slot for the same patient and therapist; the rest are edits.
    date: dt.date | None = None
    start_time: dt.time | None = None
    status: AppointmentStatus | None = None
    payment_method: PaymentMethod | None = None
    notes: str | None = Field(default=None, max_length=2000)


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    therapist_id: int
    date: dt.date
    start_time: dt.time
    end_time: dt.time
    status: AppointmentStatus
    payment_method: PaymentMethod
    notes: str | None
    patient: PatientSummary
    therapist: TherapistSummary


class SlotRead(BaseModel):
    start_time: dt.time
    end_time: dt.time
    appointment: AppointmentRead | None = None


class TherapistDaySchedule(BaseModel):
    therapist: TherapistSummary
    is_day_off: bool
    slots: list[SlotRead]


class DaySchedule(BaseModel):
    date: dt.date
    therapists: list[TherapistDaySchedule]


class OpenSlot(BaseModel):
    start_time: dt.time
    end_time: dt.time


class Availability(BaseModel):
    date: dt.date
    therapist_id: int
    slots: list[OpenSlot]

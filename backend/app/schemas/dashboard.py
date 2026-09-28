from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.patient import PatientStatus
from app.schemas.appointment import TherapistSummary


class TherapistCapacity(BaseModel):
    """One on-duty therapist's booked vs. free slot counts for today."""

    therapist: TherapistSummary
    booked: int
    open: int
    total: int


class RecentPatient(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    # "Condition" in the spec maps to our free-text intake notes.
    condition: str | None = None
    package: str | None = None
    status: PatientStatus
    assigned_therapist: TherapistSummary | None = None


class DashboardStats(BaseModel):
    # The four live figures called for in the spec's dashboard section.
    patients_seen_today: int
    therapists_on_duty_today: int
    # Money travels as a decimal string, like invoices, to avoid float drift.
    revenue_today: Decimal
    open_slots_today: int
    capacity: list[TherapistCapacity]
    recent_patients: list[RecentPatient]

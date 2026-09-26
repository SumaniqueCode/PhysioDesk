import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, model_validator

from app.models.patient import PatientStatus


def _reject_future_dob(dob: dt.date | None) -> None:
    if dob is not None and dob > dt.date.today():
        raise ValueError("date_of_birth cannot be in the future")


class PatientBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: dt.date | None = None
    address: str | None = Field(default=None, max_length=255)
    medical_notes: str | None = None
    status: PatientStatus = PatientStatus.active
    assigned_therapist_id: int | None = None

    @model_validator(mode="after")
    def _check_dob(self) -> "PatientBase":
        _reject_future_dob(self.date_of_birth)
        return self


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: dt.date | None = None
    address: str | None = Field(default=None, max_length=255)
    medical_notes: str | None = None
    status: PatientStatus | None = None
    assigned_therapist_id: int | None = None

    @model_validator(mode="after")
    def _check_dob(self) -> "PatientUpdate":
        _reject_future_dob(self.date_of_birth)
        return self


class AssignedTherapist(BaseModel):
    """Compact therapist summary embedded in a patient record for display."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    specialty: str
    is_active: bool


class PatientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr | None
    phone: str | None
    date_of_birth: dt.date | None
    address: str | None
    medical_notes: str | None
    status: PatientStatus
    assigned_therapist_id: int | None
    assigned_therapist: AssignedTherapist | None = None

    @computed_field
    @property
    def age(self) -> int | None:
        if self.date_of_birth is None:
            return None
        today = dt.date.today()
        had_birthday = (today.month, today.day) >= (
            self.date_of_birth.month,
            self.date_of_birth.day,
        )
        return today.year - self.date_of_birth.year - (0 if had_birthday else 1)

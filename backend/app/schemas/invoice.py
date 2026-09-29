import datetime as dt
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.appointment import PaymentMethod
from app.models.invoice import InvoiceStatus
from app.schemas.appointment import PatientSummary


class InvoiceCreate(BaseModel):
    patient_id: int = Field(ge=1)
    appointment_id: int | None = Field(default=None, ge=1)
    service: str = Field(min_length=1, max_length=160)
    amount: Decimal = Field(max_digits=10, decimal_places=2, ge=0)
    discount: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2, ge=0)
    status: InvoiceStatus = InvoiceStatus.due
    payment_method: PaymentMethod
    issued_date: dt.date | None = None
    notes: str | None = Field(default=None, max_length=2000)


class InvoiceUpdate(BaseModel):
    service: str | None = Field(default=None, min_length=1, max_length=160)
    amount: Decimal | None = Field(default=None, max_digits=10, decimal_places=2, ge=0)
    discount: Decimal | None = Field(default=None, max_digits=10, decimal_places=2, ge=0)
    status: InvoiceStatus | None = None
    payment_method: PaymentMethod | None = None
    issued_date: dt.date | None = None
    notes: str | None = Field(default=None, max_length=2000)


class InvoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    appointment_id: int | None
    service: str
    amount: Decimal
    discount: Decimal
    status: InvoiceStatus
    payment_method: PaymentMethod
    issued_date: dt.date
    paid_at: dt.datetime | None
    notes: str | None
    patient: PatientSummary | None = None

    @computed_field
    @property
    def total(self) -> Decimal:
        # Net payable after discount; a discount larger than the amount never goes negative.
        net = self.amount - self.discount
        return net if net > 0 else Decimal("0.00")

import datetime as dt
import enum
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.models.appointment import PaymentMethod
from app.models.patient import Patient


class InvoiceStatus(enum.StrEnum):
    due = "due"
    paid = "paid"


class Invoice(BaseModel):
    __tablename__ = "invoices"

    # Deleting a patient removes their invoices, matching how appointments cascade.
    # Indexed because the billing list filters by patient and by status on every load.
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    # Optional link to the billed visit; kept intact if that appointment is later removed.
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True
    )
    service: Mapped[str] = mapped_column(String(160))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    discount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus, name="invoice_status"), default=InvoiceStatus.due, index=True
    )
    # Reuses the PaymentMethod enum under its own Postgres type so the migration is self-contained.
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, name="invoice_payment_method")
    )
    issued_date: Mapped[dt.date] = mapped_column(Date, default=dt.date.today)
    # Stamped when the invoice is marked paid; powers "revenue collected today".
    paid_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped[Patient] = relationship()

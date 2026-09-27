import datetime as dt
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, NotFoundError
from app.models.invoice import Invoice, InvoiceStatus
from app.repositories.appointment import AppointmentRepository
from app.repositories.invoice import InvoiceRepository
from app.repositories.patient import PatientRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate

# Columns without a nullable default; an explicit null on PATCH must be rejected, not persisted.
_REQUIRED_FIELDS = ("service", "amount", "discount", "status", "payment_method", "issued_date")


class InvoiceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = InvoiceRepository(session)
        self.patients = PatientRepository(session)
        self.appointments = AppointmentRepository(session)

    async def list(
        self,
        *,
        patient_id: int | None,
        status: InvoiceStatus | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Invoice], int]:
        offset = (page - 1) * page_size
        return await self.repo.list(
            patient_id=patient_id, status=status, offset=offset, limit=page_size
        )

    async def get(self, invoice_id: int) -> Invoice:
        invoice = await self.repo.get_with_patient(invoice_id)
        if invoice is None:
            raise NotFoundError("Invoice not found")
        return invoice

    async def _get_or_404(self, invoice_id: int) -> Invoice:
        invoice = await self.repo.get(invoice_id)
        if invoice is None:
            raise NotFoundError("Invoice not found")
        return invoice

    @staticmethod
    def _check_discount(amount: Decimal, discount: Decimal) -> None:
        if discount > amount:
            raise AppError(422, "Discount cannot exceed the invoice amount")

    async def _validate_appointment(self, appointment_id: int, patient_id: int) -> None:
        # A linked visit must exist and belong to the same patient being billed.
        appointment = await self.appointments.get(appointment_id)
        if appointment is None:
            raise NotFoundError("Linked appointment not found")
        if appointment.patient_id != patient_id:
            raise AppError(422, "Appointment belongs to a different patient")

    async def create(self, payload: InvoiceCreate) -> Invoice:
        if await self.patients.get(payload.patient_id) is None:
            raise NotFoundError("Patient not found")
        if payload.appointment_id is not None:
            await self._validate_appointment(payload.appointment_id, payload.patient_id)
        self._check_discount(payload.amount, payload.discount)

        invoice = Invoice(
            patient_id=payload.patient_id,
            appointment_id=payload.appointment_id,
            service=payload.service,
            amount=payload.amount,
            discount=payload.discount,
            status=payload.status,
            payment_method=payload.payment_method,
            issued_date=payload.issued_date or dt.date.today(),
            notes=payload.notes,
            paid_at=dt.datetime.now(dt.UTC) if payload.status is InvoiceStatus.paid else None,
        )
        self.repo.add(invoice)
        await self.session.flush()
        return await self.get(invoice.id)

    async def update(self, invoice_id: int, payload: InvoiceUpdate) -> Invoice:
        invoice = await self._get_or_404(invoice_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            if value is None and field in _REQUIRED_FIELDS:
                raise AppError(422, f"{field} cannot be null")
            setattr(invoice, field, value)
        self._check_discount(invoice.amount, invoice.discount)

        # Keep paid_at in step with the status so revenue reporting stays accurate.
        if invoice.status is InvoiceStatus.paid and invoice.paid_at is None:
            invoice.paid_at = dt.datetime.now(dt.UTC)
        elif invoice.status is InvoiceStatus.due:
            invoice.paid_at = None
        await self.session.flush()
        return await self.get(invoice.id)

    async def delete(self, invoice_id: int) -> None:
        invoice = await self._get_or_404(invoice_id)
        await self.repo.delete(invoice)
        await self.session.flush()

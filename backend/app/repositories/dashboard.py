from __future__ import annotations

import datetime as dt
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.patient import Patient, PatientStatus

# Net payable per invoice; reused by the revenue and outstanding aggregates below.
_NET = Invoice.amount - Invoice.discount


class DashboardRepository:
    """Cross-model aggregate reads that back the dashboard's summary cards."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def active_patient_count(self) -> int:
        return (
            await self.session.scalar(
                select(func.count())
                .select_from(Patient)
                .where(Patient.status == PatientStatus.active)
            )
            or 0
        )

    async def appointment_counts(self, day: dt.date) -> tuple[int, int]:
        # Total booked today and how many of those are already completed.
        total = await self.session.scalar(
            select(func.count()).select_from(Appointment).where(Appointment.date == day)
        )
        completed = await self.session.scalar(
            select(func.count())
            .select_from(Appointment)
            .where(Appointment.date == day, Appointment.status == AppointmentStatus.completed)
        )
        return total or 0, completed or 0

    async def revenue_collected(self, start: dt.datetime, end: dt.datetime) -> Decimal:
        # Payments whose paid_at stamp falls in the [start, end) window.
        value = await self.session.scalar(
            select(func.coalesce(func.sum(_NET), 0)).where(
                Invoice.status == InvoiceStatus.paid,
                Invoice.paid_at >= start,
                Invoice.paid_at < end,
            )
        )
        return Decimal(value or 0)

    async def outstanding(self) -> tuple[Decimal, int]:
        row = (
            await self.session.execute(
                select(func.coalesce(func.sum(_NET), 0), func.count()).where(
                    Invoice.status == InvoiceStatus.due
                )
            )
        ).one()
        return Decimal(row[0] or 0), row[1]

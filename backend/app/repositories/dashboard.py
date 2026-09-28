from __future__ import annotations

import datetime as dt
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.patient import Patient

# Net payable per invoice; backs the revenue aggregate below.
_NET = Invoice.amount - Invoice.discount


class DashboardRepository:
    """Cross-model aggregate reads that back the dashboard's summary cards."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def patients_seen_today(self, day: dt.date) -> int:
        # Distinct patients with a completed appointment on the day — not raw visit count.
        return (
            await self.session.scalar(
                select(func.count(func.distinct(Appointment.patient_id))).where(
                    Appointment.date == day,
                    Appointment.status == AppointmentStatus.completed,
                )
            )
            or 0
        )

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

    async def recent_patients(self, limit: int) -> list[Patient]:
        result = await self.session.execute(
            select(Patient)
            .options(selectinload(Patient.assigned_therapist))
            .order_by(Patient.created_at.desc(), Patient.id.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

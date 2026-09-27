from __future__ import annotations

import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment, AppointmentStatus


class AppointmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, appointment_id: int) -> Appointment | None:
        return await self.session.get(Appointment, appointment_id)

    async def get_with_relations(self, appointment_id: int) -> Appointment | None:
        result = await self.session.execute(
            select(Appointment)
            .where(Appointment.id == appointment_id)
            .options(
                selectinload(Appointment.patient),
                selectinload(Appointment.therapist),
            )
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        patient_id: int | None,
        therapist_id: int | None,
        status: AppointmentStatus | None,
        date_from: dt.date | None,
        date_to: dt.date | None,
        offset: int,
        limit: int,
    ) -> tuple[list[Appointment], int]:
        conditions = []
        if patient_id is not None:
            conditions.append(Appointment.patient_id == patient_id)
        if therapist_id is not None:
            conditions.append(Appointment.therapist_id == therapist_id)
        if status is not None:
            conditions.append(Appointment.status == status)
        if date_from is not None:
            conditions.append(Appointment.date >= date_from)
        if date_to is not None:
            conditions.append(Appointment.date <= date_to)

        total = await self.session.scalar(
            select(func.count()).select_from(Appointment).where(*conditions)
        )
        result = await self.session.execute(
            select(Appointment)
            .where(*conditions)
            .options(
                selectinload(Appointment.patient),
                selectinload(Appointment.therapist),
            )
            .order_by(Appointment.date.desc(), Appointment.start_time)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total or 0

    async def for_date(self, target_date: dt.date) -> list[Appointment]:
        # All appointments on one date; both relations eager-loaded for grid serialization.
        result = await self.session.execute(
            select(Appointment)
            .where(Appointment.date == target_date)
            .options(
                selectinload(Appointment.patient),
                selectinload(Appointment.therapist),
            )
            .order_by(Appointment.therapist_id, Appointment.start_time)
        )
        return list(result.scalars().all())

    async def conflict(
        self,
        *,
        therapist_id: int,
        target_date: dt.date,
        start_time: dt.time,
        exclude_id: int | None = None,
    ) -> Appointment | None:
        conditions = [
            Appointment.therapist_id == therapist_id,
            Appointment.date == target_date,
            Appointment.start_time == start_time,
        ]
        if exclude_id is not None:
            conditions.append(Appointment.id != exclude_id)
        result = await self.session.execute(select(Appointment).where(*conditions))
        return result.scalar_one_or_none()

    async def seen_today_counts(self, therapist_ids: list[int], day: dt.date) -> dict[int, int]:
        # Distinct patients seen per therapist for one date, in a single grouped query (no N+1).
        if not therapist_ids:
            return {}
        result = await self.session.execute(
            select(Appointment.therapist_id, func.count(func.distinct(Appointment.patient_id)))
            .where(
                Appointment.therapist_id.in_(therapist_ids),
                Appointment.date == day,
                Appointment.status == AppointmentStatus.completed,
            )
            .group_by(Appointment.therapist_id)
        )
        return {therapist_id: count for therapist_id, count in result.all()}

    async def booked_starts(self, therapist_id: int, target_date: dt.date) -> set[dt.time]:
        # Just the taken slot starts for one therapist/date — no rows or relations to hydrate.
        result = await self.session.execute(
            select(Appointment.start_time).where(
                Appointment.therapist_id == therapist_id,
                Appointment.date == target_date,
            )
        )
        return set(result.scalars().all())

    def add(self, appointment: Appointment) -> None:
        self.session.add(appointment)

    async def delete(self, appointment: Appointment) -> None:
        await self.session.delete(appointment)

from __future__ import annotations

import datetime as dt

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, NotFoundError
from app.models.appointment import Appointment, AppointmentStatus
from app.models.therapist import Therapist
from app.repositories.appointment import AppointmentRepository
from app.repositories.patient import PatientRepository
from app.repositories.therapist import TherapistRepository
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentRead,
    AppointmentUpdate,
    Availability,
    DaySchedule,
    OpenSlot,
    SlotRead,
    TherapistDaySchedule,
    TherapistSummary,
)
from app.utils.scheduling import generate_slots, working_window

# Distinguishes "no override was passed" from a legitimately passed None override.
_UNSET = object()


class AppointmentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = AppointmentRepository(session)
        self.therapists = TherapistRepository(session)
        self.patients = PatientRepository(session)

    async def list(
        self,
        *,
        patient_id: int | None,
        therapist_id: int | None,
        status: AppointmentStatus | None,
        date_from: dt.date | None,
        date_to: dt.date | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Appointment], int]:
        offset = (page - 1) * page_size
        return await self.repo.list(
            patient_id=patient_id,
            therapist_id=therapist_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
            offset=offset,
            limit=page_size,
        )

    async def get(self, appointment_id: int) -> Appointment:
        appointment = await self.repo.get_with_relations(appointment_id)
        if appointment is None:
            raise NotFoundError("Appointment not found")
        return appointment

    async def _active_therapist(self, therapist_id: int) -> Therapist:
        therapist = await self.therapists.get(therapist_id)
        if therapist is None:
            raise NotFoundError("Therapist not found")
        if not therapist.is_active:
            raise AppError(422, "Therapist is not active")
        return therapist

    async def _flush(self) -> None:
        # A lost double-booking race trips the unique constraint; surface it as a clean 409.
        try:
            await self.session.flush()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AppError(409, "That slot is already booked") from exc

    async def _slots_for(
        self, therapist: Therapist, target_date: dt.date, override=_UNSET
    ) -> list[tuple[dt.time, dt.time]]:
        if override is _UNSET:
            override = await self.therapists.get_override(therapist.id, target_date)
        window = working_window(therapist, target_date, override)
        if window is None:
            return []
        return generate_slots(window[0], window[1], therapist.slot_duration_minutes)

    async def availability(self, therapist_id: int, target_date: dt.date) -> Availability:
        therapist = await self._active_therapist(therapist_id)
        slots = await self._slots_for(therapist, target_date)
        booked = await self.repo.booked_starts(therapist_id, target_date)
        open_slots = [
            OpenSlot(start_time=s, end_time=e) for s, e in slots if s not in booked
        ]
        return Availability(date=target_date, therapist_id=therapist_id, slots=open_slots)

    async def day_schedule(self, target_date: dt.date) -> DaySchedule:
        therapists, _ = await self.therapists.list(
            search=None, is_active=True, offset=0, limit=100
        )
        appointments = await self.repo.for_date(target_date)
        by_therapist: dict[int, dict[dt.time, Appointment]] = {}
        for appt in appointments:
            by_therapist.setdefault(appt.therapist_id, {})[appt.start_time] = appt

        # Fetch every therapist's override for the date in one query to avoid an N+1.
        overrides = {
            o.therapist_id: o for o in await self.therapists.overrides_for_date(target_date)
        }

        columns: list[TherapistDaySchedule] = []
        for therapist in therapists:
            slots = await self._slots_for(therapist, target_date, overrides.get(therapist.id))
            booked = by_therapist.get(therapist.id, {})
            columns.append(
                TherapistDaySchedule(
                    therapist=TherapistSummary.model_validate(therapist),
                    is_day_off=len(slots) == 0,
                    slots=[
                        SlotRead(
                            start_time=s,
                            end_time=e,
                            appointment=(
                                AppointmentRead.model_validate(booked[s]) if s in booked else None
                            ),
                        )
                        for s, e in slots
                    ],
                )
            )
        return DaySchedule(date=target_date, therapists=columns)

    async def _resolve_slot(
        self, therapist: Therapist, target_date: dt.date, start_time: dt.time
    ) -> dt.time:
        # A booking must land exactly on one of the therapist's generated slots.
        for slot_start, slot_end in await self._slots_for(therapist, target_date):
            if slot_start == start_time:
                return slot_end
        raise AppError(422, "The therapist is not available at that time")

    async def create(self, payload: AppointmentCreate) -> Appointment:
        therapist = await self._active_therapist(payload.therapist_id)
        if await self.patients.get(payload.patient_id) is None:
            raise NotFoundError("Patient not found")
        end_time = await self._resolve_slot(therapist, payload.date, payload.start_time)
        if await self.repo.conflict(
            therapist_id=therapist.id, target_date=payload.date, start_time=payload.start_time
        ):
            raise AppError(409, "That slot is already booked")

        appointment = Appointment(
            patient_id=payload.patient_id,
            therapist_id=therapist.id,
            date=payload.date,
            start_time=payload.start_time,
            end_time=end_time,
            payment_method=payload.payment_method,
            notes=payload.notes,
            status=AppointmentStatus.scheduled,
        )
        self.repo.add(appointment)
        await self._flush()
        return await self.get(appointment.id)

    async def update(self, appointment_id: int, payload: AppointmentUpdate) -> Appointment:
        appointment = await self.get(appointment_id)
        data = payload.model_dump(exclude_unset=True)

        # Re-derive the slot only when the date or start time actually moves.
        new_date = data.get("date", appointment.date)
        new_start = data.get("start_time", appointment.start_time)
        if new_date != appointment.date or new_start != appointment.start_time:
            end_time = await self._resolve_slot(appointment.therapist, new_date, new_start)
            if await self.repo.conflict(
                therapist_id=appointment.therapist_id,
                target_date=new_date,
                start_time=new_start,
                exclude_id=appointment.id,
            ):
                raise AppError(409, "That slot is already booked")
            appointment.date = new_date
            appointment.start_time = new_start
            appointment.end_time = end_time

        for field in ("status", "payment_method", "notes"):
            if field in data:
                setattr(appointment, field, data[field])
        await self._flush()
        return await self.get(appointment.id)

    async def delete(self, appointment_id: int) -> None:
        appointment = await self.repo.get(appointment_id)
        if appointment is None:
            raise NotFoundError("Appointment not found")
        await self.repo.delete(appointment)
        await self.session.flush()

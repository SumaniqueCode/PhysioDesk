from __future__ import annotations

import datetime as dt

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import set_committed_value

from app.core.exceptions import NotFoundError
from app.models.therapist import Therapist, TherapistScheduleOverride
from app.repositories.appointment import AppointmentRepository
from app.repositories.therapist import TherapistRepository
from app.schemas.therapist import (
    ScheduleOverrideCreate,
    TherapistCreate,
    TherapistListItem,
    TherapistUpdate,
)


class TherapistService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = TherapistRepository(session)
        self.appointments = AppointmentRepository(session)

    async def list(
        self, *, search: str | None, is_active: bool | None, page: int, page_size: int
    ) -> tuple[list[Therapist], int]:
        offset = (page - 1) * page_size
        return await self.repo.list(
            search=search, is_active=is_active, offset=offset, limit=page_size
        )

    async def roster(
        self, *, search: str | None, is_active: bool | None, page: int, page_size: int
    ) -> tuple[list[TherapistListItem], int]:
        therapists, total = await self.list(
            search=search, is_active=is_active, page=page, page_size=page_size
        )
        # UTC-anchored "today" to match the dashboard's revenue/appointment stats.
        today = dt.datetime.now(dt.UTC).date()
        counts = await self.appointments.seen_today_counts([t.id for t in therapists], today)
        items = [
            TherapistListItem.model_validate(t).model_copy(
                update={"patients_seen_today": counts.get(t.id, 0)}
            )
            for t in therapists
        ]
        return items, total

    async def get(self, therapist_id: int) -> Therapist:
        therapist = await self.repo.get_with_overrides(therapist_id)
        if therapist is None:
            raise NotFoundError("Therapist not found")
        return therapist

    async def _get_or_404(self, therapist_id: int) -> Therapist:
        # Lightweight fetch by PK for write paths that don't serialize schedule_overrides.
        therapist = await self.repo.get(therapist_id)
        if therapist is None:
            raise NotFoundError("Therapist not found")
        return therapist

    async def create(self, payload: TherapistCreate) -> Therapist:
        therapist = Therapist(**payload.model_dump())
        self.repo.add(therapist)
        await self.session.flush()
        # Mark the (empty) overrides collection as already loaded, without the lazy SELECT a
        # plain assignment would emit — that IO has no greenlet on the async engine and would
        # otherwise fail when TherapistDetail is serialized after the request.
        set_committed_value(therapist, "schedule_overrides", [])
        return therapist

    async def update(self, therapist_id: int, payload: TherapistUpdate) -> Therapist:
        therapist = await self.get(therapist_id)
        # Ignore explicit nulls: every field is required at the DB level, so None means "unchanged".
        for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
            setattr(therapist, field, value)
        # Times may be changed one at a time, so validate the merged window, not the payload alone.
        if therapist.end_time <= therapist.start_time:
            raise ValueError("end_time must be after start_time")
        await self.session.flush()
        return therapist

    async def deactivate(self, therapist_id: int) -> None:
        therapist = await self._get_or_404(therapist_id)
        therapist.is_active = False
        await self.session.flush()

    async def set_override(
        self, therapist_id: int, payload: ScheduleOverrideCreate
    ) -> TherapistScheduleOverride:
        await self._get_or_404(therapist_id)
        # One override per date: replace the existing entry rather than duplicating it.
        existing = await self.repo.get_override(therapist_id, payload.date)
        override = existing or TherapistScheduleOverride(
            therapist_id=therapist_id, date=payload.date
        )
        override.is_day_off = payload.is_day_off
        override.start_time = None if payload.is_day_off else payload.start_time
        override.end_time = None if payload.is_day_off else payload.end_time
        if existing is None:
            self.session.add(override)
        await self.session.flush()
        return override

    async def remove_override(self, therapist_id: int, date: dt.date) -> None:
        override = await self.repo.get_override(therapist_id, date)
        if override is None:
            raise NotFoundError("Schedule override not found")
        await self.repo.delete_override(override)
        await self.session.flush()

import datetime as dt

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.therapist import Therapist, TherapistScheduleOverride


class TherapistRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, therapist_id: int) -> Therapist | None:
        return await self.session.get(Therapist, therapist_id)

    async def get_with_overrides(self, therapist_id: int) -> Therapist | None:
        result = await self.session.execute(
            select(Therapist)
            .where(Therapist.id == therapist_id)
            .options(selectinload(Therapist.schedule_overrides))
        )
        return result.scalar_one_or_none()

    async def list(
        self, *, search: str | None, is_active: bool | None, offset: int, limit: int
    ) -> tuple[list[Therapist], int]:
        conditions = []
        if is_active is not None:
            conditions.append(Therapist.is_active.is_(is_active))
        if search:
            # Escape LIKE wildcards so a literal % or _ in the query matches itself.
            escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            term = f"%{escaped}%"
            conditions.append(
                or_(
                    Therapist.full_name.ilike(term, escape="\\"),
                    Therapist.specialty.ilike(term, escape="\\"),
                )
            )

        total = await self.session.scalar(
            select(func.count()).select_from(Therapist).where(*conditions)
        )
        result = await self.session.execute(
            select(Therapist)
            .where(*conditions)
            .order_by(Therapist.full_name)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total or 0

    def add(self, therapist: Therapist) -> None:
        self.session.add(therapist)

    async def get_override(
        self, therapist_id: int, date: dt.date
    ) -> TherapistScheduleOverride | None:
        result = await self.session.execute(
            select(TherapistScheduleOverride).where(
                TherapistScheduleOverride.therapist_id == therapist_id,
                TherapistScheduleOverride.date == date,
            )
        )
        return result.scalar_one_or_none()

    async def delete_override(self, override: TherapistScheduleOverride) -> None:
        await self.session.delete(override)

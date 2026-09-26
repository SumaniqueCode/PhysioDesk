from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.patient import Patient, PatientStatus


class PatientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, patient_id: int) -> Patient | None:
        return await self.session.get(Patient, patient_id)

    async def get_with_therapist(self, patient_id: int) -> Patient | None:
        result = await self.session.execute(
            select(Patient)
            .where(Patient.id == patient_id)
            .options(selectinload(Patient.assigned_therapist))
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        search: str | None,
        status: PatientStatus | None,
        therapist_id: int | None,
        offset: int,
        limit: int,
    ) -> tuple[list[Patient], int]:
        conditions = []
        if status is not None:
            conditions.append(Patient.status == status)
        if therapist_id is not None:
            conditions.append(Patient.assigned_therapist_id == therapist_id)
        if search:
            # Escape LIKE wildcards so a literal % or _ in the query matches itself.
            escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            term = f"%{escaped}%"
            conditions.append(
                or_(
                    Patient.full_name.ilike(term, escape="\\"),
                    Patient.email.ilike(term, escape="\\"),
                    Patient.phone.ilike(term, escape="\\"),
                )
            )

        total = await self.session.scalar(
            select(func.count()).select_from(Patient).where(*conditions)
        )
        result = await self.session.execute(
            select(Patient)
            .where(*conditions)
            .options(selectinload(Patient.assigned_therapist))
            .order_by(Patient.full_name)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total or 0

    def add(self, patient: Patient) -> None:
        self.session.add(patient)

    async def delete(self, patient: Patient) -> None:
        await self.session.delete(patient)

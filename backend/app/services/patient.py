from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, NotFoundError
from app.models.patient import Patient, PatientStatus
from app.models.therapist import Therapist
from app.repositories.patient import PatientRepository
from app.repositories.therapist import TherapistRepository
from app.schemas.patient import PatientCreate, PatientUpdate

# Columns without a nullable default; an explicit null on PATCH must be rejected, not persisted.
_REQUIRED_FIELDS = ("full_name", "status")


class PatientService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = PatientRepository(session)

    async def list(
        self,
        *,
        search: str | None,
        status: PatientStatus | None,
        therapist_id: int | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Patient], int]:
        offset = (page - 1) * page_size
        return await self.repo.list(
            search=search,
            status=status,
            therapist_id=therapist_id,
            offset=offset,
            limit=page_size,
        )

    async def get(self, patient_id: int) -> Patient:
        patient = await self.repo.get_with_therapist(patient_id)
        if patient is None:
            raise NotFoundError("Patient not found")
        return patient

    async def _get_or_404(self, patient_id: int) -> Patient:
        # Lightweight fetch by PK for write paths that reload before serializing.
        patient = await self.repo.get(patient_id)
        if patient is None:
            raise NotFoundError("Patient not found")
        return patient

    async def _load_therapist(self, therapist_id: int) -> Therapist:
        # A newly assigned therapist must exist and still be taking patients.
        therapist = await TherapistRepository(self.session).get(therapist_id)
        if therapist is None:
            raise NotFoundError("Assigned therapist not found")
        if not therapist.is_active:
            raise AppError(422, "Assigned therapist is not active")
        return therapist

    async def create(self, payload: PatientCreate) -> Patient:
        patient = Patient(**payload.model_dump())
        if payload.assigned_therapist_id is not None:
            # Attach the validated therapist so serialization needs no extra query.
            patient.assigned_therapist = await self._load_therapist(payload.assigned_therapist_id)
        self.repo.add(patient)
        await self.session.flush()
        return patient

    async def update(self, patient_id: int, payload: PatientUpdate) -> Patient:
        patient = await self._get_or_404(patient_id)
        # Only apply keys the client actually sent, so an omitted field stays unchanged.
        data = payload.model_dump(exclude_unset=True)
        # Re-validate the therapist only when the assignment changes to a different one,
        # so a patient whose therapist was later deactivated stays editable.
        new_therapist_id = data.get("assigned_therapist_id")
        if (
            "assigned_therapist_id" in data
            and new_therapist_id is not None
            and new_therapist_id != patient.assigned_therapist_id
        ):
            await self._load_therapist(new_therapist_id)
        for field, value in data.items():
            if value is None and field in _REQUIRED_FIELDS:
                raise AppError(422, f"{field} cannot be null")
            setattr(patient, field, value)
        await self.session.flush()
        return await self.get(patient.id)

    async def delete(self, patient_id: int) -> None:
        patient = await self._get_or_404(patient_id)
        await self.repo.delete(patient)
        await self.session.flush()

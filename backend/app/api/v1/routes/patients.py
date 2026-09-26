from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUser, SessionDep
from app.models.patient import PatientStatus
from app.schemas.common import Page
from app.schemas.patient import PatientCreate, PatientRead, PatientUpdate
from app.services.patient import PatientService

router = APIRouter(prefix="/patients", tags=["patients"])

# Patient records are managed by reception staff and admins alike, so any authenticated
# user may read and write them; role gating stays on therapist and billing management.


@router.get("", response_model=Page[PatientRead])
async def list_patients(
    _: CurrentUser,
    session: SessionDep,
    search: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[PatientStatus | None, Query(alias="status")] = None,
    therapist_id: Annotated[int | None, Query(ge=1)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[PatientRead]:
    items, total = await PatientService(session).list(
        search=search,
        status=status_filter,
        therapist_id=therapist_id,
        page=page,
        page_size=page_size,
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{patient_id}", response_model=PatientRead)
async def get_patient(patient_id: int, _: CurrentUser, session: SessionDep):
    return await PatientService(session).get(patient_id)


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(payload: PatientCreate, _: CurrentUser, session: SessionDep):
    patient = await PatientService(session).create(payload)
    await session.commit()
    return patient


@router.patch("/{patient_id}", response_model=PatientRead)
async def update_patient(
    patient_id: int, payload: PatientUpdate, _: CurrentUser, session: SessionDep
):
    patient = await PatientService(session).update(patient_id, payload)
    await session.commit()
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(patient_id: int, _: CurrentUser, session: SessionDep) -> None:
    await PatientService(session).delete(patient_id)
    await session.commit()

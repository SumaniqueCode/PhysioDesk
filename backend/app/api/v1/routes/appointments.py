import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUser, SessionDep
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentRead,
    AppointmentUpdate,
    Availability,
    DaySchedule,
)
from app.schemas.common import Page
from app.services.appointment import AppointmentService

router = APIRouter(prefix="/appointments", tags=["appointments"])

# Scheduling is reception work, so any authenticated user may book and manage appointments.


@router.get("", response_model=Page[AppointmentRead])
async def list_appointments(
    _: CurrentUser,
    session: SessionDep,
    patient_id: Annotated[int | None, Query(ge=1)] = None,
    therapist_id: Annotated[int | None, Query(ge=1)] = None,
    appointment_status: Annotated[AppointmentStatus | None, Query(alias="status")] = None,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[AppointmentRead]:
    items, total = await AppointmentService(session).list(
        patient_id=patient_id,
        therapist_id=therapist_id,
        status=appointment_status,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/schedule", response_model=DaySchedule)
async def day_schedule(date: dt.date, _: CurrentUser, session: SessionDep) -> DaySchedule:
    return await AppointmentService(session).day_schedule(date)


@router.get("/availability", response_model=Availability)
async def availability(
    therapist_id: Annotated[int, Query(ge=1)],
    date: dt.date,
    _: CurrentUser,
    session: SessionDep,
) -> Availability:
    return await AppointmentService(session).availability(therapist_id, date)


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment(appointment_id: int, _: CurrentUser, session: SessionDep):
    return await AppointmentService(session).get(appointment_id)


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreate, _: CurrentUser, session: SessionDep):
    appointment = await AppointmentService(session).create(payload)
    await session.commit()
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: int, payload: AppointmentUpdate, _: CurrentUser, session: SessionDep
):
    appointment = await AppointmentService(session).update(appointment_id, payload)
    await session.commit()
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(appointment_id: int, _: CurrentUser, session: SessionDep) -> None:
    await AppointmentService(session).delete(appointment_id)
    await session.commit()

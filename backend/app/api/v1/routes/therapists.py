import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import CurrentUser, SessionDep, require_roles
from app.models.user import UserRole
from app.schemas.common import Page
from app.schemas.therapist import (
    ScheduleOverrideCreate,
    ScheduleOverrideRead,
    TherapistCreate,
    TherapistDetail,
    TherapistRead,
    TherapistUpdate,
)
from app.services.therapist import TherapistService

router = APIRouter(prefix="/therapists", tags=["therapists"])

# Reads are open to any authenticated user; writes are Admin-only (therapist management).
AdminRequired = Depends(require_roles(UserRole.admin))


@router.get("", response_model=Page[TherapistRead])
async def list_therapists(
    _: CurrentUser,
    session: SessionDep,
    search: Annotated[str | None, Query(max_length=120)] = None,
    # Default to active-only so soft-deleted therapists drop out of the roster and dropdowns.
    is_active: bool | None = True,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[TherapistRead]:
    items, total = await TherapistService(session).list(
        search=search, is_active=is_active, page=page, page_size=page_size
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{therapist_id}", response_model=TherapistDetail)
async def get_therapist(therapist_id: int, _: CurrentUser, session: SessionDep):
    return await TherapistService(session).get(therapist_id)


@router.post(
    "",
    response_model=TherapistDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[AdminRequired],
)
async def create_therapist(payload: TherapistCreate, session: SessionDep) -> TherapistDetail:
    therapist = await TherapistService(session).create(payload)
    await session.commit()
    return TherapistDetail.model_validate(therapist)


@router.patch("/{therapist_id}", response_model=TherapistDetail, dependencies=[AdminRequired])
async def update_therapist(
    therapist_id: int, payload: TherapistUpdate, session: SessionDep
) -> TherapistDetail:
    therapist = await TherapistService(session).update(therapist_id, payload)
    await session.commit()
    return TherapistDetail.model_validate(therapist)


@router.delete(
    "/{therapist_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[AdminRequired]
)
async def delete_therapist(therapist_id: int, session: SessionDep) -> None:
    await TherapistService(session).deactivate(therapist_id)
    await session.commit()


@router.put(
    "/{therapist_id}/overrides",
    response_model=ScheduleOverrideRead,
    dependencies=[AdminRequired],
)
async def set_override(
    therapist_id: int, payload: ScheduleOverrideCreate, session: SessionDep
) -> ScheduleOverrideRead:
    override = await TherapistService(session).set_override(therapist_id, payload)
    await session.commit()
    return ScheduleOverrideRead.model_validate(override)


@router.delete(
    "/{therapist_id}/overrides/{date}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[AdminRequired],
)
async def delete_override(therapist_id: int, date: dt.date, session: SessionDep) -> None:
    await TherapistService(session).remove_override(therapist_id, date)
    await session.commit()

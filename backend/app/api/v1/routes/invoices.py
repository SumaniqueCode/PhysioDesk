from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import CurrentUser, SessionDep, require_roles
from app.models.invoice import InvoiceStatus
from app.models.user import UserRole
from app.schemas.common import Page
from app.schemas.invoice import InvoiceCreate, InvoiceRead, InvoiceUpdate
from app.services.invoice import InvoiceService

router = APIRouter(prefix="/invoices", tags=["invoices"])

# Reads are open to any authenticated user; billing writes are Admin-only (staff cannot bill).
AdminRequired = Depends(require_roles(UserRole.admin))


@router.get("", response_model=Page[InvoiceRead])
async def list_invoices(
    _: CurrentUser,
    session: SessionDep,
    patient_id: Annotated[int | None, Query(ge=1)] = None,
    status_filter: Annotated[InvoiceStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[InvoiceRead]:
    items, total = await InvoiceService(session).list(
        patient_id=patient_id, status=status_filter, page=page, page_size=page_size
    )
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(invoice_id: int, _: CurrentUser, session: SessionDep):
    return await InvoiceService(session).get(invoice_id)


@router.post(
    "",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[AdminRequired],
)
async def create_invoice(payload: InvoiceCreate, session: SessionDep):
    invoice = await InvoiceService(session).create(payload)
    await session.commit()
    return invoice


@router.patch("/{invoice_id}", response_model=InvoiceRead, dependencies=[AdminRequired])
async def update_invoice(invoice_id: int, payload: InvoiceUpdate, session: SessionDep):
    invoice = await InvoiceService(session).update(invoice_id, payload)
    await session.commit()
    return invoice


@router.delete(
    "/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[AdminRequired]
)
async def delete_invoice(invoice_id: int, session: SessionDep) -> None:
    await InvoiceService(session).delete(invoice_id)
    await session.commit()

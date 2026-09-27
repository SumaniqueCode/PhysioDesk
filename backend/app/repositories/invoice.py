from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.invoice import Invoice, InvoiceStatus


class InvoiceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, invoice_id: int) -> Invoice | None:
        return await self.session.get(Invoice, invoice_id)

    async def get_with_patient(self, invoice_id: int) -> Invoice | None:
        result = await self.session.execute(
            select(Invoice).where(Invoice.id == invoice_id).options(selectinload(Invoice.patient))
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        patient_id: int | None,
        status: InvoiceStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[Invoice], int]:
        conditions = []
        if patient_id is not None:
            conditions.append(Invoice.patient_id == patient_id)
        if status is not None:
            conditions.append(Invoice.status == status)

        total = await self.session.scalar(
            select(func.count()).select_from(Invoice).where(*conditions)
        )
        result = await self.session.execute(
            select(Invoice)
            .where(*conditions)
            .options(selectinload(Invoice.patient))
            .order_by(Invoice.issued_date.desc(), Invoice.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total or 0

    def add(self, invoice: Invoice) -> None:
        self.session.add(invoice)

    async def delete(self, invoice: Invoice) -> None:
        await self.session.delete(invoice)

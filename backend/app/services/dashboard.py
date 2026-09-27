import datetime as dt

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.appointment import AppointmentRepository
from app.repositories.dashboard import DashboardRepository
from app.schemas.dashboard import DashboardStats


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = DashboardRepository(session)
        self.appointments = AppointmentRepository(session)

    async def stats(self) -> DashboardStats:
        # "Today" is anchored in UTC so the revenue window matches how paid_at is stamped.
        now = dt.datetime.now(dt.UTC)
        today = now.date()
        start = dt.datetime.combine(today, dt.time.min, dt.UTC)
        end = start + dt.timedelta(days=1)

        active_patients = await self.repo.active_patient_count()
        appointments_today, completed_today = await self.repo.appointment_counts(today)
        revenue_today = await self.repo.revenue_collected(start, end)
        outstanding_total, outstanding_count = await self.repo.outstanding()
        todays_appointments = await self.appointments.for_date(today)

        return DashboardStats(
            active_patients=active_patients,
            appointments_today=appointments_today,
            appointments_completed_today=completed_today,
            revenue_today=revenue_today,
            outstanding_total=outstanding_total,
            outstanding_count=outstanding_count,
            todays_appointments=todays_appointments,
        )

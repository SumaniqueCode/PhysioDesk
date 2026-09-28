import datetime as dt

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dashboard import DashboardRepository
from app.schemas.appointment import TherapistSummary
from app.schemas.dashboard import DashboardStats, RecentPatient, TherapistCapacity
from app.services.appointment import AppointmentService


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = DashboardRepository(session)
        self.appointments = AppointmentService(session)

    async def stats(self) -> DashboardStats:
        # "Today" is anchored in UTC so the revenue window matches how paid_at is stamped.
        now = dt.datetime.now(dt.UTC)
        today = now.date()
        start = dt.datetime.combine(today, dt.time.min, dt.UTC)
        end = start + dt.timedelta(days=1)

        # Reuse the schedule grid so on-duty count, capacity and open slots all agree with it.
        day = await self.appointments.day_schedule(today)
        on_duty = [col for col in day.therapists if not col.is_day_off]
        capacity: list[TherapistCapacity] = []
        open_slots_today = 0
        for col in on_duty:
            booked = sum(1 for slot in col.slots if slot.appointment is not None)
            free = len(col.slots) - booked
            open_slots_today += free
            capacity.append(
                TherapistCapacity(
                    therapist=col.therapist, booked=booked, open=free, total=len(col.slots)
                )
            )

        patients_seen_today = await self.repo.patients_seen_today(today)
        revenue_today = await self.repo.revenue_collected(start, end)
        recent_patients = [
            RecentPatient(
                id=patient.id,
                full_name=patient.full_name,
                condition=patient.medical_notes,
                package=patient.package,
                status=patient.status,
                assigned_therapist=(
                    TherapistSummary.model_validate(patient.assigned_therapist)
                    if patient.assigned_therapist
                    else None
                ),
            )
            for patient in await self.repo.recent_patients(limit=8)
        ]

        return DashboardStats(
            patients_seen_today=patients_seen_today,
            therapists_on_duty_today=len(on_duty),
            revenue_today=revenue_today,
            open_slots_today=open_slots_today,
            capacity=capacity,
            recent_patients=recent_patients,
        )

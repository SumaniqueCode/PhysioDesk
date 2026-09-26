import asyncio
import datetime as dt

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.appointment import Appointment, AppointmentStatus, PaymentMethod
from app.models.patient import Patient, PatientStatus
from app.models.therapist import Therapist
from app.models.user import User, UserRole

SEED_USERS = [
    {
        "email": "admin@physiodesk.com",
        "full_name": "Admin User",
        "role": UserRole.admin,
        "password": "Admin@123",
    },
    {
        "email": "staff@physiodesk.com",
        "full_name": "Reception Staff",
        "role": UserRole.staff,
        "password": "Staff@123",
    },
]

# Weekdays are Mon=0..Sun=6 (matches date.weekday()).
SEED_THERAPISTS = [
    {
        "full_name": "Dr. Anita Rao",
        "specialty": "Sports Rehabilitation",
        "working_days": [0, 1, 2, 3, 4],
        "start_time": dt.time(9, 0),
        "end_time": dt.time(17, 0),
        "slot_duration_minutes": 30,
    },
    {
        "full_name": "Dr. Marcus Lim",
        "specialty": "Orthopedic Physiotherapy",
        "working_days": [0, 2, 4],
        "start_time": dt.time(10, 0),
        "end_time": dt.time(18, 0),
        "slot_duration_minutes": 45,
    },
    {
        "full_name": "Dr. Priya Nair",
        "specialty": "Neurological Rehabilitation",
        "working_days": [1, 3, 5],
        "start_time": dt.time(8, 30),
        "end_time": dt.time(14, 30),
        "slot_duration_minutes": 30,
    },
    {
        "full_name": "Dr. Samuel Okafor",
        "specialty": "Pediatric Physiotherapy",
        "working_days": [0, 1, 2, 3, 4],
        "start_time": dt.time(9, 0),
        "end_time": dt.time(15, 0),
        "slot_duration_minutes": 60,
    },
]


# therapist_name is resolved to an assigned_therapist_id at seed time.
SEED_PATIENTS = [
    {
        "full_name": "Ella Bennett",
        "email": "ella.bennett@example.com",
        "phone": "555-0142",
        "date_of_birth": dt.date(1991, 4, 18),
        "address": "12 Rosewood Ave, Springfield",
        "medical_notes": "Post-ACL reconstruction; building quad strength.",
        "status": PatientStatus.active,
        "therapist_name": "Dr. Anita Rao",
    },
    {
        "full_name": "Owen Carter",
        "email": "owen.carter@example.com",
        "phone": "555-0177",
        "date_of_birth": dt.date(1978, 11, 2),
        "address": "8 Maple Street, Springfield",
        "medical_notes": "Chronic lower-back pain; postural correction plan.",
        "status": PatientStatus.active,
        "therapist_name": "Dr. Marcus Lim",
    },
    {
        "full_name": "Sofia Alvarez",
        "email": "sofia.alvarez@example.com",
        "phone": "555-0193",
        "date_of_birth": dt.date(2015, 6, 27),
        "address": "45 Birch Lane, Springfield",
        "medical_notes": "Pediatric gait training; reviews fortnightly.",
        "status": PatientStatus.on_hold,
        "therapist_name": "Dr. Samuel Okafor",
    },
    {
        "full_name": "Henry Whitfield",
        "email": None,
        "phone": "555-0210",
        "date_of_birth": dt.date(1963, 1, 9),
        "address": "3 Cedar Court, Springfield",
        "medical_notes": "Stroke rehabilitation; discharged after goals met.",
        "status": PatientStatus.completed,
        "therapist_name": "Dr. Priya Nair",
    },
]


_PAYMENT_CYCLE = [PaymentMethod.card, PaymentMethod.cash, PaymentMethod.insurance]


def _nearest_working_date(base: dt.date, working_days: list[int], direction: int) -> dt.date:
    # Walk day-by-day from base until we hit a weekday the therapist works.
    day = base + dt.timedelta(days=direction)
    for _ in range(14):
        if day.weekday() in working_days:
            return day
        day += dt.timedelta(days=direction)
    return base


def _slot_end(start: dt.time, minutes: int) -> dt.time:
    return (dt.datetime.combine(dt.date.min, start) + dt.timedelta(minutes=minutes)).time()


async def _seed_appointments(session) -> int:
    today = dt.date.today()
    created = 0
    for i, data in enumerate(SEED_PATIENTS):
        patient = await session.scalar(
            select(Patient).where(Patient.full_name == data["full_name"])
        )
        therapist = await session.scalar(
            select(Therapist).where(Therapist.full_name == data["therapist_name"])
        )
        if patient is None or therapist is None:
            continue
        # One completed visit in the past and one upcoming booking per patient.
        plan = [
            (_nearest_working_date(today, therapist.working_days, -1), AppointmentStatus.completed),
            (_nearest_working_date(today, therapist.working_days, 1), AppointmentStatus.scheduled),
        ]
        for date, status in plan:
            start = therapist.start_time
            exists = await session.scalar(
                select(Appointment).where(
                    Appointment.therapist_id == therapist.id,
                    Appointment.date == date,
                    Appointment.start_time == start,
                )
            )
            if exists:
                continue
            session.add(
                Appointment(
                    patient_id=patient.id,
                    therapist_id=therapist.id,
                    date=date,
                    start_time=start,
                    end_time=_slot_end(start, therapist.slot_duration_minutes),
                    status=status,
                    payment_method=_PAYMENT_CYCLE[i % len(_PAYMENT_CYCLE)],
                    notes=None,
                )
            )
            created += 1
    return created


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for data in SEED_USERS:
            exists = await session.scalar(select(User).where(User.email == data["email"]))
            if exists:
                continue
            session.add(
                User(
                    email=data["email"],
                    full_name=data["full_name"],
                    role=data["role"],
                    password_hash=hash_password(data["password"]),
                    is_active=True,
                )
            )

        for data in SEED_THERAPISTS:
            exists = await session.scalar(
                select(Therapist).where(Therapist.full_name == data["full_name"])
            )
            if exists:
                continue
            session.add(Therapist(**data))

        # Flush so newly seeded therapists get ids before patients reference them by name.
        await session.flush()

        for data in SEED_PATIENTS:
            exists = await session.scalar(
                select(Patient).where(Patient.full_name == data["full_name"])
            )
            if exists:
                continue
            therapist = await session.scalar(
                select(Therapist).where(Therapist.full_name == data["therapist_name"])
            )
            fields = {k: v for k, v in data.items() if k != "therapist_name"}
            session.add(
                Patient(**fields, assigned_therapist_id=therapist.id if therapist else None)
            )

        # Flush so patients get ids before their appointments reference them.
        await session.flush()
        appointments = await _seed_appointments(session)

        await session.commit()
    # Credentials are intentionally not logged; the README lists the test logins.
    print("Seed complete. See the README for test login credentials.")
    print(f"  {len(SEED_USERS)} users, {len(SEED_THERAPISTS)} therapists")
    print(f"  {len(SEED_PATIENTS)} patients, {appointments} appointments")


if __name__ == "__main__":
    asyncio.run(seed())

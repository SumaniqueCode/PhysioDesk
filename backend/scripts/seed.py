import asyncio
import datetime as dt

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
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

        await session.commit()
    print("Seed complete.")
    print("  admin@physiodesk.com / Admin@123 (admin)")
    print("  staff@physiodesk.com / Staff@123 (staff)")
    print(f"  {len(SEED_THERAPISTS)} therapists")
    print(f"  {len(SEED_PATIENTS)} patients")


if __name__ == "__main__":
    asyncio.run(seed())

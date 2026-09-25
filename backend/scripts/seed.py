import asyncio
import datetime as dt

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
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

        await session.commit()
    print("Seed complete.")
    print("  admin@physiodesk.com / Admin@123 (admin)")
    print("  staff@physiodesk.com / Staff@123 (staff)")
    print(f"  {len(SEED_THERAPISTS)} therapists")


if __name__ == "__main__":
    asyncio.run(seed())

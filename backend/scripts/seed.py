import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
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
        await session.commit()
    print("Seed complete.")
    print("  admin@physiodesk.com / Admin@123 (admin)")
    print("  staff@physiodesk.com / Staff@123 (staff)")


if __name__ == "__main__":
    asyncio.run(seed())

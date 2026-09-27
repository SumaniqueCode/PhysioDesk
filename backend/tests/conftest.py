import asyncio
import os
from pathlib import Path


def _test_database_url() -> str:
    # Prefer an explicit override, else reuse the dev DATABASE_URL with a dedicated _test database
    # so the suite never touches development data.
    override = os.environ.get("TEST_DATABASE_URL")
    if override:
        return override
    url = os.environ.get("DATABASE_URL")
    if not url:
        env_file = Path(__file__).resolve().parents[1] / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                stripped = line.strip()
                if stripped.startswith("DATABASE_URL="):
                    url = stripped.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    url = url or "postgresql+asyncpg://physiodesk:physiodesk@localhost:5432/physiodesk"
    base, _, _name = url.rpartition("/")
    return f"{base}/physiodesk_test"


# Set before importing app modules so the engine binds to the test database.
os.environ["DATABASE_URL"] = _test_database_url()
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-that-is-at-least-32-characters-long")

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool  # noqa: E402

import app.models  # noqa: E402,F401  register every table on the shared metadata
from app.core.deps import get_session  # noqa: E402
from app.core.rate_limit import limiter  # noqa: E402
from app.core.security import create_access_token, hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402

# The suite logs in and calls admin routes repeatedly; the per-IP limiter would 429 those.
limiter.enabled = False

TEST_DB_URL = os.environ["DATABASE_URL"]


def _new_engine():
    # NullPool: every engine hands back connections immediately, so nothing lingers on a
    # closed event loop between tests (each async test runs on its own loop).
    return create_async_engine(TEST_DB_URL, poolclass=NullPool)


# Not autouse: only DB-touching tests build the schema, so the pure unit tests
# (security, RBAC) run without a database.
@pytest.fixture(scope="session")
def _schema():
    async def setup() -> None:
        engine = _new_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    async def teardown() -> None:
        engine = _new_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(setup())
    yield
    asyncio.run(teardown())


@pytest_asyncio.fixture
async def db_engine(_schema):
    engine = _new_engine()
    yield engine
    # Wipe rows after each test so cases stay independent without recreating the schema.
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f'TRUNCATE TABLE "{table.name}" RESTART IDENTITY CASCADE'))
    await engine.dispose()


@pytest_asyncio.fixture
async def db(db_engine) -> AsyncSession:
    maker = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
    async with maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine) -> AsyncClient:
    maker = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)

    async def _override_get_session():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_session] = _override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


TEST_PASSWORD = "Passw0rd!"


async def _make_user(db: AsyncSession, email: str, role: UserRole) -> User:
    user = User(
        email=email,
        full_name="Test User",
        role=role,
        password_hash=hash_password(TEST_PASSWORD),
        is_active=True,
    )
    db.add(user)
    await db.commit()
    return user


def _bearer(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(user.id), user.role.value)}"}


@pytest_asyncio.fixture
async def make_user(db):
    async def _factory(email: str = "user@test.com", role: UserRole = UserRole.staff) -> User:
        return await _make_user(db, email, role)

    return _factory


@pytest_asyncio.fixture
async def admin_headers(db) -> dict[str, str]:
    return _bearer(await _make_user(db, "admin@test.com", UserRole.admin))


@pytest_asyncio.fixture
async def staff_headers(db) -> dict[str, str]:
    return _bearer(await _make_user(db, "staff@test.com", UserRole.staff))

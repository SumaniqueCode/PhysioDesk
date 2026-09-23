import random
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import CredentialsError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository

# Constant hash so auth always runs Argon2 even for unknown emails (avoids timing leaks).
_DUMMY_PASSWORD_HASH = hash_password("physiodesk-timing-guard")


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.tokens = RefreshTokenRepository(session)

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.users.get_by_email(email)
        # Verify even when the user is unknown (dummy hash) so timing can't reveal valid emails.
        password_hash = user.password_hash if user else _DUMMY_PASSWORD_HASH
        is_valid = verify_password(password, password_hash)
        if user is None or not user.is_active or not is_valid:
            raise CredentialsError("Incorrect email or password")
        return user

    async def issue_tokens(self, user: User) -> tuple[str, str]:
        # Prune expired tokens occasionally (not every call) to keep the table bounded.
        if random.random() < 0.05:
            await self.tokens.delete_expired_for_user(user.id)
        access = create_access_token(str(user.id), user.role.value)
        refresh = generate_refresh_token()
        expires = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
        await self.tokens.create(user.id, hash_refresh_token(refresh), expires)
        return access, refresh

    async def rotate(self, refresh_token: str) -> tuple[str, str, User]:
        stored = await self.tokens.get_active(hash_refresh_token(refresh_token))
        if stored is None or stored.expires_at < datetime.now(UTC):
            raise CredentialsError("Invalid or expired refresh token")
        # Rotation: the presented token is single-use; revoke before issuing a new pair.
        await self.tokens.revoke(stored)
        user = await self.users.get(stored.user_id)
        if user is None or not user.is_active:
            raise CredentialsError()
        access, new_refresh = await self.issue_tokens(user)
        return access, new_refresh, user

    async def logout(self, refresh_token: str) -> None:
        stored = await self.tokens.get_active(hash_refresh_token(refresh_token))
        if stored is not None:
            await self.tokens.revoke(stored)

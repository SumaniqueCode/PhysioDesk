from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CredentialsError, PermissionDeniedError
from app.core.security import decode_token
from app.db.session import get_session
from app.models.user import User, UserRole
from app.repositories.user import UserRepository

SessionDep = Annotated[AsyncSession, Depends(get_session)]

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None:
        raise CredentialsError("Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise CredentialsError() from exc
    if payload.get("type") != "access":
        raise CredentialsError()
    subject = payload.get("sub")
    if not subject:
        raise CredentialsError()
    try:
        user_id = int(subject)
    except (TypeError, ValueError) as exc:
        raise CredentialsError() from exc
    user = await UserRepository(session).get(user_id)
    if user is None or not user.is_active:
        raise CredentialsError()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    """Dependency factory enforcing that the current user holds one of `roles`."""

    async def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise PermissionDeniedError()
        return user

    return checker

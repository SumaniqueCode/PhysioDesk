from typing import Annotated

from fastapi import APIRouter, Cookie, Request, Response

from app.core.config import settings
from app.core.deps import CurrentUser, SessionDep
from app.core.exceptions import CredentialsError
from app.core.rate_limit import limiter
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "physiodesk_refresh"


def _set_refresh_cookie(response: Response, token: str) -> None:
    # Cross-site cookies (split frontend/API origins) require SameSite=None + Secure in production.
    secure = settings.environment == "production"
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/",
    )


def _token_response(access: str) -> TokenResponse:
    return TokenResponse(access_token=access, expires_in=settings.access_token_expire_minutes * 60)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request, response: Response, payload: LoginRequest, session: SessionDep
) -> TokenResponse:
    service = AuthService(session)
    user = await service.authenticate(payload.email, payload.password)
    access, refresh = await service.issue_tokens(user)
    await session.commit()
    _set_refresh_cookie(response, refresh)
    return _token_response(access)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh(
    request: Request,
    response: Response,
    session: SessionDep,
    physiodesk_refresh: Annotated[str | None, Cookie()] = None,
) -> TokenResponse:
    if not physiodesk_refresh:
        raise CredentialsError("Missing refresh token")
    access, new_refresh, _user = await AuthService(session).rotate(physiodesk_refresh)
    await session.commit()
    _set_refresh_cookie(response, new_refresh)
    return _token_response(access)


@router.post("/logout")
async def logout(
    response: Response,
    session: SessionDep,
    physiodesk_refresh: Annotated[str | None, Cookie()] = None,
) -> dict[str, str]:
    if physiodesk_refresh:
        await AuthService(session).logout(physiodesk_refresh)
        await session.commit()
    response.delete_cookie(REFRESH_COOKIE, path="/")
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser):
    return user

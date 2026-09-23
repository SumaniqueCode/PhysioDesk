from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base for expected, client-facing errors mapped to an HTTP status."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail


class CredentialsError(AppError):
    def __init__(self, detail: str = "Could not validate credentials") -> None:
        super().__init__(401, detail)


class PermissionDeniedError(AppError):
    def __init__(self, detail: str = "You do not have permission to perform this action") -> None:
        super().__init__(403, detail)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Flatten FastAPI's list-shaped validation errors to AppError's {"detail": str} contract.
    parts = []
    for err in exc.errors():
        field = ".".join(str(p) for p in err["loc"][1:]) or "body"
        parts.append(f"{field}: {err['msg']}")
    return JSONResponse(status_code=422, content={"detail": "; ".join(parts) or "Invalid request"})

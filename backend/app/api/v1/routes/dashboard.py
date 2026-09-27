from fastapi import APIRouter

from app.core.deps import CurrentUser, SessionDep
from app.schemas.dashboard import DashboardStats
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(_: CurrentUser, session: SessionDep) -> DashboardStats:
    # Read-only overview; open to any authenticated user (admin and staff alike).
    return await DashboardService(session).stats()

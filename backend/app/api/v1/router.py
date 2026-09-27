from fastapi import APIRouter

from app.api.v1.routes import (
    appointments,
    auth,
    dashboard,
    health,
    invoices,
    patients,
    therapists,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(therapists.router)
api_router.include_router(patients.router)
api_router.include_router(appointments.router)
api_router.include_router(invoices.router)
api_router.include_router(dashboard.router)

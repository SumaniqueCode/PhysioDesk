from decimal import Decimal

from pydantic import BaseModel

from app.schemas.appointment import AppointmentRead


class DashboardStats(BaseModel):
    active_patients: int
    appointments_today: int
    appointments_completed_today: int
    # Money travels as decimal strings, like invoices, to avoid float drift.
    revenue_today: Decimal
    outstanding_total: Decimal
    outstanding_count: int
    todays_appointments: list[AppointmentRead]

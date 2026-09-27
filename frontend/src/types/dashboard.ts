import type { Appointment } from "@/types/appointment";

// Money fields arrive as decimal strings, matching the invoice API.
export interface DashboardStats {
  active_patients: number;
  appointments_today: number;
  appointments_completed_today: number;
  revenue_today: string;
  outstanding_total: string;
  outstanding_count: number;
  todays_appointments: Appointment[];
}

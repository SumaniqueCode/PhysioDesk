import type { TherapistSummary } from "@/types/appointment";
import type { PatientStatus } from "@/types/patient";

export interface TherapistCapacity {
  therapist: TherapistSummary;
  booked: number;
  open: number;
  total: number;
}

export interface RecentPatient {
  id: number;
  full_name: string;
  condition: string | null;
  package: string | null;
  status: PatientStatus;
  assigned_therapist: TherapistSummary | null;
}

// Money fields arrive as decimal strings, matching the invoice API.
export interface DashboardStats {
  patients_seen_today: number;
  therapists_on_duty_today: number;
  revenue_today: string;
  open_slots_today: number;
  capacity: TherapistCapacity[];
  recent_patients: RecentPatient[];
}

import type { PatientStatus } from "@/types/patient";

// Times are "HH:MM:SS" and dates "YYYY-MM-DD" — the shapes FastAPI serializes.
export type AppointmentStatus = "scheduled" | "completed";
export type PaymentMethod = "cash" | "card" | "insurance";

export interface PatientSummary {
  id: number;
  full_name: string;
  status: PatientStatus;
}

export interface TherapistSummary {
  id: number;
  full_name: string;
  specialty: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  therapist_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  patient: PatientSummary;
  therapist: TherapistSummary;
}

export interface Slot {
  start_time: string;
  end_time: string;
  appointment: Appointment | null;
}

export interface TherapistDaySchedule {
  therapist: TherapistSummary;
  is_day_off: boolean;
  slots: Slot[];
}

export interface DaySchedule {
  date: string;
  therapists: TherapistDaySchedule[];
}

export interface OpenSlot {
  start_time: string;
  end_time: string;
}

export interface Availability {
  date: string;
  therapist_id: number;
  slots: OpenSlot[];
}

// Sent to POST /appointments.
export interface AppointmentCreatePayload {
  patient_id: number;
  therapist_id: number;
  date: string;
  start_time: string;
  payment_method: PaymentMethod;
  notes: string | null;
}

// Sent to PATCH /appointments/{id}; only changed fields need be present.
export interface AppointmentUpdatePayload {
  date?: string;
  start_time?: string;
  status?: AppointmentStatus;
  payment_method?: PaymentMethod;
  notes?: string | null;
}

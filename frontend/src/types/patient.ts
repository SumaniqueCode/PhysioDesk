// Dates are "YYYY-MM-DD"; nullable fields come back as null, not omitted.
export type PatientStatus = "active" | "completed" | "on_hold";

export interface AssignedTherapist {
  id: number;
  full_name: string;
  specialty: string;
  is_active: boolean;
}

export interface Patient {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  medical_notes: string | null;
  status: PatientStatus;
  assigned_therapist_id: number | null;
  assigned_therapist: AssignedTherapist | null;
  age: number | null;
}

// Sent to POST/PATCH. Empty optional fields are sent as null to clear them server-side.
export interface PatientPayload {
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  medical_notes: string | null;
  status: PatientStatus;
  assigned_therapist_id: number | null;
}

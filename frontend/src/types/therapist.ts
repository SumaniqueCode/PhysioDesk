// Times are "HH:MM:SS" and dates "YYYY-MM-DD" — the shapes FastAPI serializes.
export interface Therapist {
  id: number;
  full_name: string;
  specialty: string;
  working_days: number[];
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  weekly_hours: number;
}

export interface ScheduleOverride {
  id: number;
  date: string;
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface TherapistDetail extends Therapist {
  schedule_overrides: ScheduleOverride[];
}

// Sent to POST/PATCH; PATCH tolerates a full body since the API ignores unchanged fields.
export interface TherapistPayload {
  full_name: string;
  specialty: string;
  working_days: number[];
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export interface ScheduleOverridePayload {
  date: string;
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
}

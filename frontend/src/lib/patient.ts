import type { PatientGender, PatientStatus } from "@/types/patient";
import type { StatusPillProps } from "@/components/ui";

type Tone = NonNullable<StatusPillProps["tone"]>;

// Gender options offered on the patient form; kept small and inclusive.
export const PATIENT_GENDERS: { value: PatientGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function genderLabel(gender: PatientGender | null): string {
  return PATIENT_GENDERS.find((g) => g.value === gender)?.label ?? "—";
}

// Treatment packages the clinic offers; the selected label is stored as-is.
export const PATIENT_PACKAGES = [
  "Single consultation",
  "6-session rehab",
  "12-session rehab",
  "Sports recovery",
  "Post-surgery care",
  "Ongoing management",
];

// Single source for status labels + pill tones so the list, filter, and detail stay in sync.
export const PATIENT_STATUSES: { value: PatientStatus; label: string; tone: Tone }[] = [
  { value: "active", label: "Active", tone: "success" },
  { value: "on_hold", label: "On hold", tone: "primary" },
  { value: "completed", label: "Completed", tone: "neutral" },
];

const STATUS_META = Object.fromEntries(PATIENT_STATUSES.map((s) => [s.value, s]));

export function statusLabel(status: PatientStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function statusTone(status: PatientStatus): Tone {
  return STATUS_META[status]?.tone ?? "neutral";
}

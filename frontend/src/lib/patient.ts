import type { PatientStatus } from "@/types/patient";
import type { StatusPillProps } from "@/components/ui";

type Tone = NonNullable<StatusPillProps["tone"]>;

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

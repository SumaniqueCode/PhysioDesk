import type { AppointmentStatus, PaymentMethod } from "@/types/appointment";
import type { StatusPillProps } from "@/components/ui";

type Tone = NonNullable<StatusPillProps["tone"]>;

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string; tone: Tone }[] = [
  { value: "scheduled", label: "Scheduled", tone: "primary" },
  { value: "completed", label: "Completed", tone: "success" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "insurance", label: "Insurance" },
];

const STATUS_META = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s.value, s]));
const PAYMENT_META = Object.fromEntries(PAYMENT_METHODS.map((p) => [p.value, p]));

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function appointmentStatusTone(status: AppointmentStatus): Tone {
  return STATUS_META[status]?.tone ?? "neutral";
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_META[method]?.label ?? method;
}

// "en-CA" renders as YYYY-MM-DD in local time, matching the API's date shape without a TZ shift.
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function shiftISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

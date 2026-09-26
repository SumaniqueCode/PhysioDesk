// Weekday numbering matches the backend: Mon=0 .. Sun=6 (Python's date.weekday()).
export const WEEKDAYS = [
  { value: 0, short: "Mon", long: "Monday" },
  { value: 1, short: "Tue", long: "Tuesday" },
  { value: 2, short: "Wed", long: "Wednesday" },
  { value: 3, short: "Thu", long: "Thursday" },
  { value: 4, short: "Fri", long: "Friday" },
  { value: 5, short: "Sat", long: "Saturday" },
  { value: 6, short: "Sun", long: "Sunday" },
] as const;

const SHORT = Object.fromEntries(WEEKDAYS.map((d) => [d.value, d.short]));

export function formatWorkingDays(days: number[]): string {
  if (!days.length) return "—";
  return [...days].sort((a, b) => a - b).map((d) => SHORT[d] ?? "?").join(", ");
}

// "09:00:00" | "09:00" -> "9:00 AM"; empty/null -> em dash.
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12}:${m} ${suffix}`;
}

// Trim seconds so a "HH:MM:SS" value fits an <input type="time">.
export function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

// Parse the date as local midnight so the calendar day never shifts across timezones.
export function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

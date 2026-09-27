import type { InvoiceStatus } from "@/types/invoice";
import type { StatusPillProps } from "@/components/ui";

type Tone = NonNullable<StatusPillProps["tone"]>;

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; tone: Tone }[] = [
  { value: "due", label: "Due", tone: "danger" },
  { value: "paid", label: "Paid", tone: "success" },
];

const STATUS_META = Object.fromEntries(INVOICE_STATUSES.map((s) => [s.value, s]));

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function invoiceStatusTone(status: InvoiceStatus): Tone {
  return STATUS_META[status]?.tone ?? "neutral";
}

// Amounts travel as decimal strings to avoid float drift; format them for display only.
const CURRENCY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatCurrency(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? CURRENCY.format(n) : "—";
}

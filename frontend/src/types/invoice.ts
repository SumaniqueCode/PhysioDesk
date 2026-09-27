import type { PatientSummary, PaymentMethod } from "@/types/appointment";

export type InvoiceStatus = "due" | "paid";

// Money fields arrive as decimal strings (e.g. "120.00"); FastAPI serializes Decimal as a string.
export interface Invoice {
  id: number;
  patient_id: number;
  appointment_id: number | null;
  service: string;
  amount: string;
  discount: string;
  status: InvoiceStatus;
  payment_method: PaymentMethod;
  issued_date: string;
  paid_at: string | null;
  notes: string | null;
  patient: PatientSummary | null;
  total: string;
}

// Sent to POST /invoices.
export interface InvoiceCreatePayload {
  patient_id: number;
  appointment_id: number | null;
  service: string;
  amount: string;
  discount: string;
  status: InvoiceStatus;
  payment_method: PaymentMethod;
  issued_date: string | null;
  notes: string | null;
}

// Sent to PATCH /invoices/{id}; only changed fields need be present.
export interface InvoiceUpdatePayload {
  service?: string;
  amount?: string;
  discount?: string;
  status?: InvoiceStatus;
  payment_method?: PaymentMethod;
  issued_date?: string;
  notes?: string | null;
}

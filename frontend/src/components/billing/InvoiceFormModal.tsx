"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal, type SelectOption } from "@/components/ui";
import { SelectField, TextField, TextareaField } from "@/components/form/Fields";
import {
  LIMITS,
  money,
  onlyMoney,
  optionalText,
  requiredChoice,
  requiredDate,
  requiredText,
} from "@/lib/validation";
import { INVOICE_STATUSES } from "@/lib/invoice";
import { PAYMENT_METHODS, todayISO } from "@/lib/appointment";
import { useAllPatients } from "@/hooks/usePatients";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import type { Invoice, InvoiceCreatePayload, InvoiceUpdatePayload } from "@/types/invoice";

const schema = z
  .object({
    patient_id: requiredChoice("Patient"),
    service: requiredText("Service", LIMITS.service),
    amount: money("Amount", { required: true }),
    discount: money("Discount", { required: false }),
    status: z.enum(["due", "paid"], "Select a status"),
    payment_method: z.enum(["cash", "card", "insurance"], "Select a payment method"),
    issued_date: requiredDate("Issue date"),
    notes: optionalText("Notes", LIMITS.notes),
  })
  // Mirror the server rule so the client catches an over-discount before submitting.
  .refine((v) => Number(v.discount || 0) <= Number(v.amount || 0), {
    message: "Discount can't exceed the amount",
    path: ["discount"],
  });

type FormValues = z.infer<typeof schema>;

function defaults(invoice?: Invoice): FormValues {
  return {
    patient_id: invoice ? String(invoice.patient_id) : "",
    service: invoice?.service ?? "",
    amount: invoice?.amount ?? "",
    discount: invoice && invoice.discount !== "0.00" ? invoice.discount : "",
    status: invoice?.status ?? "due",
    payment_method: invoice?.payment_method ?? "cash",
    issued_date: invoice?.issued_date ?? todayISO(),
    notes: invoice?.notes ?? "",
  };
}

// Fields shared by create and edit; the create payload adds the immutable patient/appointment links.
function commonFields(v: FormValues) {
  return {
    service: v.service.trim(),
    amount: v.amount,
    discount: v.discount || "0",
    status: v.status,
    payment_method: v.payment_method,
    issued_date: v.issued_date,
    notes: v.notes.trim() ? v.notes.trim() : null,
  };
}

function toCreate(v: FormValues): InvoiceCreatePayload {
  return { patient_id: Number(v.patient_id), appointment_id: null, ...commonFields(v) };
}

function toUpdate(v: FormValues): InvoiceUpdatePayload {
  return commonFields(v);
}

export function InvoiceFormModal({
  open,
  onClose,
  invoice,
}: {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice;
}) {
  const isEdit = Boolean(invoice);
  const create = useCreateInvoice();
  const update = useUpdateInvoice(invoice?.id ?? 0);
  const pending = create.isPending || update.isPending;

  const { data: patients } = useAllPatients();
  const patientOptions = useMemo<SelectOption[]>(
    () => (patients ?? []).map((p) => ({ value: String(p.id), label: p.full_name })),
    [patients],
  );

  const { handleSubmit, control, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(invoice),
    mode: "onTouched",
  });

  // Re-seed the form each time the modal opens for a (possibly different) invoice.
  useEffect(() => {
    if (open) reset(defaults(invoice));
  }, [open, invoice, reset]);

  const onSubmit = handleSubmit((values) => {
    if (isEdit) {
      update.mutate(toUpdate(values), { onSuccess: onClose });
    } else {
      create.mutate(toCreate(values), { onSuccess: onClose });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit invoice" : "New invoice"}
      description={isEdit ? undefined : "Record the service, amount, and payment status."}
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {isEdit ? (
          <Input label="Patient" value={invoice?.patient?.full_name ?? "—"} readOnly disabled />
        ) : (
          <SelectField
            control={control}
            name="patient_id"
            label="Patient"
            required
            placeholder="Select a patient"
            options={patientOptions}
          />
        )}

        <TextField
          control={control}
          name="service"
          label="Service"
          required
          placeholder="Rehabilitation session"
          maxLength={LIMITS.service}
        />

        <div className="flex flex-col gap-4 sm:flex-row">
          <TextField
            control={control}
            name="amount"
            label="Amount"
            required
            inputMode="decimal"
            placeholder="0.00"
            sanitize={onlyMoney}
          />
          <TextField
            control={control}
            name="discount"
            label="Discount"
            inputMode="decimal"
            placeholder="0.00"
            sanitize={onlyMoney}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <SelectField
            control={control}
            name="status"
            label="Status"
            required
            options={INVOICE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <SelectField
            control={control}
            name="payment_method"
            label="Payment method"
            required
            options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
          />
        </div>

        <TextField control={control} name="issued_date" label="Issue date" type="date" required />

        <TextareaField
          control={control}
          name="notes"
          label="Notes"
          rows={2}
          maxLength={LIMITS.notes}
          placeholder="Anything worth noting on this invoice…"
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="muted" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {isEdit ? "Save changes" : "Create invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

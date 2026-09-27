"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal, Select, Textarea, type SelectOption } from "@/components/ui";
import { INVOICE_STATUSES } from "@/lib/invoice";
import { PAYMENT_METHODS, todayISO } from "@/lib/appointment";
import { useAllPatients } from "@/hooks/usePatients";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import type { Invoice, InvoiceCreatePayload, InvoiceUpdatePayload } from "@/types/invoice";

// Non-negative money with at most two decimals, matching the server's Decimal(scale=2).
const MONEY_RE = /^\d+(\.\d{1,2})?$/;

const schema = z
  .object({
    patient_id: z.string().min(1, "Select a patient"),
    service: z.string().trim().min(1, "Service is required").max(160),
    amount: z.string().refine((v) => MONEY_RE.test(v), "Enter an amount with up to 2 decimals"),
    discount: z
      .string()
      .refine((v) => v === "" || MONEY_RE.test(v), "Enter a discount with up to 2 decimals"),
    status: z.enum(["due", "paid"]),
    payment_method: z.enum(["cash", "card", "insurance"]),
    issued_date: z.string().min(1, "Pick a date"),
    notes: z.string().max(2000),
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(invoice) });

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
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {isEdit ? (
          <Input label="Patient" value={invoice?.patient?.full_name ?? "—"} readOnly disabled />
        ) : (
          <Controller
            control={control}
            name="patient_id"
            render={({ field }) => (
              <Select
                label="Patient"
                placeholder="Select a patient"
                options={patientOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.patient_id?.message}
              />
            )}
          />
        )}

        <Input
          label="Service"
          placeholder="Rehabilitation session"
          error={errors.service?.message}
          {...register("service")}
        />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Input
            label="Discount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.discount?.message}
            {...register("discount")}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                options={INVOICE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="payment_method"
            render={({ field }) => (
              <Select
                label="Payment method"
                options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <Input label="Issue date" type="date" error={errors.issued_date?.message} {...register("issued_date")} />

        <Textarea
          label="Notes"
          rows={2}
          placeholder="Anything worth noting on this invoice…"
          error={errors.notes?.message}
          {...register("notes")}
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

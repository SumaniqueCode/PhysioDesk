"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Modal, type SelectOption } from "@/components/ui";
import { SelectField, TextField, TextareaField } from "@/components/form/Fields";
import { LIMITS, optionalText, requiredChoice, requiredDate } from "@/lib/validation";
import { APPOINTMENT_STATUSES, PAYMENT_METHODS } from "@/lib/appointment";
import { formatTime } from "@/lib/schedule";
import { useActiveTherapists } from "@/hooks/useTherapists";
import { useAllPatients } from "@/hooks/usePatients";
import {
  useAvailability,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/hooks/useAppointments";
import type { Appointment } from "@/types/appointment";

export interface AppointmentPrefill {
  therapist_id?: number;
  date?: string;
  start_time?: string;
}

const schema = z.object({
  patient_id: requiredChoice("Patient"),
  therapist_id: requiredChoice("Therapist"),
  date: requiredDate("Date"),
  start_time: requiredChoice("Time slot"),
  payment_method: z.enum(["cash", "card", "insurance"], "Select a payment method"),
  status: z.enum(["scheduled", "completed"], "Select a status"),
  notes: optionalText("Notes", LIMITS.notes),
});

type FormValues = z.infer<typeof schema>;

function defaults(appointment?: Appointment, prefill?: AppointmentPrefill): FormValues {
  return {
    patient_id: appointment ? String(appointment.patient_id) : "",
    therapist_id: appointment
      ? String(appointment.therapist_id)
      : prefill?.therapist_id
        ? String(prefill.therapist_id)
        : "",
    date: appointment?.date ?? prefill?.date ?? "",
    start_time: appointment?.start_time ?? prefill?.start_time ?? "",
    payment_method: appointment?.payment_method ?? "cash",
    status: appointment?.status ?? "scheduled",
    notes: appointment?.notes ?? "",
  };
}

export function AppointmentFormModal({
  open,
  onClose,
  appointment,
  prefill,
  onCancelAppointment,
}: {
  open: boolean;
  onClose: () => void;
  appointment?: Appointment;
  prefill?: AppointmentPrefill;
  onCancelAppointment?: (appointment: Appointment) => void;
}) {
  const isEdit = Boolean(appointment);
  const create = useCreateAppointment();
  const update = useUpdateAppointment(appointment?.id ?? 0);
  const pending = create.isPending || update.isPending;

  const { data: patients } = useAllPatients();
  const { data: therapists } = useActiveTherapists();

  const { handleSubmit, control, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(appointment, prefill),
    mode: "onTouched",
  });

  // A slot only exists for one therapist/date pair, so changing either invalidates the pick.
  const clearSlot = () => setValue("start_time", "");

  useEffect(() => {
    if (open) reset(defaults(appointment, prefill));
  }, [open, appointment, prefill, reset]);

  const therapistId = useWatch({ control, name: "therapist_id" });
  const date = useWatch({ control, name: "date" });
  const { data: availability, isFetching: loadingSlots } = useAvailability(
    therapistId ? Number(therapistId) : null,
    date,
  );

  const patientOptions = useMemo<SelectOption[]>(
    () => (patients ?? []).map((p) => ({ value: String(p.id), label: p.full_name })),
    [patients],
  );

  const therapistOptions = useMemo<SelectOption[]>(
    () => (therapists ?? []).map((t) => ({ value: String(t.id), label: t.full_name })),
    [therapists],
  );

  // Open slots for the chosen therapist/date, plus the appointment's own slot when editing
  // (it is "booked" by itself and would otherwise be absent).
  const slotOptions = useMemo<SelectOption[]>(() => {
    const slots = availability?.slots ?? [];
    const options = slots.map((s) => ({ value: s.start_time, label: formatTime(s.start_time) }));
    // On its own date the appointment occupies (so hides) its slot; re-add it as the current pick.
    const onOriginalDate = appointment && date === appointment.date;
    if (onOriginalDate && !options.some((o) => o.value === appointment.start_time)) {
      options.push({
        value: appointment.start_time,
        label: `${formatTime(appointment.start_time)} (current)`,
      });
      options.sort((a, b) => a.value.localeCompare(b.value));
    }
    return options;
  }, [availability, appointment, date]);

  const onSubmit = handleSubmit((values) => {
    if (isEdit) {
      update.mutate(
        {
          date: values.date,
          start_time: values.start_time,
          status: values.status,
          payment_method: values.payment_method,
          notes: values.notes.trim() || null,
        },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        {
          patient_id: Number(values.patient_id),
          therapist_id: Number(values.therapist_id),
          date: values.date,
          start_time: values.start_time,
          payment_method: values.payment_method,
          notes: values.notes.trim() || null,
        },
        { onSuccess: onClose },
      );
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit appointment" : "Book appointment"}
      description={isEdit ? undefined : "Pick a patient, therapist and an open slot."}
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {isEdit ? (
          <div className="rounded-lg border border-border bg-background px-3.5 py-3 text-sm">
            <p className="font-medium text-foreground">{appointment!.patient.full_name}</p>
            <p className="text-muted">with {appointment!.therapist.full_name}</p>
          </div>
        ) : (
          <>
            <SelectField
              control={control}
              name="patient_id"
              label="Patient"
              required
              placeholder="Select a patient"
              options={patientOptions}
            />
            <SelectField
              control={control}
              name="therapist_id"
              label="Therapist"
              required
              placeholder="Select a therapist"
              options={therapistOptions}
              onValueChange={clearSlot}
            />
          </>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          <TextField
            control={control}
            name="date"
            label="Date"
            type="date"
            required
            onValueChange={clearSlot}
          />
          <SelectField
            control={control}
            name="start_time"
            label="Time slot"
            required
            options={slotOptions}
            placeholder={
              !therapistId || !date
                ? "Pick therapist & date"
                : loadingSlots
                  ? "Loading…"
                  : slotOptions.length === 0
                    ? "No open slots"
                    : "Select a time"
            }
            disabled={!therapistId || !date || loadingSlots}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <SelectField
            control={control}
            name="payment_method"
            label="Payment method"
            required
            options={PAYMENT_METHODS}
          />
          {isEdit && (
            <SelectField
              control={control}
              name="status"
              label="Status"
              required
              options={APPOINTMENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          )}
        </div>

        <TextareaField
          control={control}
          name="notes"
          label="Notes"
          rows={3}
          maxLength={LIMITS.notes}
          placeholder="Reason for visit, treatment plan…"
        />

        <div className="mt-2 flex items-center gap-3">
          {isEdit && onCancelAppointment && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onCancelAppointment(appointment!)}
              disabled={pending}
            >
              Cancel appointment
            </Button>
          )}
          <div className="ml-auto flex gap-3">
            <Button type="button" variant="muted" size="sm" onClick={onClose} disabled={pending}>
              Close
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {isEdit ? "Save changes" : "Book appointment"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

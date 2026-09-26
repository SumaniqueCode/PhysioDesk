"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal, Select, Textarea, type SelectOption } from "@/components/ui";
import { PATIENT_STATUSES } from "@/lib/patient";
import { useActiveTherapists } from "@/hooks/useTherapists";
import { useCreatePatient, useUpdatePatient } from "@/hooks/usePatients";
import type { Patient, PatientPayload } from "@/types/patient";

const UNASSIGNED = "";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z.string().trim().max(30),
  date_of_birth: z
    .string()
    .refine((v) => !v || v <= new Date().toISOString().slice(0, 10), {
      message: "Date of birth can't be in the future",
    }),
  address: z.string().trim().max(255),
  status: z.enum(["active", "on_hold", "completed"]),
  assigned_therapist_id: z.string(),
  medical_notes: z.string().max(2000),
});

type FormValues = z.infer<typeof schema>;

function defaults(patient?: Patient): FormValues {
  return {
    full_name: patient?.full_name ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    date_of_birth: patient?.date_of_birth ?? "",
    address: patient?.address ?? "",
    status: patient?.status ?? "active",
    assigned_therapist_id: patient?.assigned_therapist_id
      ? String(patient.assigned_therapist_id)
      : UNASSIGNED,
    medical_notes: patient?.medical_notes ?? "",
  };
}

// Trim, then collapse empty optional strings to null so the API clears them.
function toPayload(v: FormValues): PatientPayload {
  const clean = (s: string) => (s.trim() ? s.trim() : null);
  return {
    full_name: v.full_name.trim(),
    email: clean(v.email),
    phone: clean(v.phone),
    date_of_birth: v.date_of_birth || null,
    address: clean(v.address),
    medical_notes: clean(v.medical_notes),
    status: v.status,
    assigned_therapist_id: v.assigned_therapist_id ? Number(v.assigned_therapist_id) : null,
  };
}

export function PatientFormModal({
  open,
  onClose,
  patient,
}: {
  open: boolean;
  onClose: () => void;
  patient?: Patient;
}) {
  const isEdit = Boolean(patient);
  const create = useCreatePatient();
  const update = useUpdatePatient(patient?.id ?? 0);
  const pending = create.isPending || update.isPending;

  const { data: therapists } = useActiveTherapists();

  const therapistOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = [{ value: UNASSIGNED, label: "Unassigned" }];
    for (const t of therapists ?? []) {
      options.push({ value: String(t.id), label: `${t.full_name} · ${t.specialty}` });
    }
    // Keep an assigned therapist missing from the active list visible so editing doesn't
    // silently drop it; only tag it inactive when it actually is.
    const current = patient?.assigned_therapist;
    if (current && !options.some((o) => o.value === String(current.id))) {
      const suffix = current.is_active ? "" : " (inactive)";
      options.push({ value: String(current.id), label: `${current.full_name}${suffix}` });
    }
    return options;
  }, [therapists, patient]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(patient) });

  // Re-seed the form each time the modal opens for a (possibly different) patient.
  useEffect(() => {
    if (open) reset(defaults(patient));
  }, [open, patient, reset]);

  const onSubmit = handleSubmit((values) => {
    const mutation = isEdit ? update : create;
    mutation.mutate(toPayload(values), { onSuccess: onClose });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit patient" : "Add patient"}
      description={isEdit ? undefined : "Record the patient's contact details and assigned therapist."}
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Full name" placeholder="Jane Doe" error={errors.full_name?.message} {...register("full_name")} />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Input label="Email" type="email" placeholder="jane@example.com" error={errors.email?.message} {...register("email")} />
          <Input label="Phone" placeholder="555-0100" error={errors.phone?.message} {...register("phone")} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Input label="Date of birth" type="date" error={errors.date_of_birth?.message} {...register("date_of_birth")} />
          <Input label="Address" placeholder="12 Rosewood Ave" error={errors.address?.message} {...register("address")} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                options={PATIENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="assigned_therapist_id"
            render={({ field }) => (
              <Select
                label="Assigned therapist"
                options={therapistOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <Textarea
          label="Medical notes"
          rows={3}
          placeholder="Conditions, referral reason, treatment plan…"
          error={errors.medical_notes?.message}
          {...register("medical_notes")}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="muted" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {isEdit ? "Save changes" : "Add patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

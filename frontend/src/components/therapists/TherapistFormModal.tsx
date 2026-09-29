"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FieldLabel, FieldMeta, Modal, Select } from "@/components/ui";
import { TextField } from "@/components/form/Fields";
import { cn } from "@/lib/cn";
import { LIMITS, personName, requiredText } from "@/lib/validation";
import { WEEKDAYS, toTimeInput } from "@/lib/schedule";
import { useCreateTherapist, useUpdateTherapist } from "@/hooks/useTherapists";
import type { Therapist } from "@/types/therapist";

const SLOT_OPTIONS = [15, 30, 45, 60, 90].map((m) => ({ value: String(m), label: `${m} min` }));

const schema = z
  .object({
    full_name: personName("Full name"),
    specialty: requiredText("Specialty", LIMITS.specialty),
    working_days: z.array(z.number()).min(1, "Select at least one working day"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    slot_duration_minutes: z.number().int().gt(0).max(240),
  })
  // Times are "HH:MM" strings, so lexical comparison matches chronological order.
  .refine((v) => v.end_time > v.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

type FormValues = z.infer<typeof schema>;

function defaults(therapist?: Therapist): FormValues {
  return {
    full_name: therapist?.full_name ?? "",
    specialty: therapist?.specialty ?? "",
    working_days: therapist?.working_days ?? [],
    start_time: toTimeInput(therapist?.start_time) || "09:00",
    end_time: toTimeInput(therapist?.end_time) || "17:00",
    slot_duration_minutes: therapist?.slot_duration_minutes ?? 30,
  };
}

export function TherapistFormModal({
  open,
  onClose,
  therapist,
}: {
  open: boolean;
  onClose: () => void;
  therapist?: Therapist;
}) {
  const isEdit = Boolean(therapist);
  const create = useCreateTherapist();
  const update = useUpdateTherapist(therapist?.id ?? 0);
  const pending = create.isPending || update.isPending;

  const { handleSubmit, control, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(therapist),
    mode: "onTouched",
  });

  // Re-seed the form each time the modal opens for a (possibly different) therapist.
  useEffect(() => {
    if (open) reset(defaults(therapist));
  }, [open, therapist, reset]);

  const onSubmit = handleSubmit((values) => {
    const mutation = isEdit ? update : create;
    mutation.mutate(values, { onSuccess: onClose });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit therapist" : "Add therapist"}
      description={isEdit ? undefined : "Set the therapist's specialty and weekly availability."}
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          control={control}
          name="full_name"
          label="Full name"
          required
          placeholder="Dr. Jane Doe"
          maxLength={LIMITS.name}
        />
        <TextField
          control={control}
          name="specialty"
          label="Specialty"
          required
          placeholder="Sports Rehabilitation"
          maxLength={LIMITS.specialty}
        />

        <Controller
          control={control}
          name="working_days"
          render={({ field, fieldState }) => (
            <div role="group" aria-labelledby="working-days-label">
              <FieldLabel id="working-days-label" required>
                Working days
              </FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const checked = field.value.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={checked}
                      onClick={() =>
                        field.onChange(
                          checked
                            ? field.value.filter((d) => d !== day.value)
                            : [...field.value, day.value].sort((a, b) => a - b),
                        )
                      }
                      className={cn(
                        "h-9 w-12 rounded-lg border text-sm font-medium transition",
                        checked
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-foreground hover:border-primary/50",
                      )}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
              <FieldMeta error={fieldState.error?.message} />
            </div>
          )}
        />

        <div className="flex flex-col gap-4 sm:flex-row">
          <TextField control={control} name="start_time" label="Start time" type="time" required />
          <TextField control={control} name="end_time" label="End time" type="time" required />
        </div>

        <Controller
          control={control}
          name="slot_duration_minutes"
          render={({ field }) => {
            const current = String(field.value);
            // Keep an API-set value (e.g. 20 min) selectable rather than showing a blank placeholder.
            const options = SLOT_OPTIONS.some((o) => o.value === current)
              ? SLOT_OPTIONS
              : [...SLOT_OPTIONS, { value: current, label: `${current} min` }].sort(
                  (a, b) => Number(a.value) - Number(b.value),
                );
            return (
              <Select
                label="Appointment slot"
                required
                options={options}
                value={current}
                onChange={(v) => field.onChange(Number(v))}
              />
            );
          }}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="muted" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {isEdit ? "Save changes" : "Add therapist"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { WEEKDAYS, toTimeInput } from "@/lib/schedule";
import { useCreateTherapist, useUpdateTherapist } from "@/hooks/useTherapists";
import type { Therapist } from "@/types/therapist";

const SLOT_OPTIONS = [15, 30, 45, 60, 90].map((m) => ({ value: String(m), label: `${m} min` }));

const schema = z
  .object({
    full_name: z.string().trim().min(1, "Name is required").max(120),
    specialty: z.string().trim().min(1, "Specialty is required").max(120),
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(therapist) });

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
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Full name" placeholder="Dr. Jane Doe" error={errors.full_name?.message} {...register("full_name")} />
        <Input label="Specialty" placeholder="Sports Rehabilitation" error={errors.specialty?.message} {...register("specialty")} />

        <Controller
          control={control}
          name="working_days"
          render={({ field }) => (
            <div role="group" aria-labelledby="working-days-label">
              <span id="working-days-label" className="mb-1.5 block text-sm font-medium text-foreground">
                Working days
              </span>
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
              {errors.working_days && (
                <p className="mt-1.5 text-xs text-danger">{errors.working_days.message}</p>
              )}
            </div>
          )}
        />

        <div className="flex gap-4">
          <Input label="Start time" type="time" error={errors.start_time?.message} {...register("start_time")} />
          <Input label="End time" type="time" error={errors.end_time?.message} {...register("end_time")} />
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

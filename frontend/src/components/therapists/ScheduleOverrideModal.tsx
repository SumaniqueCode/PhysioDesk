"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, Input, Modal } from "@/components/ui";
import { useSetOverride } from "@/hooks/useTherapists";

const schema = z
  .object({
    date: z.string().min(1, "Date is required"),
    is_day_off: z.boolean(),
    start_time: z.string(),
    end_time: z.string(),
  })
  // A working override needs a valid window; a day off ignores the times entirely.
  .refine((v) => v.is_day_off || (v.start_time && v.end_time), {
    message: "Set both start and end times, or mark it a day off",
    path: ["start_time"],
  })
  .refine((v) => v.is_day_off || v.end_time > v.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { date: "", is_day_off: false, start_time: "", end_time: "" };

export function ScheduleOverrideModal({
  therapistId,
  open,
  onClose,
}: {
  therapistId: number;
  open: boolean;
  onClose: () => void;
}) {
  const setOverride = useSetOverride(therapistId);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const isDayOff = useWatch({ control, name: "is_day_off" });

  const onSubmit = handleSubmit((values) => {
    setOverride.mutate(
      {
        date: values.date,
        is_day_off: values.is_day_off,
        start_time: values.is_day_off ? null : values.start_time,
        end_time: values.is_day_off ? null : values.end_time,
      },
      { onSuccess: onClose },
    );
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule override"
      description="Mark a single date as a day off, or give it custom hours."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Date" type="date" error={errors.date?.message} {...register("date")} />

        <Controller
          control={control}
          name="is_day_off"
          render={({ field }) => (
            <Checkbox
              label="Day off (no appointments)"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />

        {!isDayOff && (
          <div className="flex gap-4">
            <Input label="Start time" type="time" error={errors.start_time?.message} {...register("start_time")} />
            <Input label="End time" type="time" error={errors.end_time?.message} {...register("end_time")} />
          </div>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="muted" size="sm" onClick={onClose} disabled={setOverride.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={setOverride.isPending}>
            Save override
          </Button>
        </div>
      </form>
    </Modal>
  );
}

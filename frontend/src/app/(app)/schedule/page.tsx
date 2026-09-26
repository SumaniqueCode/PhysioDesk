"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button, ConfirmDialog, EmptyState, Input, Skeleton, StatusPill } from "@/components/ui";
import {
  AppointmentFormModal,
  type AppointmentPrefill,
} from "@/components/scheduling/AppointmentFormModal";
import { useDaySchedule, useDeleteAppointment } from "@/hooks/useAppointments";
import { appointmentStatusTone, shiftISO, todayISO } from "@/lib/appointment";
import { formatDate, formatTime } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import type { Appointment, TherapistDaySchedule } from "@/types/appointment";

export default function SchedulePage() {
  const [date, setDate] = useState(todayISO());
  const [showBook, setShowBook] = useState(false);
  const [prefill, setPrefill] = useState<AppointmentPrefill | undefined>(undefined);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const { data, isLoading, isError } = useDaySchedule(date);
  const remove = useDeleteAppointment();

  // Union of every therapist's slot start times for the day, sorted, as grid rows.
  const rowTimes = useMemo(() => {
    const set = new Set<string>();
    data?.therapists.forEach((col) => col.slots.forEach((s) => set.add(s.start_time)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const columns = data?.therapists ?? [];

  function openBooking(slot?: AppointmentPrefill) {
    setPrefill(slot);
    setShowBook(true);
  }

  return (
    <>
      <Topbar
        title="Schedule"
        action={
          <Button size="sm" onClick={() => openBooking(undefined)}>
            <Plus className="size-4" />
            Book appointment
          </Button>
        }
      />

      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="muted" size="sm" onClick={() => setDate((d) => shiftISO(d, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="w-44">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button variant="muted" size="sm" onClick={() => setDate((d) => shiftISO(d, 1))}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDate(todayISO())}>
              Today
            </Button>
          </div>
          <p className="text-sm text-muted">{formatDate(date)}</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : isError ? (
          <EmptyState
            icon={<CalendarDays className="size-8" />}
            title="Couldn't load the schedule"
            description="Please refresh the page and try again."
          />
        ) : columns.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-8" />}
            title="No active therapists"
            description="Add a therapist to start scheduling appointments."
          />
        ) : rowTimes.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-8" />}
            title="No one is working this day"
            description="Every therapist is off on this date. Try another day."
          />
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
            <div
              className="grid min-w-max"
              style={{
                gridTemplateColumns: `88px repeat(${columns.length}, minmax(160px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div className="border-b border-border bg-background px-3 py-3" />
              {columns.map((col) => (
                <div
                  key={col.therapist.id}
                  className="border-b border-l border-border bg-background px-3 py-3"
                >
                  <p className="truncate text-sm font-semibold text-foreground">
                    {col.therapist.full_name}
                  </p>
                  {col.is_day_off ? (
                    <StatusPill tone="neutral" dot={false} className="mt-1">
                      Off today
                    </StatusPill>
                  ) : (
                    <p className="truncate text-xs text-muted">{col.therapist.specialty}</p>
                  )}
                </div>
              ))}

              {/* Time rows */}
              {rowTimes.map((time) => (
                <FragmentRow
                  key={time}
                  time={time}
                  columns={columns}
                  onOpen={(therapistId, startTime) =>
                    openBooking({ therapist_id: therapistId, date, start_time: startTime })
                  }
                  onBooked={setEditing}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AppointmentFormModal
        open={showBook}
        onClose={() => setShowBook(false)}
        prefill={prefill}
      />
      <AppointmentFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        appointment={editing ?? undefined}
        onCancelAppointment={(a) => {
          setEditing(null);
          setCancelling(a);
        }}
      />
      <ConfirmDialog
        open={cancelling !== null}
        tone="destructive"
        title="Cancel appointment?"
        description={
          cancelling
            ? `${cancelling.patient.full_name}'s ${formatTime(cancelling.start_time)} appointment on ${formatDate(cancelling.date)} will be removed and the slot freed.`
            : ""
        }
        confirmLabel="Cancel appointment"
        loading={remove.isPending}
        onConfirm={() =>
          cancelling && remove.mutate(cancelling.id, { onSuccess: () => setCancelling(null) })
        }
        onClose={() => setCancelling(null)}
      />
    </>
  );
}

function FragmentRow({
  time,
  columns,
  onOpen,
  onBooked,
}: {
  time: string;
  columns: TherapistDaySchedule[];
  onOpen: (therapistId: number, startTime: string) => void;
  onBooked: (appointment: Appointment) => void;
}) {
  return (
    <>
      <div className="flex items-center border-b border-border px-3 py-2 text-xs font-medium text-muted">
        {formatTime(time)}
      </div>
      {columns.map((col) => {
        const slot = col.slots.find((s) => s.start_time === time);
        const base = "border-b border-l border-border px-2 py-2 text-sm";

        if (!slot) {
          // A day-off therapist gets a stronger tint so their column reads as closed,
          // not just an empty gap in a working therapist's hours.
          return (
            <div
              key={col.therapist.id}
              className={cn(base, col.is_day_off ? "bg-neutral-soft/60" : "bg-neutral-soft/20")}
            />
          );
        }
        if (slot.appointment) {
          const appt = slot.appointment;
          return (
            <button
              key={col.therapist.id}
              type="button"
              onClick={() => onBooked(appt)}
              className={cn(base, "flex flex-col gap-1 text-left transition-colors hover:bg-primary-soft/40")}
            >
              <span className="truncate font-medium text-foreground">{appt.patient.full_name}</span>
              <StatusPill tone={appointmentStatusTone(appt.status)} dot={false} className="w-fit">
                {formatTime(appt.start_time)}
              </StatusPill>
            </button>
          );
        }
        return (
          <button
            key={col.therapist.id}
            type="button"
            onClick={() => onOpen(col.therapist.id, time)}
            className={cn(base, "text-muted transition-colors hover:bg-success-soft/50 hover:text-success")}
          >
            Open
          </button>
        );
      })}
    </>
  );
}

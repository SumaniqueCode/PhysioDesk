"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarOff, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Skeleton,
  StatusPill,
} from "@/components/ui";
import { ScheduleOverrideModal } from "@/components/therapists/ScheduleOverrideModal";
import { TherapistFormModal } from "@/components/therapists/TherapistFormModal";
import { useDeleteOverride, useTherapist } from "@/hooks/useTherapists";
import { formatDate, formatTime, formatWorkingDays } from "@/lib/schedule";
import { useAuthStore } from "@/stores/authStore";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default function TherapistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const { data: therapist, isLoading, isError } = useTherapist(id);
  const deleteOverride = useDeleteOverride(id);

  const [showEdit, setShowEdit] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        <Topbar title="Therapist" />
        <div className="space-y-4 p-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (isError || !therapist) {
    return (
      <>
        <Topbar title="Therapist" />
        <div className="p-8">
          <EmptyState
            title="Therapist not found"
            description="This therapist may have been removed."
            action={
              <Button size="sm" onClick={() => router.push("/therapists")}>
                Go back
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const overrides = [...therapist.schedule_overrides].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <Topbar
        title={therapist.full_name}
        action={
          isAdmin && (
            <Button size="sm" variant="muted" onClick={() => setShowEdit(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )
        }
      />

      <div className="space-y-6 p-8">
        <Breadcrumb
          items={[{ label: "Therapists", href: "/therapists" }, { label: therapist.full_name }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Profile & availability</CardTitle>
            <StatusPill tone={therapist.is_active ? "success" : "neutral"}>
              {therapist.is_active ? "Active" : "Inactive"}
            </StatusPill>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Field label="Specialty" value={therapist.specialty} />
              <Field label="Working days" value={formatWorkingDays(therapist.working_days)} />
              <Field
                label="Hours"
                value={`${formatTime(therapist.start_time)} – ${formatTime(therapist.end_time)}`}
              />
              <Field label="Weekly hours" value={`${therapist.weekly_hours}h`} />
              <Field label="Slot duration" value={`${therapist.slot_duration_minutes} min`} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule overrides</CardTitle>
            {isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setShowOverride(true)}>
                <Plus className="size-4" />
                Add override
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {overrides.length === 0 ? (
              <EmptyState
                className="border-0 py-8"
                icon={<CalendarOff className="size-7" />}
                title="No overrides"
                description="Days off and custom hours for specific dates will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {overrides.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-muted">
                        {o.is_day_off ? <CalendarOff className="size-4" /> : <Clock className="size-4" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDate(o.date)}</p>
                        <p className="text-xs text-muted">
                          {o.is_day_off
                            ? "Day off"
                            : `${formatTime(o.start_time)} – ${formatTime(o.end_time)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone={o.is_day_off ? "danger" : "primary"}>
                        {o.is_day_off ? "Day off" : "Custom hours"}
                      </StatusPill>
                      {isAdmin && (
                        <IconButton aria-label="Remove override" onClick={() => setDeletingDate(o.date)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <p className="text-sm text-muted">
          Patients seen today and upcoming appointments appear once scheduling is available.
        </p>
      </div>

      <TherapistFormModal open={showEdit} onClose={() => setShowEdit(false)} therapist={therapist} />
      <ScheduleOverrideModal
        therapistId={id}
        open={showOverride}
        onClose={() => setShowOverride(false)}
      />
      <ConfirmDialog
        open={deletingDate !== null}
        tone="destructive"
        title="Remove override?"
        description={deletingDate ? `The override for ${formatDate(deletingDate)} will be removed.` : ""}
        confirmLabel="Remove"
        loading={deleteOverride.isPending}
        onConfirm={() =>
          deletingDate &&
          deleteOverride.mutate(deletingDate, { onSuccess: () => setDeletingDate(null) })
        }
        onClose={() => setDeletingDate(null)}
      />
    </>
  );
}

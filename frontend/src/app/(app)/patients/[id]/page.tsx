"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
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
  Skeleton,
  StatusPill,
} from "@/components/ui";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { usePatient, useDeletePatient } from "@/hooks/usePatients";
import { statusLabel, statusTone } from "@/lib/patient";
import { formatDate } from "@/lib/schedule";
import type { ReactNode } from "react";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: patient, isLoading, isError } = usePatient(id);
  const remove = useDeletePatient();

  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <>
        <Topbar title="Patient" />
        <div className="space-y-4 p-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (isError || !patient) {
    return (
      <>
        <Topbar title="Patient" />
        <div className="p-8">
          <EmptyState
            title="Patient not found"
            description="This patient may have been removed."
            action={
              <Button size="sm" onClick={() => router.push("/patients")}>
                Go back
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const dob = patient.date_of_birth
    ? `${formatDate(patient.date_of_birth)}${patient.age != null ? ` · ${patient.age} yrs` : ""}`
    : "—";

  const therapist = patient.assigned_therapist;

  return (
    <>
      <Topbar
        title={patient.full_name}
        action={
          <Button size="sm" variant="muted" onClick={() => setShowEdit(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
        }
      />

      <div className="space-y-6 p-8">
        <Breadcrumb
          items={[{ label: "Patients", href: "/patients" }, { label: patient.full_name }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Patient record</CardTitle>
            <StatusPill tone={statusTone(patient.status)}>{statusLabel(patient.status)}</StatusPill>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Field label="Email" value={patient.email ?? "—"} />
              <Field label="Phone" value={patient.phone ?? "—"} />
              <Field label="Date of birth" value={dob} />
              <Field label="Address" value={patient.address ?? "—"} />
              <Field
                label="Assigned therapist"
                value={
                  therapist ? (
                    <Link
                      href={`/therapists/${therapist.id}`}
                      className="text-primary hover:underline"
                    >
                      {therapist.full_name}
                      {!therapist.is_active && " (inactive)"}
                    </Link>
                  ) : (
                    "Unassigned"
                  )
                }
              />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical notes</CardTitle>
          </CardHeader>
          <CardBody>
            {patient.medical_notes ? (
              <p className="text-sm whitespace-pre-wrap text-foreground">{patient.medical_notes}</p>
            ) : (
              <p className="text-sm text-muted">No notes recorded.</p>
            )}
          </CardBody>
        </Card>

        <p className="text-sm text-muted">
          Appointment history and invoices appear once scheduling and billing are available.
        </p>

        <div>
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" />
            Delete patient
          </Button>
        </div>
      </div>

      <PatientFormModal open={showEdit} onClose={() => setShowEdit(false)} patient={patient} />
      <ConfirmDialog
        open={confirmDelete}
        tone="destructive"
        title="Delete patient?"
        description={`${patient.full_name} and their record will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(patient.id, { onSuccess: () => router.push("/patients") })
        }
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}

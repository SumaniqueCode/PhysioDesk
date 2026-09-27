"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Pencil, Receipt, Trash2 } from "lucide-react";
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
  SkeletonTable,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { usePatient, useDeletePatient } from "@/hooks/usePatients";
import { usePatientAppointments } from "@/hooks/useAppointments";
import { usePatientInvoices } from "@/hooks/useInvoices";
import { statusLabel, statusTone } from "@/lib/patient";
import { appointmentStatusLabel, appointmentStatusTone } from "@/lib/appointment";
import { formatCurrency, invoiceStatusLabel, invoiceStatusTone } from "@/lib/invoice";
import { formatDate, formatTime } from "@/lib/schedule";
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

        <SessionHistory patientId={patient.id} />
        <BillingHistory patientId={patient.id} />

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

function HistoryCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {count != null && (
          <span className="text-sm text-muted">
            {count} {count === 1 ? "record" : "records"}
          </span>
        )}
      </CardHeader>
      <CardBody className="p-0">{children}</CardBody>
    </Card>
  );
}

function SessionHistory({ patientId }: { patientId: number }) {
  const { data, isLoading, isError } = usePatientAppointments(patientId);

  return (
    <HistoryCard title="Session history" count={data?.length}>
      {isLoading ? (
        <div className="p-5">
          <SkeletonTable rows={3} />
        </div>
      ) : isError ? (
        <EmptyState
          className="border-0"
          icon={<CalendarDays className="size-8" />}
          title="Couldn't load sessions"
          description="Please refresh the page and try again."
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          className="border-0"
          icon={<CalendarDays className="size-8" />}
          title="No sessions yet"
          description="Appointments booked for this patient will show up here."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Time</Th>
                <Th>Therapist</Th>
                <Th>Status</Th>
                <Th>Notes</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((appt) => (
                <Tr key={appt.id}>
                  <Td className="whitespace-nowrap text-foreground">{formatDate(appt.date)}</Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                  </Td>
                  <Td className="text-muted">{appt.therapist.full_name}</Td>
                  <Td>
                    <StatusPill tone={appointmentStatusTone(appt.status)}>
                      {appointmentStatusLabel(appt.status)}
                    </StatusPill>
                  </Td>
                  <Td className="max-w-xs truncate text-muted">{appt.notes ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </HistoryCard>
  );
}

function BillingHistory({ patientId }: { patientId: number }) {
  const { data, isLoading, isError } = usePatientInvoices(patientId);

  return (
    <HistoryCard title="Billing history" count={data?.length}>
      {isLoading ? (
        <div className="p-5">
          <SkeletonTable rows={3} />
        </div>
      ) : isError ? (
        <EmptyState
          className="border-0"
          icon={<Receipt className="size-8" />}
          title="Couldn't load invoices"
          description="Please refresh the page and try again."
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          className="border-0"
          icon={<Receipt className="size-8" />}
          title="No invoices yet"
          description="Invoices raised for this patient will show up here."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Service</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="whitespace-nowrap text-foreground">
                    {formatDate(inv.issued_date)}
                  </Td>
                  <Td className="text-muted">{inv.service}</Td>
                  <Td className="text-right font-mono text-foreground">
                    {formatCurrency(inv.total)}
                  </Td>
                  <Td>
                    <StatusPill tone={invoiceStatusTone(inv.status)}>
                      {invoiceStatusLabel(inv.status)}
                    </StatusPill>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </HistoryCard>
  );
}

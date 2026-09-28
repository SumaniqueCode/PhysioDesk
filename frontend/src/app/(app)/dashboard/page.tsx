"use client";

import Link from "next/link";
import { AlertCircle, CalendarClock, Stethoscope, UserRound, Users, Wallet } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  SkeletonCard,
  StatCard,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { useDashboardStats } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/invoice";
import { statusLabel, statusTone } from "@/lib/patient";
import { useAuthStore } from "@/stores/authStore";
import type { RecentPatient, TherapistCapacity } from "@/types/dashboard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useDashboardStats();

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="space-y-8 p-8">
        <p className="text-muted">
          Welcome back, <span className="font-medium text-foreground">{user?.full_name}</span>.
          Here&apos;s how the clinic looks today.
        </p>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError || !data ? (
          <EmptyState
            icon={<AlertCircle className="size-8" />}
            title="Couldn't load the dashboard"
            description="Please refresh the page and try again."
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Patients seen today"
                value={data.patients_seen_today}
                icon={<Users className="size-5" />}
              />
              <StatCard
                label="Therapists on duty"
                value={data.therapists_on_duty_today}
                icon={<Stethoscope className="size-5" />}
              />
              <StatCard
                label="Revenue today"
                value={formatCurrency(data.revenue_today)}
                icon={<Wallet className="size-5" />}
              />
              <StatCard
                label="Open slots today"
                value={data.open_slots_today}
                hint="Across all therapists on duty"
                icon={<CalendarClock className="size-5" />}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Therapist capacity</CardTitle>
                  <span className="text-sm text-muted">Booked vs. free today</span>
                </CardHeader>
                <CardBody className="p-0">
                  {data.capacity.length === 0 ? (
                    <EmptyState
                      className="border-0"
                      icon={<Stethoscope className="size-8" />}
                      title="No therapists on duty"
                      description="No one is scheduled to work today."
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {data.capacity.map((row) => (
                        <CapacityRow key={row.therapist.id} row={row} />
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent patients</CardTitle>
                  <Link href="/patients" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </CardHeader>
                <CardBody className="p-0">
                  {data.recent_patients.length === 0 ? (
                    <EmptyState
                      className="border-0"
                      icon={<UserRound className="size-8" />}
                      title="No patients yet"
                      description="Newly added patients will appear here."
                    />
                  ) : (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Patient</Th>
                          <Th>Condition</Th>
                          <Th>Package</Th>
                          <Th>Therapist</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_patients.map((patient) => (
                          <RecentPatientRow key={patient.id} patient={patient} />
                        ))}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CapacityRow({ row }: { row: TherapistCapacity }) {
  const bookedPct = row.total > 0 ? Math.round((row.booked / row.total) * 100) : 0;
  return (
    <li className="px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.therapist.full_name}</p>
          <p className="truncate text-xs text-muted">{row.therapist.specialty}</p>
        </div>
        <span className="shrink-0 font-mono text-sm text-muted">
          {row.booked}/{row.total} booked
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full rounded-full bg-primary" style={{ width: `${bookedPct}%` }} />
        </div>
        <span className="shrink-0 text-xs font-medium text-success">{row.open} open</span>
      </div>
    </li>
  );
}

function RecentPatientRow({ patient }: { patient: RecentPatient }) {
  return (
    <Tr>
      <Td>
        <Link href={`/patients/${patient.id}`} className="font-medium text-foreground hover:text-primary">
          {patient.full_name}
        </Link>
      </Td>
      <Td className="max-w-[14rem] truncate text-muted">{patient.condition || "—"}</Td>
      <Td className="text-muted">{patient.package || "—"}</Td>
      <Td className="text-muted">{patient.assigned_therapist?.full_name ?? "Unassigned"}</Td>
      <Td>
        <StatusPill tone={statusTone(patient.status)}>{statusLabel(patient.status)}</StatusPill>
      </Td>
    </Tr>
  );
}

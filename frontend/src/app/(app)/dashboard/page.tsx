"use client";

import { AlertCircle, CalendarDays, Users, Wallet } from "lucide-react";
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
} from "@/components/ui";
import { useDashboardStats } from "@/hooks/useDashboard";
import { appointmentStatusLabel, appointmentStatusTone } from "@/lib/appointment";
import { formatCurrency } from "@/lib/invoice";
import { formatTime } from "@/lib/schedule";
import { useAuthStore } from "@/stores/authStore";
import type { Appointment } from "@/types/appointment";

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
                label="Active patients"
                value={data.active_patients}
                icon={<Users className="size-5" />}
              />
              <StatCard
                label="Appointments today"
                value={data.appointments_today}
                hint={`${data.appointments_completed_today} completed`}
                icon={<CalendarDays className="size-5" />}
              />
              <StatCard
                label="Revenue today"
                value={formatCurrency(data.revenue_today)}
                icon={<Wallet className="size-5" />}
              />
              <StatCard
                label="Outstanding"
                value={formatCurrency(data.outstanding_total)}
                hint={`${data.outstanding_count} unpaid ${data.outstanding_count === 1 ? "invoice" : "invoices"}`}
                icon={<AlertCircle className="size-5" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s schedule</CardTitle>
                <span className="text-sm text-muted">
                  {data.todays_appointments.length}{" "}
                  {data.todays_appointments.length === 1 ? "appointment" : "appointments"}
                </span>
              </CardHeader>
              <CardBody className="p-0">
                {data.todays_appointments.length === 0 ? (
                  <EmptyState
                    className="border-0"
                    icon={<CalendarDays className="size-8" />}
                    title="Nothing booked today"
                    description="New appointments will show up here as they're scheduled."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.todays_appointments.map((appt) => (
                      <AppointmentRow key={appt.id} appointment={appt} />
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <span className="w-32 shrink-0 font-mono text-sm text-muted">
        {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{appointment.patient.full_name}</p>
        <p className="truncate text-sm text-muted">{appointment.therapist.full_name}</p>
      </div>
      <StatusPill tone={appointmentStatusTone(appointment.status)}>
        {appointmentStatusLabel(appointment.status)}
      </StatusPill>
    </li>
  );
}

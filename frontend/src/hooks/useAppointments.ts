"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiFetch, fetchAllPages } from "@/lib/apiClient";
import { toastError } from "@/lib/toastError";
import type { Page } from "@/types/common";
import type {
  Appointment,
  AppointmentCreatePayload,
  AppointmentStatus,
  AppointmentUpdatePayload,
  Availability,
  DaySchedule,
} from "@/types/appointment";

export interface AppointmentListParams {
  patient_id?: number | null;
  therapist_id?: number | null;
  status?: AppointmentStatus | null;
  page: number;
  page_size: number;
}

const keys = {
  all: ["appointments"] as const,
  schedule: (date: string) => ["appointments", "schedule", date] as const,
  availability: (therapistId: number, date: string) =>
    ["appointments", "availability", therapistId, date] as const,
  lists: ["appointments", "list"] as const,
  list: (params: AppointmentListParams) => ["appointments", "list", params] as const,
};

// Refetch every derived view after a booking changes; slots and grids depend on each other.
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.all });
}

export function useDaySchedule(date: string) {
  return useQuery({
    queryKey: keys.schedule(date),
    queryFn: () => apiFetch<DaySchedule>(`/appointments/schedule?date=${date}`),
    placeholderData: keepPreviousData,
  });
}

export function useAvailability(therapistId: number | null, date: string) {
  return useQuery({
    queryKey: keys.availability(therapistId ?? 0, date),
    queryFn: () =>
      apiFetch<Availability>(`/appointments/availability?therapist_id=${therapistId}&date=${date}`),
    enabled: therapistId != null && Boolean(date),
  });
}

export function useAppointmentList(params: AppointmentListParams) {
  const qs = new URLSearchParams();
  if (params.patient_id != null) qs.set("patient_id", String(params.patient_id));
  if (params.therapist_id != null) qs.set("therapist_id", String(params.therapist_id));
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(params.page));
  qs.set("page_size", String(params.page_size));
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => apiFetch<Page<Appointment>>(`/appointments?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

// A patient's full appointment history, most-recent first, for the profile page.
export function usePatientAppointments(patientId: number) {
  return useQuery({
    queryKey: ["appointments", "patient", patientId],
    queryFn: () => fetchAllPages<Appointment>(`/appointments?patient_id=${patientId}`),
    enabled: Number.isFinite(patientId),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppointmentCreatePayload) =>
      apiFetch<Appointment>("/appointments", { method: "POST", body: payload }),
    onSuccess: (a) => {
      invalidateAll(qc);
      toast.success(`Appointment booked for ${a.patient.full_name}`);
    },
    onError: (err) => toastError(err, "Could not book appointment"),
  });
}

export function useUpdateAppointment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppointmentUpdatePayload) =>
      apiFetch<Appointment>(`/appointments/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Appointment updated");
    },
    onError: (err) => toastError(err, "Could not update appointment"),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/appointments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Appointment cancelled");
    },
    onError: (err) => toastError(err, "Could not cancel appointment"),
  });
}

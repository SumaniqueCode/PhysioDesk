"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/apiClient";
import { toastError } from "@/lib/toastError";
import type { Page } from "@/types/common";
import type { Patient, PatientPayload, PatientStatus } from "@/types/patient";

export interface PatientListParams {
  search?: string;
  status?: PatientStatus | null;
  therapist_id?: number | null;
  page: number;
  page_size: number;
}

const keys = {
  lists: ["patients", "list"] as const,
  list: (params: PatientListParams) => ["patients", "list", params] as const,
  detail: (id: number) => ["patients", "detail", id] as const,
};

function buildQuery(params: PatientListParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.therapist_id != null) qs.set("therapist_id", String(params.therapist_id));
  qs.set("page", String(params.page));
  qs.set("page_size", String(params.page_size));
  return qs.toString();
}

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => apiFetch<Page<Patient>>(`/patients?${buildQuery(params)}`),
    // Keep the current page visible while the next page or a new search loads.
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => apiFetch<Patient>(`/patients/${id}`),
    enabled: Number.isFinite(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatientPayload) =>
      apiFetch<Patient>("/patients", { method: "POST", body: payload }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      toast.success(`${p.full_name} added`);
    },
    onError: (err) => toastError(err, "Could not add patient"),
  });
}

export function useUpdatePatient(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatientPayload) =>
      apiFetch<Patient>(`/patients/${id}`, { method: "PATCH", body: payload }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      qc.setQueryData(keys.detail(id), p);
      toast.success(`${p.full_name} updated`);
    },
    onError: (err) => toastError(err, "Could not update patient"),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      qc.removeQueries({ queryKey: keys.detail(id) });
      toast.success("Patient deleted");
    },
    onError: (err) => toastError(err, "Could not delete patient"),
  });
}

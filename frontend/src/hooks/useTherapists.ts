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
import type {
  ScheduleOverride,
  ScheduleOverridePayload,
  Therapist,
  TherapistDetail,
  TherapistPayload,
} from "@/types/therapist";

export interface TherapistListParams {
  search?: string;
  is_active?: boolean | null;
  page: number;
  page_size: number;
}

const keys = {
  lists: ["therapists", "list"] as const,
  list: (params: TherapistListParams) => ["therapists", "list", params] as const,
  detail: (id: number) => ["therapists", "detail", id] as const,
};

function buildQuery(params: TherapistListParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  // Omit the filter entirely for "all"; the API defaults to active-only otherwise.
  if (params.is_active !== null && params.is_active !== undefined) {
    qs.set("is_active", String(params.is_active));
  }
  qs.set("page", String(params.page));
  qs.set("page_size", String(params.page_size));
  return qs.toString();
}

export function useTherapists(params: TherapistListParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => apiFetch<Page<Therapist>>(`/therapists?${buildQuery(params)}`),
    // Keep the current page visible while the next page or a new search loads.
    placeholderData: keepPreviousData,
  });
}

// Flat list of every active therapist for assignment dropdowns and roster filters;
// pages through the API so the list is never silently truncated.
export function useActiveTherapists() {
  return useQuery({
    queryKey: ["therapists", "active-options"],
    queryFn: async () => {
      const pageSize = 100;
      const items: Therapist[] = [];
      for (let page = 1; ; page += 1) {
        const res = await apiFetch<Page<Therapist>>(
          `/therapists?is_active=true&page=${page}&page_size=${pageSize}`,
        );
        items.push(...res.items);
        if (items.length >= res.total || res.items.length === 0) break;
      }
      return items;
    },
    staleTime: 60_000,
  });
}

export function useTherapist(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => apiFetch<TherapistDetail>(`/therapists/${id}`),
    enabled: Number.isFinite(id),
  });
}

export function useCreateTherapist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TherapistPayload) =>
      apiFetch<TherapistDetail>("/therapists", { method: "POST", body: payload }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      toast.success(`${t.full_name} added`);
    },
    onError: (err) => toastError(err, "Could not add therapist"),
  });
}

export function useUpdateTherapist(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TherapistPayload) =>
      apiFetch<TherapistDetail>(`/therapists/${id}`, { method: "PATCH", body: payload }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      qc.setQueryData(keys.detail(id), t);
      toast.success(`${t.full_name} updated`);
    },
    onError: (err) => toastError(err, "Could not update therapist"),
  });
}

export function useDeactivateTherapist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/therapists/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      toast.success("Therapist deactivated");
    },
    onError: (err) => toastError(err, "Could not deactivate therapist"),
  });
}

export function useReactivateTherapist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<TherapistDetail>(`/therapists/${id}`, { method: "PATCH", body: { is_active: true } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: keys.lists });
      qc.setQueryData(keys.detail(t.id), t);
      toast.success(`${t.full_name} reactivated`);
    },
    onError: (err) => toastError(err, "Could not reactivate therapist"),
  });
}

export function useSetOverride(therapistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScheduleOverridePayload) =>
      apiFetch<ScheduleOverride>(`/therapists/${therapistId}/overrides`, {
        method: "PUT",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detail(therapistId) });
      toast.success("Schedule override saved");
    },
    onError: (err) => toastError(err, "Could not save override"),
  });
}

export function useDeleteOverride(therapistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      apiFetch<void>(`/therapists/${therapistId}/overrides/${date}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detail(therapistId) });
      toast.success("Override removed");
    },
    onError: (err) => toastError(err, "Could not remove override"),
  });
}

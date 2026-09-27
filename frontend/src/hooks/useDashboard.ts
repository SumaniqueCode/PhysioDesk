"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { DashboardStats } from "@/types/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch<DashboardStats>("/dashboard/stats"),
  });
}

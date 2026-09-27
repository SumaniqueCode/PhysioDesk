"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/apiClient";
import { toastError } from "@/lib/toastError";
import type { Page } from "@/types/common";
import type {
  Invoice,
  InvoiceCreatePayload,
  InvoiceStatus,
  InvoiceUpdatePayload,
} from "@/types/invoice";

export interface InvoiceListParams {
  patient_id?: number | null;
  status?: InvoiceStatus | null;
  page: number;
  page_size: number;
}

const keys = {
  all: ["invoices"] as const,
  list: (params: InvoiceListParams) => ["invoices", "list", params] as const,
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.all });
}

export function useInvoiceList(params: InvoiceListParams) {
  const qs = new URLSearchParams();
  if (params.patient_id != null) qs.set("patient_id", String(params.patient_id));
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(params.page));
  qs.set("page_size", String(params.page_size));
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => apiFetch<Page<Invoice>>(`/invoices?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceCreatePayload) =>
      apiFetch<Invoice>("/invoices", { method: "POST", body: payload }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Invoice created");
    },
    onError: (err) => toastError(err, "Could not create invoice"),
  });
}

export function useUpdateInvoice(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceUpdatePayload) =>
      apiFetch<Invoice>(`/invoices/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Invoice updated");
    },
    onError: (err) => toastError(err, "Could not update invoice"),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Invoice voided");
    },
    onError: (err) => toastError(err, "Could not void invoice"),
  });
}

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Pagination,
  Select,
  SkeletonTable,
  StatusPill,
  Table,
  TableCard,
  TableToolbar,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { InvoiceFormModal } from "@/components/billing/InvoiceFormModal";
import { useInvoiceList, useDeleteInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import { useAllPatients } from "@/hooks/usePatients";
import {
  INVOICE_STATUSES,
  formatCurrency,
  invoiceStatusLabel,
  invoiceStatusTone,
} from "@/lib/invoice";
import { paymentMethodLabel } from "@/lib/appointment";
import { formatDate } from "@/lib/schedule";
import { useAuthStore } from "@/stores/authStore";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...INVOICE_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

export default function BillingPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const [status, setStatus] = useState("all");
  const [patientId, setPatientId] = useState("all");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [voiding, setVoiding] = useState<Invoice | null>(null);

  const { data: patients } = useAllPatients();
  const patientFilterOptions = useMemo(
    () => [
      { value: "all", label: "All patients" },
      ...(patients ?? []).map((p) => ({ value: String(p.id), label: p.full_name })),
    ],
    [patients],
  );

  const { data, isLoading, isError } = useInvoiceList({
    status: status === "all" ? null : (status as InvoiceStatus),
    patient_id: patientId === "all" ? null : Number(patientId),
    page,
    page_size: PAGE_SIZE,
  });
  const remove = useDeleteInvoice();

  const pageCount = useMemo(() => (data ? Math.ceil(data.total / PAGE_SIZE) : 0), [data]);
  const isFiltered = status !== "all" || patientId !== "all";

  // Deleting the only row on a later page would strand the user on an empty page; step back first.
  function stepBackIfLastOnPage() {
    if (data && data.items.length === 1 && page > 1) setPage((p) => p - 1);
  }

  function confirmVoid() {
    if (!voiding) return;
    remove.mutate(voiding.id, {
      onSuccess: () => {
        setVoiding(null);
        stepBackIfLastOnPage();
      },
    });
  }

  return (
    <>
      <Topbar
        title="Billing"
        action={
          isAdmin && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              New invoice
            </Button>
          )
        }
      />

      <div className="p-8">
        <TableCard>
          <TableToolbar>
            <div className="w-44">
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-52">
              <Select
                options={patientFilterOptions}
                value={patientId}
                onChange={(v) => {
                  setPatientId(v);
                  setPage(1);
                }}
              />
            </div>
          </TableToolbar>

          {isLoading ? (
            <div className="p-6">
              <SkeletonTable rows={PAGE_SIZE} />
            </div>
          ) : isError ? (
            <EmptyState
              className="border-0"
              icon={<Receipt className="size-8" />}
              title="Couldn't load invoices"
              description="Please refresh the page and try again."
            />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              className="border-0"
              icon={<Receipt className="size-8" />}
              title="No invoices found"
              description={
                isFiltered
                  ? "Try adjusting your filters."
                  : isAdmin
                    ? "Create your first invoice to get started."
                    : "Invoices will appear here once billing is recorded."
              }
              action={
                isAdmin && !isFiltered ? (
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    <Plus className="size-4" />
                    New invoice
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Patient</Th>
                    <Th>Service</Th>
                    <Th>Date</Th>
                    <Th>Method</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                    {isAdmin && <Th className="text-right">Actions</Th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((inv) => (
                    <Tr key={inv.id}>
                      <Td className="font-medium text-foreground">
                        {inv.patient?.full_name ?? "—"}
                      </Td>
                      <Td className="text-muted">{inv.service}</Td>
                      <Td className="text-muted">{formatDate(inv.issued_date)}</Td>
                      <Td className="text-muted">{paymentMethodLabel(inv.payment_method)}</Td>
                      <Td className="text-right font-mono text-foreground">
                        {formatCurrency(inv.total)}
                        {inv.discount !== "0.00" && (
                          <span className="block text-xs text-muted">
                            {formatCurrency(inv.discount)} off
                          </span>
                        )}
                      </Td>
                      <Td>
                        <StatusPill tone={invoiceStatusTone(inv.status)}>
                          {invoiceStatusLabel(inv.status)}
                        </StatusPill>
                      </Td>
                      {isAdmin && (
                        <Td>
                          <RowActions
                            invoice={inv}
                            onEdit={() => setEditing(inv)}
                            onVoid={() => setVoiding(inv)}
                          />
                        </Td>
                      )}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {data && pageCount > 1 && (
            <div className="border-t border-border p-4">
              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                totalItems={data.total}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </TableCard>
      </div>

      <InvoiceFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      <InvoiceFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        invoice={editing ?? undefined}
      />
      <ConfirmDialog
        open={voiding !== null}
        tone="destructive"
        title="Void invoice?"
        description={
          voiding
            ? `${voiding.patient?.full_name ?? "This patient"}'s ${voiding.service} invoice will be permanently removed. This can't be undone.`
            : ""
        }
        confirmLabel="Void invoice"
        loading={remove.isPending}
        onConfirm={confirmVoid}
        onClose={() => setVoiding(null)}
      />
    </>
  );
}

function RowActions({
  invoice,
  onEdit,
  onVoid,
}: {
  invoice: Invoice;
  onEdit: () => void;
  onVoid: () => void;
}) {
  const update = useUpdateInvoice(invoice.id);
  return (
    <div className="flex justify-end gap-1">
      {invoice.status === "due" && (
        <IconButton
          tooltip="Mark paid"
          disabled={update.isPending}
          onClick={() => update.mutate({ status: "paid" })}
        >
          <CheckCircle2 className="size-4" />
        </IconButton>
      )}
      <IconButton tooltip="Edit invoice" onClick={onEdit}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton tooltip="Void invoice" onClick={onVoid}>
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}

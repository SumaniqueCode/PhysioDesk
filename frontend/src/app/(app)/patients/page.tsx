"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
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
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { usePatients, useDeletePatient } from "@/hooks/usePatients";
import { useActiveTherapists } from "@/hooks/useTherapists";
import { PATIENT_STATUSES, statusLabel, statusTone } from "@/lib/patient";
import type { Patient, PatientStatus } from "@/types/patient";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...PATIENT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

export default function PatientsPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [therapistId, setTherapistId] = useState("all");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  // Debounce the search box and reset to page 1 whenever the query changes.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: therapists } = useActiveTherapists();
  const therapistFilterOptions = useMemo(
    () => [
      { value: "all", label: "All therapists" },
      ...(therapists ?? []).map((t) => ({ value: String(t.id), label: t.full_name })),
    ],
    [therapists],
  );

  const { data, isLoading, isError } = usePatients({
    search,
    status: status === "all" ? null : (status as PatientStatus),
    therapist_id: therapistId === "all" ? null : Number(therapistId),
    page,
    page_size: PAGE_SIZE,
  });
  const remove = useDeletePatient();

  const pageCount = useMemo(() => (data ? Math.ceil(data.total / PAGE_SIZE) : 0), [data]);

  const isFiltered = Boolean(search) || status !== "all" || therapistId !== "all";

  // Deleting the only row on a later page would strand the user on an empty page; step back first.
  function stepBackIfLastOnPage() {
    if (data && data.items.length === 1 && page > 1) setPage((p) => p - 1);
  }

  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        stepBackIfLastOnPage();
      },
    });
  }

  return (
    <>
      <Topbar
        title="Patients"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            Add patient
          </Button>
        }
      />

      <div className="p-8">
        <TableCard>
          <TableToolbar>
            <div className="w-full max-w-xs">
              <Input
                placeholder="Search name, email, or phone"
                icon={<Search className="size-4" />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
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
                options={therapistFilterOptions}
                value={therapistId}
                onChange={(v) => {
                  setTherapistId(v);
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
              icon={<Users className="size-8" />}
              title="Couldn't load patients"
              description="Please refresh the page and try again."
            />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              className="border-0"
              icon={<Users className="size-8" />}
              title="No patients found"
              description={
                isFiltered
                  ? "Try adjusting your search or filters."
                  : "Add your first patient to get started."
              }
              action={
                !isFiltered ? (
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    <Plus className="size-4" />
                    Add patient
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Contact</Th>
                    <Th className="text-right">Age</Th>
                    <Th>Therapist</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <Tr key={p.id} clickable onClick={() => router.push(`/patients/${p.id}`)}>
                      <Td className="font-medium text-foreground">{p.full_name}</Td>
                      <Td className="text-muted">
                        <span className="block">{p.email ?? "—"}</span>
                        {p.phone && <span className="block text-xs">{p.phone}</span>}
                      </Td>
                      <Td className="text-right font-mono text-foreground">{p.age ?? "—"}</Td>
                      <Td className="text-muted">{p.assigned_therapist?.full_name ?? "Unassigned"}</Td>
                      <Td>
                        <StatusPill tone={statusTone(p.status)}>{statusLabel(p.status)}</StatusPill>
                      </Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <IconButton aria-label="Edit patient" onClick={() => setEditing(p)}>
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton aria-label="Delete patient" onClick={() => setDeleting(p)}>
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      </Td>
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

      <PatientFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      <PatientFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        patient={editing ?? undefined}
      />
      <ConfirmDialog
        open={deleting !== null}
        tone="destructive"
        title="Delete patient?"
        description={`${deleting?.full_name} and their record will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

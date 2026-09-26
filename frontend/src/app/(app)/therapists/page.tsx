"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Stethoscope, UserCheck, UserX } from "lucide-react";
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
import { TherapistFormModal } from "@/components/therapists/TherapistFormModal";
import { useDeactivateTherapist, useReactivateTherapist, useTherapists } from "@/hooks/useTherapists";
import { formatTime, formatWorkingDays } from "@/lib/schedule";
import { useAuthStore } from "@/stores/authStore";
import type { Therapist } from "@/types/therapist";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

const STATUS_FILTER: Record<string, boolean | null> = { active: true, inactive: false, all: null };

export default function TherapistsPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Therapist | null>(null);
  const [deactivating, setDeactivating] = useState<Therapist | null>(null);

  // Debounce the search box and reset to page 1 whenever the query changes.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isError } = useTherapists({
    search,
    is_active: STATUS_FILTER[status],
    page,
    page_size: PAGE_SIZE,
  });
  const deactivate = useDeactivateTherapist();
  const reactivate = useReactivateTherapist();

  const pageCount = useMemo(
    () => (data ? Math.ceil(data.total / PAGE_SIZE) : 0),
    [data],
  );

  // Removing the only row on a later page would strand the user on an empty page; step back first.
  function stepBackIfLastOnPage() {
    if (data && data.items.length === 1 && page > 1) setPage((p) => p - 1);
  }

  function confirmDeactivate() {
    if (!deactivating) return;
    deactivate.mutate(deactivating.id, {
      onSuccess: () => {
        setDeactivating(null);
        stepBackIfLastOnPage();
      },
    });
  }

  return (
    <>
      <Topbar
        title="Therapists"
        action={
          isAdmin && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              Add therapist
            </Button>
          )
        }
      />

      <div className="p-8">
        <TableCard>
          <TableToolbar>
            <div className="w-full max-w-xs">
              <Input
                placeholder="Search name or specialty"
                icon={<Search className="size-4" />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => {
                  setStatus(v);
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
              icon={<Stethoscope className="size-8" />}
              title="Couldn't load therapists"
              description="Please refresh the page and try again."
            />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              className="border-0"
              icon={<Stethoscope className="size-8" />}
              title="No therapists found"
              description={
                search || status !== "active"
                  ? "Try adjusting your search or filter."
                  : "Add your first therapist to get started."
              }
              action={
                isAdmin && !search ? (
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    <Plus className="size-4" />
                    Add therapist
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
                    <Th>Specialty</Th>
                    <Th>Working days</Th>
                    <Th>Hours</Th>
                    <Th className="text-right">Weekly</Th>
                    <Th>Status</Th>
                    {isAdmin && <Th className="text-right">Actions</Th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t) => (
                    <Tr key={t.id} clickable onClick={() => router.push(`/therapists/${t.id}`)}>
                      <Td className="font-medium text-foreground">{t.full_name}</Td>
                      <Td className="text-muted">{t.specialty}</Td>
                      <Td className="text-muted">{formatWorkingDays(t.working_days)}</Td>
                      <Td className="whitespace-nowrap text-muted">
                        {formatTime(t.start_time)} – {formatTime(t.end_time)}
                      </Td>
                      <Td className="text-right font-mono text-foreground">{t.weekly_hours}h</Td>
                      <Td>
                        <StatusPill tone={t.is_active ? "success" : "neutral"}>
                          {t.is_active ? "Active" : "Inactive"}
                        </StatusPill>
                      </Td>
                      {isAdmin && (
                        <Td onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <IconButton aria-label="Edit therapist" onClick={() => setEditing(t)}>
                              <Pencil className="size-4" />
                            </IconButton>
                            {t.is_active ? (
                              <IconButton
                                aria-label="Deactivate therapist"
                                onClick={() => setDeactivating(t)}
                              >
                                <UserX className="size-4" />
                              </IconButton>
                            ) : (
                              <IconButton
                                aria-label="Reactivate therapist"
                                disabled={reactivate.isPending}
                                onClick={() =>
                                  reactivate.mutate(t.id, { onSuccess: stepBackIfLastOnPage })
                                }
                              >
                                <UserCheck className="size-4" />
                              </IconButton>
                            )}
                          </div>
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

      <TherapistFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      <TherapistFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        therapist={editing ?? undefined}
      />
      <ConfirmDialog
        open={deactivating !== null}
        tone="destructive"
        title="Deactivate therapist?"
        description={`${deactivating?.full_name} will be hidden from the roster and dropdowns. Existing appointments and invoices are kept.`}
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivating(null)}
      />
    </>
  );
}

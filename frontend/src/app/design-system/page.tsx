"use client";

import { useState, type ReactNode } from "react";
import { Search, Mail, Eye, MoreHorizontal, Plus, Inbox } from "lucide-react";
import {
  Button,
  IconButton,
  StatusPill,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  StatCard,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  Modal,
  ConfirmDialog,
  Toast,
  type ToastTone,
  TableCard,
  TableToolbar,
  Table,
  Th,
  Td,
  Tr,
  Pagination,
  Spinner,
  Skeleton,
  SkeletonRow,
  SkeletonCard,
  SkeletonTable,
  Breadcrumb,
  EmptyState,
} from "@/components/ui";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const structuralSwatches = [
  { name: "primary", hex: "#B8763A" },
  { name: "primary-soft", hex: "#F0DFC7" },
  { name: "primary-on-soft", hex: "#5C3A17" },
  { name: "secondary", hex: "#132420" },
  { name: "secondary-light", hex: "#1D362F" },
  { name: "tertiary", hex: "#4F7C63" },
  { name: "background", hex: "#F6F3EA" },
  { name: "surface", hex: "#FFFFFF" },
  { name: "border", hex: "#E4DFD1" },
  { name: "foreground", hex: "#1C2622" },
  { name: "muted", hex: "#797365" },
];

const statusSwatches = [
  { name: "success", hex: "#4F7C63" },
  { name: "success-soft", hex: "#E1EBE3" },
  { name: "danger", hex: "#B5493B" },
  { name: "danger-soft", hex: "#F3DEDA" },
  { name: "neutral", hex: "#5E6B78" },
  { name: "neutral-soft", hex: "#E7EBEE" },
];

const patients = [
  { initials: "AT", name: "Aarav Thapa", phone: "+977 98-4411-2200", therapist: "Dr. Suman", pkg: "10-session", tone: "success" as const, status: "Active", visit: "2026-09-14", selected: true },
  { initials: "PG", name: "Priya Gurung", phone: "+977 98-2200-3311", therapist: "Dr. Michelle", pkg: "Single", tone: "neutral" as const, status: "On hold", visit: "2026-09-09", selected: false },
  { initials: "RK", name: "Rohan Karki", phone: "+977 98-7788-1100", therapist: "Dr. Suman", pkg: "20-session", tone: "danger" as const, status: "Overdue", visit: "2026-09-02", selected: false },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="mb-5 border-b border-border pb-2.5 text-xs font-bold tracking-wider text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="w-24">
      <div className="mb-1.5 h-12 rounded-lg border border-black/5" style={{ backgroundColor: hex }} />
      <div className="text-xs font-medium">{name}</div>
      <div className="font-mono text-[11px] text-muted">{hex}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastTone[]>(["success", "error", "info"]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <h1 className="font-display text-3xl font-semibold">Component Library</h1>
      <p className="mt-2 mb-12 max-w-2xl text-sm text-muted">
        The PhysioDesk design system — fixed palette (primary <span className="font-mono">#B8763A</span>), Fraunces +
        Inter + IBM Plex Mono. Every component here is the real primitive from{" "}
        <span className="font-mono">components/ui</span>, reused across the app.
      </p>

      <Section title="Colour — structural roles">
        <div className="flex flex-wrap gap-4">
          {structuralSwatches.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </Section>

      <Section title="Colour — status roles (pills only)">
        <div className="flex flex-wrap gap-4">
          {statusSwatches.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </Section>

      <Section title="Typography — three fonts, one purpose each">
        <div className="space-y-5">
          <div>
            <div className="mb-1 text-xs text-muted">Fraunces — page titles, card values, headings</div>
            <div className="font-display text-2xl font-semibold">Patients seen today</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Inter — body, labels, buttons, tables</div>
            <div className="text-sm">Book an appointment respecting the therapist&apos;s availability.</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">IBM Plex Mono — amounts, time slots, dates, IDs</div>
            <div className="font-mono text-lg font-semibold text-primary">Rs 4,800 · 09:30–10:15 · INV-0142</div>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="muted">Cancel</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="success">Mark paid</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Saving</Button>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Work email" placeholder="name@clinic.com" icon={<Mail className="size-4" />} />
          <Input label="Search patients" placeholder="Name or phone" icon={<Search className="size-4" />} />
          <Input label="Invalid email" defaultValue="not-an-email" error="Enter a valid email address" />
          <Input label="Disabled" placeholder="Not editable" disabled />
          <Select label="Assigned therapist" defaultValue="suman">
            <option value="suman">Dr. Suman Regmi</option>
            <option value="michelle">Dr. Michelle Voss</option>
          </Select>
          <Input label="Age" type="number" defaultValue={34} className="font-mono" />
          <div className="sm:col-span-2">
            <Textarea label="Session notes" placeholder="Add a note for the physician team" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-10">
          <div className="space-y-2.5">
            <div className="text-xs font-medium text-muted">Radio</div>
            <Radio name="mode" label="Remote OK" defaultChecked />
            <Radio name="mode" label="On-site only" />
            <Radio name="mode" label="Hybrid" />
          </div>
          <div className="space-y-2.5">
            <div className="text-xs font-medium text-muted">Checkbox</div>
            <Checkbox label="Active patient" defaultChecked />
            <Checkbox label="Send reminder SMS" />
          </div>
        </div>
      </Section>

      <Section title="Status pills">
        <div className="flex flex-wrap gap-3">
          <StatusPill tone="success">Paid</StatusPill>
          <StatusPill tone="success">Active</StatusPill>
          <StatusPill tone="danger">Overdue</StatusPill>
          <StatusPill tone="danger">Cancelled</StatusPill>
          <StatusPill tone="neutral">Pending</StatusPill>
          <StatusPill tone="neutral">On hold</StatusPill>
          <StatusPill tone="primary">Draft</StatusPill>
        </div>
      </Section>

      <Section title="Cards & stat cards">
        <div className="flex flex-wrap gap-5">
          <StatCard label="Patients today" value="18" hint="+3 vs. yesterday" />
          <StatCard label="Revenue today" value={<span className="font-mono">Rs 42k</span>} hint="12 invoices paid" />
          <StatCard label="Open slots" value="7" hint="across 4 therapists" />
          <Card className="w-64">
            <CardHeader>
              <CardTitle>Dr. Suman Regmi</CardTitle>
              <StatusPill tone="success" dot={false}>
                On duty
              </StatusPill>
            </CardHeader>
            <CardBody className="text-sm text-muted">Physiotherapist · 6 of 12 slots booked today.</CardBody>
          </Card>
        </div>
      </Section>

      <Section title="Table — toolbar, hover, selected row">
        <TableCard className="max-w-4xl">
          <TableToolbar>
            <div className="w-64">
              <Input placeholder="Search patients" icon={<Search className="size-4" />} />
            </div>
            <div className="w-44">
              <Select defaultValue="all">
                <option value="all">All therapists</option>
                <option value="suman">Dr. Suman Regmi</option>
                <option value="michelle">Dr. Michelle Voss</option>
              </Select>
            </div>
            <Button size="sm" className="ml-auto">
              <Plus className="size-4" /> Add patient
            </Button>
          </TableToolbar>
          <Table>
            <thead>
              <Tr className="hover:bg-transparent">
                <Th>Patient</Th>
                <Th>Therapist</Th>
                <Th>Package</Th>
                <Th>Status</Th>
                <Th>Last visit</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <Tr key={p.name} style={p.selected ? { boxShadow: "inset 3px 0 0 var(--primary)" } : undefined} className={p.selected ? "bg-primary-soft/40" : undefined}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary-on-soft">
                        {p.initials}
                      </span>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="font-mono text-xs text-muted">{p.phone}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{p.therapist}</Td>
                  <Td>{p.pkg}</Td>
                  <Td>
                    <StatusPill tone={p.tone}>{p.status}</StatusPill>
                  </Td>
                  <Td className="font-mono text-muted">{p.visit}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <IconButton aria-label="View">
                        <Eye className="size-4" />
                      </IconButton>
                      <IconButton aria-label="More">
                        <MoreHorizontal className="size-4" />
                      </IconButton>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
        <Pagination className="mt-4 max-w-4xl" page={page} pageCount={5} onPageChange={setPage} />
      </Section>

      <Section title="Loading — spinner & skeletons">
        <div className="flex flex-wrap items-start gap-10">
          <div className="flex flex-col items-center gap-2">
            <Spinner />
            <span className="text-xs text-muted">Spinner</span>
          </div>
          <div className="w-72">
            <div className="mb-2 text-xs text-muted">Row</div>
            <SkeletonRow />
          </div>
          <div className="w-64">
            <div className="mb-2 text-xs text-muted">Card</div>
            <SkeletonCard />
          </div>
          <div className="w-80">
            <div className="mb-2 text-xs text-muted">Table</div>
            <SkeletonTable rows={3} />
          </div>
          <div>
            <div className="mb-2 text-xs text-muted">Image / avatar</div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-20 w-32 rounded-xl" />
              <Skeleton className="size-14 rounded-xl" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-4">
          {toasts.map((tone) => (
            <Toast
              key={tone}
              tone={tone}
              title={tone === "success" ? "Invoice paid" : tone === "error" ? "Could not save changes" : "Generating schedule"}
              message={tone === "success" ? "Rs 4,800 recorded for Aarav Thapa." : tone === "error" ? "Check your connection and retry." : "You can start editing once it's ready."}
              onClose={() => setToasts((t) => t.filter((x) => x !== tone))}
            />
          ))}
          {toasts.length < 3 && (
            <Button variant="muted" size="sm" onClick={() => setToasts(["success", "error", "info"])}>
              Reset toasts
            </Button>
          )}
        </div>
      </Section>

      <Section title="Breadcrumb & empty state">
        <Breadcrumb
          className="mb-6"
          items={[{ label: "Patients", href: "/patients" }, { label: "Aarav Thapa" }]}
        />
        <EmptyState
          className="max-w-xl"
          icon={<Inbox className="size-8" />}
          title="No invoices yet"
          description="Create the first invoice for this patient to see it here."
          action={
            <Button size="sm">
              <Plus className="size-4" /> New invoice
            </Button>
          }
        />
      </Section>

      <Section title="Modals & dialogs">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open form modal
          </Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Open confirm dialog
          </Button>
        </div>
      </Section>

      <Section title="Layout — sidebar & top bar">
        <div className="flex h-96 overflow-hidden rounded-card border border-border shadow-card">
          <Sidebar />
          <div className="flex-1 bg-background">
            <Topbar title="Patients" action={<Button size="sm"><Plus className="size-4" /> Add patient</Button>} />
            <div className="p-6 text-sm text-muted">Main content area on the background colour.</div>
          </div>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add patient"
        description="Create a new patient record."
        footer={
          <>
            <Button variant="muted" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Save patient
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" placeholder="Aarav Thapa" />
          <Input label="Phone" placeholder="+977 …" icon={<Search className="size-4" />} />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        tone="destructive"
        title="Delete this patient?"
        description="This removes the patient and cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

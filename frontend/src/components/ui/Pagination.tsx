import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const navBtn =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <p className="text-sm text-muted">
        Page <span className="font-mono text-foreground">{page}</span> of{" "}
        <span className="font-mono text-foreground">{pageCount}</span>
      </p>
      <div className="flex gap-2">
        <button className={navBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" /> Prev
        </button>
        <button className={navBtn} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

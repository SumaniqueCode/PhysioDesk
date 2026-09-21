import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  siblings?: number;
  className?: string;
}

// Windowed page list with ellipses, e.g. [1, "dots", 4, 5, 6, "dots", 20].
function paginationRange(current: number, total: number, siblings: number): (number | "dots")[] {
  const totalNumbers = siblings * 2 + 5;
  if (total <= totalNumbers) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;
  const edgeCount = 3 + 2 * siblings;

  if (!showLeftDots && showRightDots) {
    return [...Array.from({ length: edgeCount }, (_, i) => i + 1), "dots", total];
  }
  if (showLeftDots && !showRightDots) {
    return [1, "dots", ...Array.from({ length: edgeCount }, (_, i) => total - edgeCount + 1 + i)];
  }
  return [1, "dots", ...Array.from({ length: right - left + 1 }, (_, i) => left + i), "dots", total];
}

const cell =
  "inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";
const inactive = "border border-border bg-surface text-foreground hover:border-primary/50 hover:text-primary";

export function Pagination({ page, pageCount, onPageChange, totalItems, pageSize, siblings = 1, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = paginationRange(page, pageCount, siblings);

  const summary =
    totalItems != null && pageSize != null ? (
      <>
        Showing <span className="font-mono text-foreground">{Math.min((page - 1) * pageSize + 1, totalItems)}</span>–
        <span className="font-mono text-foreground">{Math.min(page * pageSize, totalItems)}</span> of{" "}
        <span className="font-mono text-foreground">{totalItems}</span>
      </>
    ) : (
      <>
        Page <span className="font-mono text-foreground">{page}</span> of{" "}
        <span className="font-mono text-foreground">{pageCount}</span>
      </>
    );

  return (
    <nav aria-label="Pagination" className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-muted">{summary}</p>
      <div className="flex items-center gap-1">
        <button aria-label="Previous page" className={cn(cell, inactive)} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) =>
            p === "dots" ? (
              <span key={`dots-${i}`} className="inline-flex size-10 items-center justify-center text-muted" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(cell, p === page ? "border border-primary bg-primary text-white" : inactive)}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <span className="px-1 text-sm text-muted sm:hidden">
          {page} / {pageCount}
        </span>
        <button aria-label="Next page" className={cn(cell, inactive)} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

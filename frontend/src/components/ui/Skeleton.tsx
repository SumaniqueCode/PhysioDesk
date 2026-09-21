import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-border/70", className)} />;
}

// One shape per component so loading states mirror the real layout.
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-card">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/6" />
          <Skeleton className="h-3 w-1/5" />
        </div>
      ))}
    </div>
  );
}

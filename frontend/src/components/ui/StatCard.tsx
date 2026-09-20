import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-card border border-border bg-surface p-5 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

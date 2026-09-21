import { type HTMLAttributes, type ReactNode, type TableHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function TableCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("overflow-hidden rounded-card border border-border bg-surface shadow-card", className)}>{children}</div>;
}

export function TableToolbar({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-wrap items-center gap-3 border-b border-border p-4", className)}>{children}</div>;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("border-b border-border px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase", className)} {...props} />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-border px-4 py-3 align-middle", className)} {...props} />;
}

interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export function Tr({ className, clickable, ...props }: TrProps) {
  return (
    <tr
      className={cn("transition-colors last:[&>td]:border-0 hover:bg-primary-soft/30", clickable && "cursor-pointer", className)}
      {...props}
    />
  );
}

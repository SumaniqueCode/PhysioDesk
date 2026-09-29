import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldLabelProps {
  children: ReactNode;
  htmlFor?: string;
  id?: string;
  required?: boolean;
  /** With maxLength, shows an "n/max" counter at the right end of the label row. */
  length?: number;
  maxLength?: number;
}

// Shared by every field primitive so the required marker and counter look identical everywhere.
export function FieldLabel({ children, htmlFor, id, required, length, maxLength }: FieldLabelProps) {
  const Tag = htmlFor ? "label" : "span";
  const counted = maxLength !== undefined && length !== undefined;
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <Tag htmlFor={htmlFor} id={id} className="block text-sm font-medium text-foreground">
        {children}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </Tag>
      {counted && (
        <span className={cn("shrink-0 text-xs tabular-nums", length >= maxLength ? "text-danger" : "text-muted")}>
          {length}/{maxLength}
        </span>
      )}
    </div>
  );
}

export function FieldMeta({ error }: { error?: string }) {
  return error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null;
}

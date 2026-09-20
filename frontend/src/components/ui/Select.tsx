import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, name, children, ...props },
  ref,
) {
  const selectId = id ?? name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative flex items-center rounded-lg border bg-surface transition-colors focus-within:ring-2",
          error
            ? "border-danger focus-within:ring-danger/25"
            : "border-border focus-within:border-primary focus-within:ring-primary/25",
        )}
      >
        <select
          ref={ref}
          id={selectId}
          name={name}
          className={cn("h-11 w-full appearance-none bg-transparent px-3.5 pr-9 text-sm outline-none", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});

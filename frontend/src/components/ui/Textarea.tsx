import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, name, ...props },
  ref,
) {
  const areaId = id ?? name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        name={name}
        className={cn(
          "min-h-24 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 placeholder:text-muted",
          error
            ? "border-danger focus:ring-danger/25"
            : "border-border focus:border-primary focus:ring-primary/25",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});

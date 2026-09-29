import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FieldLabel, FieldMeta } from "./FieldLabel";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, name, required, maxLength, ...props },
  ref,
) {
  const areaId = id ?? name;
  const length = typeof props.value === "string" ? props.value.length : undefined;
  return (
    <div className="w-full">
      {label && (
        <FieldLabel htmlFor={areaId} required={required} length={length} maxLength={maxLength}>
          {label}
        </FieldLabel>
      )}
      <textarea
        ref={ref}
        id={areaId}
        name={name}
        maxLength={maxLength}
        className={cn(
          "block min-h-24 w-full resize-y rounded-lg border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 placeholder:text-muted",
          error
            ? "border-danger focus:ring-danger/25"
            : "border-border focus:border-primary focus:ring-primary/25",
          className,
        )}
        aria-invalid={!!error}
        aria-required={required || undefined}
        {...props}
      />
      <FieldMeta error={error} />
    </div>
  );
});

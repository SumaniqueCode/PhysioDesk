import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldLabel, FieldMeta } from "./FieldLabel";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, trailing, className, id, name, required, maxLength, ...props },
  ref,
) {
  const inputId = id ?? name;
  // A counter needs the live value, so it only shows for controlled inputs with a limit.
  const length = typeof props.value === "string" ? props.value.length : undefined;
  return (
    <div className="w-full">
      {label && (
        <FieldLabel htmlFor={inputId} required={required} length={length} maxLength={maxLength}>
          {label}
        </FieldLabel>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-surface px-3.5 transition-colors focus-within:ring-2",
          error
            ? "border-danger focus-within:ring-danger/25"
            : "border-border focus-within:border-primary focus-within:ring-primary/25",
        )}
      >
        {icon && <span className="text-muted">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          name={name}
          maxLength={maxLength}
          className={cn("h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted", className)}
          aria-invalid={!!error}
          aria-required={required || undefined}
          {...props}
        />
        {trailing && <span className="text-muted">{trailing}</span>}
      </div>
      <FieldMeta error={error} />
    </div>
  );
});

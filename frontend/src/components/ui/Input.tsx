import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, className, id, name, ...props },
  ref,
) {
  const inputId = id ?? name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
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
          className={cn("h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted", className)}
          aria-invalid={!!error}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});

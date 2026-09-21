import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, name, ...props },
  ref,
) {
  const cbId = id ?? name;
  return (
    <label htmlFor={cbId} className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        ref={ref}
        id={cbId}
        name={name}
        type="checkbox"
        className={cn("size-4 rounded border-border accent-primary", className)}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
});

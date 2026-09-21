import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, id, ...props },
  ref,
) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        ref={ref}
        id={id}
        type="radio"
        className={cn("size-4 accent-primary", className)}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
});

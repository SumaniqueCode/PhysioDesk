import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "muted" | "destructive" | "success";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-primary-soft text-primary-on-soft",
  muted: "border border-border bg-surface text-foreground",
  destructive: "bg-danger text-white",
  success: "bg-success text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition",
        "hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-none",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

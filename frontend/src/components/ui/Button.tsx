import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "muted" | "destructive" | "success";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-primary-soft text-primary-on-soft hover:bg-primary-soft/70",
  muted: "border border-border bg-surface text-foreground hover:bg-background",
  destructive: "bg-danger text-white hover:bg-danger/90",
  success: "bg-success text-white hover:bg-success/90",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
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

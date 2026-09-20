import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors",
          "hover:bg-background hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

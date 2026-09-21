import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted transition",
          "hover:bg-primary-soft hover:text-primary-on-soft focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

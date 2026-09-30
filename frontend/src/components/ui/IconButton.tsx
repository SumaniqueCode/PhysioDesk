import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Tooltip, type TooltipSide } from "./Tooltip";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // When set, shows a tooltip on hover/focus and doubles as the accessible label.
  tooltip?: string;
  tooltipSide?: TooltipSide;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className, children, tooltip, tooltipSide, "aria-label": ariaLabel, ...props },
    ref,
  ) {
    const button = (
      <button
        ref={ref}
        aria-label={ariaLabel ?? tooltip}
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

    if (!tooltip) return button;
    return (
      <Tooltip label={tooltip} side={tooltipSide}>
        {button}
      </Tooltip>
    );
  },
);

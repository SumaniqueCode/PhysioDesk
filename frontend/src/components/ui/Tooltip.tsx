import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TooltipSide = "top" | "bottom" | "left" | "right";

// Position + centering for the bubble relative to its trigger.
const SIDE: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

export interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
}

// Lightweight, dependency-free tooltip: reveals on hover and keyboard focus via
// a named group, and never intercepts pointer events on the trigger beneath it.
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1",
          "text-xs font-medium text-background shadow-md",
          "opacity-0 transition-opacity duration-150",
          "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          SIDE[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}

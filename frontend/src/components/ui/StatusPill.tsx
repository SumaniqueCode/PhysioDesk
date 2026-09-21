import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Status roles only — never reuse these for structural UI.
type Tone = "success" | "danger" | "neutral" | "primary";

const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-neutral-soft text-neutral",
  primary: "bg-primary-soft text-primary-on-soft",
};

const dots: Record<Tone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-neutral",
  primary: "bg-primary",
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function StatusPill({ tone = "neutral", dot = true, className, children, ...props }: StatusPillProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", tones[tone], className)}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}

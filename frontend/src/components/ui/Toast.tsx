import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

// Tones map to the three Status roles: success, error (danger), info (neutral).
export type ToastTone = "success" | "error" | "info";

const config: Record<ToastTone, { icon: typeof Info; color: string; bar: string }> = {
  success: { icon: CheckCircle2, color: "text-success", bar: "bg-success" },
  error: { icon: XCircle, color: "text-danger", bar: "bg-danger" },
  info: { icon: Info, color: "text-neutral", bar: "bg-neutral" },
};

export interface ToastProps {
  tone?: ToastTone;
  title: string;
  message?: string;
  onClose?: () => void;
}

export function Toast({ tone = "info", title, message, onClose }: ToastProps) {
  const { icon: Icon, color, bar } = config[tone];
  return (
    <div className="relative flex w-80 items-start gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card">
      <span className={cn("absolute inset-y-0 left-0 w-1", bar)} />
      <Icon className={cn("mt-0.5 size-5 shrink-0", color)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-sm text-muted">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="text-muted transition-colors hover:text-foreground">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

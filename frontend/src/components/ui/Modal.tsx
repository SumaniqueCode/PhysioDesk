"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** `lg` suits forms that place fields side by side; `sm` suits confirmations. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" } as const;

export function Modal({ open, onClose, title, description, children, footer, size = "sm", className }: ModalProps) {
  const titleId = useId();
  // Lock scroll and close on Escape while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative z-10 flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-card border border-border bg-surface shadow-xl",
          SIZES[size],
          className,
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 cursor-pointer text-muted transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        {(title || description) && (
          <div className="shrink-0 px-6 pt-6 pr-12">
            {title && (
              <h2 id={titleId} className="font-display text-xl font-semibold">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        )}
        {/* Only the body scrolls, so the title and close button stay in view on long forms. */}
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">{children}</div>}
        {footer && (
          <div className={cn("flex shrink-0 justify-end gap-3 px-6 pb-6", !children && "pt-6")}>{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

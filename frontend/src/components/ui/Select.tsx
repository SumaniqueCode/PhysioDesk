"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { FieldLabel, FieldMeta } from "./FieldLabel";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

type MenuPosition = { left: number; width: number; top?: number; bottom?: number };

// Roughly the listbox's max height (max-h-60) plus padding; below this much room, open upward.
const MENU_SPACE = 260;
const MENU_GAP = 8;

function measure(trigger: HTMLElement): MenuPosition {
  const r = trigger.getBoundingClientRect();
  const below = window.innerHeight - r.bottom;
  if (below < MENU_SPACE && r.top > below) {
    return { left: r.left, width: r.width, bottom: window.innerHeight - r.top + MENU_GAP };
  }
  return { left: r.left, width: r.width, top: r.bottom + MENU_GAP };
}

// Custom listbox so the options can be styled; native <select> can't be. The menu is portaled
// with fixed positioning so a scrolling parent (e.g. a modal body) can't clip it.
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  label,
  error,
  placeholder = "Select…",
  name,
  disabled,
  required,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? "");
  const [highlight, setHighlight] = useState(0);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelId = useId();

  const selected = value ?? internal;
  const selectedOption = options.find((o) => o.value === selected);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      onBlur?.();
    };
    // Keep the fixed menu glued to its trigger while any ancestor scrolls or the window resizes.
    const reposition = () => triggerRef.current && setPosition(measure(triggerRef.current));
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, onBlur]);

  function openMenu() {
    if (!triggerRef.current) return;
    const idx = options.findIndex((o) => o.value === selected);
    setHighlight(idx >= 0 ? idx : 0);
    setPosition(measure(triggerRef.current));
    setOpen(true);
  }

  function choose(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openMenu();
      else setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && options[highlight]) choose(options[highlight].value);
      else openMenu();
    } else if (e.key === "Escape" && open) {
      // Close only the menu, not an enclosing modal that also listens for Escape.
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className={cn("w-full", className)} ref={rootRef}>
      {label && (
        <FieldLabel id={labelId} required={required}>
          {label}
        </FieldLabel>
      )}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={!!error}
        aria-required={required || undefined}
        title={selectedOption?.label}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        onBlur={() => !open && onBlur?.()}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-surface px-3.5 text-left text-sm transition",
          error ? "border-danger" : open ? "border-primary ring-2 ring-primary/25" : "border-border",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {/* A long label (e.g. "name · specialty") would otherwise wrap inside the fixed-height trigger. */}
        <span className={cn("min-w-0 truncate", !selectedOption && "text-muted")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {/* Portal only while open, so nothing touches `document` during SSR or hydration. */}
      <AnimatePresence>
        {open &&
          position &&
          createPortal(
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ left: position.left, width: position.width, top: position.top, bottom: position.bottom }}
              className="fixed z-[60] overflow-hidden rounded-lg border border-border bg-surface shadow-card"
            >
              <ul id={listId} role="listbox" aria-labelledby={label ? labelId : undefined} className="max-h-60 overflow-auto p-1">
                {options.length === 0 && <li className="px-3 py-2 text-sm text-muted">No options</li>}
                {options.map((opt, i) => {
                  const isSelected = opt.value === selected;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => choose(opt.value)}
                      onMouseEnter={() => setHighlight(i)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        i === highlight ? "bg-primary-soft text-primary-on-soft" : "text-foreground",
                      )}
                    >
                      <span className={cn(isSelected && "font-semibold")}>{opt.label}</span>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                    </li>
                  );
                })}
              </ul>
            </motion.div>,
            document.body,
            listId,
          )}
      </AnimatePresence>

      {name && <input type="hidden" name={name} value={selected} />}
      <FieldMeta error={error} />
    </div>
  );
}

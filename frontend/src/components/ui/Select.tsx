"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

// Custom listbox so the options can be styled; native <select> can't be.
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  label,
  error,
  placeholder = "Select…",
  name,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? "");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = value ?? internal;
  const selectedOption = options.find((o) => o.value === selected);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openMenu() {
    const idx = options.findIndex((o) => o.value === selected);
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function choose(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
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
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={cn("w-full", className)} ref={rootRef}>
      {label && <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>}
      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKeyDown}
          className={cn(
            "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-surface px-3.5 text-sm transition",
            error ? "border-danger" : open ? "border-primary ring-2 ring-primary/25" : "border-border",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className={cn(!selectedOption && "text-muted")}>{selectedOption?.label ?? placeholder}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
            >
              <ul id={listId} role="listbox" className="max-h-60 overflow-auto p-1">
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
                        "flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                        i === highlight ? "bg-primary-soft text-primary-on-soft" : "text-foreground",
                      )}
                    >
                      <span className={cn(isSelected && "font-semibold")}>{opt.label}</span>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {name && <input type="hidden" name={name} value={selected} />}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

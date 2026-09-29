"use client";

import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Input,
  Select,
  Textarea,
  type InputProps,
  type SelectProps,
  type TextareaProps,
} from "@/components/ui";

// Binding via useController keeps the value controlled, so the primitives' length counters
// stay accurate even after reset() rewrites the form.
type Bound<T extends FieldValues> = { control: Control<T>; name: FieldPath<T> };
type Managed = "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "error";

export type TextFieldProps<T extends FieldValues> = Bound<T> &
  Omit<InputProps, Managed> & {
    /** Strips disallowed characters as the user types (e.g. letters from an amount). */
    sanitize?: (value: string) => string;
    /** Side effect after the value changes, e.g. clearing a dependent field. */
    onValueChange?: (value: string) => void;
  };

export function TextField<T extends FieldValues>({
  control,
  name,
  sanitize,
  onValueChange,
  ...props
}: TextFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  // Destructured so the compiler lint doesn't treat the whole `field` object as a ref.
  const { ref, value, onBlur, onChange } = field;
  return (
    <Input
      {...props}
      ref={ref}
      name={name}
      value={value ?? ""}
      onBlur={onBlur}
      onChange={(e) => {
        const next = sanitize ? sanitize(e.target.value) : e.target.value;
        onChange(next);
        onValueChange?.(next);
      }}
      error={fieldState.error?.message}
    />
  );
}

export type TextareaFieldProps<T extends FieldValues> = Bound<T> & Omit<TextareaProps, Managed>;

export function TextareaField<T extends FieldValues>({ control, name, ...props }: TextareaFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const { ref, value, onBlur, onChange } = field;
  return (
    <Textarea
      {...props}
      ref={ref}
      name={name}
      value={value ?? ""}
      onBlur={onBlur}
      onChange={onChange}
      error={fieldState.error?.message}
    />
  );
}

export type SelectFieldProps<T extends FieldValues> = Bound<T> &
  Omit<SelectProps, Managed> & { onValueChange?: (value: string) => void };

export function SelectField<T extends FieldValues>({ control, name, onValueChange, ...props }: SelectFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const { value, onBlur, onChange } = field;
  return (
    <Select
      {...props}
      value={value ?? ""}
      onBlur={onBlur}
      onChange={(v) => {
        onChange(v);
        onValueChange?.(v);
      }}
      error={fieldState.error?.message}
    />
  );
}

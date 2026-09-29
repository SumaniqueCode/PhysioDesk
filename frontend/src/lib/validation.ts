import { z } from "zod";

// Column/schema limits from the API; the same numbers feed each field's maxLength counter.
export const LIMITS = {
  name: 120,
  specialty: 120,
  email: 255,
  phone: 30,
  address: 255,
  service: 160,
  notes: 2000,
} as const;

// Numeric(10, 2) on the server: at most 8 integer digits and 2 decimals.
const MONEY_RE = /^\d{1,8}(\.\d{1,2})?$/;
// Letters (any script) plus the punctuation real names use: "Dr. Mary-Jane O'Neil".
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;
// Digits with the usual separators and an optional leading "+".
const PHONE_RE = /^\+?[\d\s().-]+$/;
const EMAIL = z.email();

const tooLong = (label: string, max: number) => `${label} must be at most ${max} characters`;

export function requiredText(label: string, max: number) {
  return z.string().trim().min(1, `${label} is required`).max(max, tooLong(label, max));
}

export function optionalText(label: string, max: number) {
  return z.string().trim().max(max, tooLong(label, max));
}

export function personName(label = "Name", max: number = LIMITS.name) {
  return requiredText(label, max)
    .min(2, `${label} must be at least 2 characters`)
    .regex(NAME_RE, `${label} can only contain letters, spaces, . ' and -`);
}

export const optionalEmail = z
  .string()
  .trim()
  .max(LIMITS.email, tooLong("Email", LIMITS.email))
  .refine((v) => !v || EMAIL.safeParse(v).success, "Enter a valid email, e.g. name@example.com");

export const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(LIMITS.email, tooLong("Email", LIMITS.email))
  .refine((v) => EMAIL.safeParse(v).success, "Enter a valid email, e.g. name@example.com");

export const optionalPhone = z
  .string()
  .trim()
  .max(LIMITS.phone, tooLong("Phone", LIMITS.phone))
  .refine((v) => !v || PHONE_RE.test(v), "Use digits, spaces, ( ) - and an optional leading +")
  .refine((v) => !v || v.replace(/\D/g, "").length >= 7, "Phone must have at least 7 digits");

export function money(label: string, { required }: { required: boolean }) {
  return z
    .string()
    .trim()
    .refine((v) => !required || v !== "", `${label} is required`)
    .refine((v) => v === "" || MONEY_RE.test(v), `${label} must be a number with up to 2 decimals`);
}

export function requiredDate(label: string) {
  return z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => !Number.isNaN(Date.parse(v)), `Enter a valid ${label.toLowerCase()}`);
}

export function requiredChoice(label: string) {
  return z.string().min(1, `Select a ${label.toLowerCase()}`);
}

// Keystroke filters so typed input can't drift from what the field accepts.
export const onlyMoney = (v: string) => v.replace(/[^\d.]/g, "");
export const onlyPhone = (v: string) => v.replace(/[^\d\s()+.-]/g, "");

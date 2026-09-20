import { LayoutDashboard, Users, CalendarDays, Receipt, Stethoscope, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// Single source for sidebar nav; `adminOnly` is honored once RBAC lands.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Therapists", href: "/therapists", icon: Stethoscope, adminOnly: true },
];

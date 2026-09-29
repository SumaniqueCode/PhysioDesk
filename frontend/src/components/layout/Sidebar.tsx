"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/hooks/useAuth";

// Below md the sidebar collapses to an icon rail; labels move into title/aria-label.
export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  // UI mirror of server-side RBAC: hide admin-only entries from staff.
  const items = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col bg-secondary text-white/70 md:w-60">
      <Link href="/" className="flex items-center justify-center gap-2.5 py-6 md:justify-start md:px-6">
        <Image src="/logo-white.png" alt="PhysioDesk" width={32} height={32} className="rounded-lg" priority />
        <span className="hidden font-display text-lg font-semibold text-white md:inline">PhysioDesk</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-2 md:px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-start",
                active ? "bg-primary text-white" : "hover:bg-secondary-light hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-2 py-4 md:px-4">
        <div className="mb-3 hidden px-2 md:block">
          <p className="truncate text-sm font-medium text-white">{user?.full_name}</p>
          <p className="text-xs capitalize text-white/50">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          title="Sign out"
          aria-label="Sign out"
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary-light hover:text-white disabled:opacity-50 md:justify-start"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

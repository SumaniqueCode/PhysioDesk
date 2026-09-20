"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-secondary text-white/70">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <Activity className="size-5" />
        </span>
        <span className="font-display text-lg font-semibold text-white">PhysioDesk</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-white" : "hover:bg-secondary-light hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-8">
        <p className="text-muted">
          Welcome back, <span className="font-medium text-foreground">{user?.full_name}</span>. The
          live dashboard arrives in a later step.
        </p>
      </div>
    </>
  );
}

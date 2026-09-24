"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";

// Guards every authenticated route; the session is restored app-wide in providers.tsx.
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

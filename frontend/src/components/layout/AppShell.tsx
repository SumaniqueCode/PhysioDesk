import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";

// Sidebar + scrollable main region. Pages render their own Topbar + content inside.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}

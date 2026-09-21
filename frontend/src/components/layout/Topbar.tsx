import { type ReactNode } from "react";

export interface TopbarProps {
  title: string;
  action?: ReactNode;
}

export function Topbar({ title, action }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-8 py-5">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {action}
    </header>
  );
}

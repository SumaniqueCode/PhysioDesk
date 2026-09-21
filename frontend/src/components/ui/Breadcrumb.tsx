import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav className={cn("flex items-center gap-2 text-sm text-muted", className)} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={item.label}>
            {item.href && !last ? (
              <Link href={item.href} className="transition-colors hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className={cn(last && "font-semibold text-foreground")}>{item.label}</span>
            )}
            {!last && <ChevronRight className="size-3.5 opacity-50" />}
          </Fragment>
        );
      })}
    </nav>
  );
}

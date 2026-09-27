import { type ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "./Card";
import { EmptyState } from "./EmptyState";
import { SkeletonTable } from "./Skeleton";

export interface HistoryCardProps {
  title: string;
  // Right-aligned header note, e.g. a record count.
  meta?: ReactNode;
  icon: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  emptyTitle: string;
  emptyDescription: string;
  skeletonRows?: number;
  // The populated table, shown once loading/error/empty are all false.
  children: ReactNode;
}

// Shared shell for the profile history/appointment tables: header plus the
// loading, error, and empty states that every one of them renders identically.
export function HistoryCard({
  title,
  meta,
  icon,
  isLoading,
  isError,
  isEmpty,
  errorTitle = "Couldn't load",
  errorDescription = "Please refresh the page and try again.",
  emptyTitle,
  emptyDescription,
  skeletonRows = 3,
  children,
}: HistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {meta != null && <span className="text-sm text-muted">{meta}</span>}
      </CardHeader>
      <CardBody className="p-0">
        {isLoading ? (
          <div className="p-5">
            <SkeletonTable rows={skeletonRows} />
          </div>
        ) : isError ? (
          <EmptyState
            className="border-0"
            icon={icon}
            title={errorTitle}
            description={errorDescription}
          />
        ) : isEmpty ? (
          <EmptyState
            className="border-0"
            icon={icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
}

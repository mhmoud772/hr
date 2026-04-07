import { Skeleton } from "@/shared/ui/skeleton";
import { useTranslation } from "react-i18next";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("loading");

  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`card-${index}`} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`row-${index}`} className="h-10 w-full" />
        ))}
      </div>
      {resolvedLabel ? (
        <div className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          {resolvedLabel}
        </div>
      ) : null}
    </div>
  );
}

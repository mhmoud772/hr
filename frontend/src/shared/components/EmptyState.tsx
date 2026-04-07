import { LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-border/70 bg-gradient-to-br from-muted/30 via-card to-card px-4 py-12 text-center shadow-sm">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center justify-center">
      {Icon && (
        <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[22px] border border-primary/10 bg-background/90 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      )}
      <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mb-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-sm">
          {actionLabel}
        </Button>
      )}
      </div>
    </div>
  );
}


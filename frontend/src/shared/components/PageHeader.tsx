import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-3">
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <div className="space-y-2">
          <h1 className="text-3xl font-black leading-none tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

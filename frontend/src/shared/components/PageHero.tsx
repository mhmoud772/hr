import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/components/PageHeader";

type MetricTone = "default" | "primary" | "success" | "warning";

type PageHeroMetric = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
};

type PageHeroProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  metrics?: PageHeroMetric[];
  children?: ReactNode;
  aside?: ReactNode;
  asideClassName?: string;
  className?: string;
};

const toneClasses: Record<MetricTone, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
};

export function PageHero({
  title,
  subtitle,
  actions,
  icon: Icon,
  metrics,
  children,
  aside,
  asideClassName,
  className,
}: PageHeroProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border border-border/60 bg-gradient-to-br from-primary/15 via-card to-card shadow-sm",
        className,
      )}
    >
      <CardContent className="relative p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 right-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-primary/5 blur-3xl opacity-50" />
        </div>

        <div
          className={cn(
            "relative grid gap-6 xl:items-start",
            (Icon || aside) && "xl:grid-cols-[minmax(0,1.25fr)_320px]",
          )}
        >
          <div className="space-y-5">
            <PageHeader title={title} subtitle={subtitle} actions={actions} />

            {metrics?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => {
                  const MetricIcon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {metric.label}
                        </span>
                        {MetricIcon ? (
                          <MetricIcon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              toneClasses[metric.tone ?? "default"],
                            )}
                          />
                        ) : null}
                      </div>
                      <div className="text-xl font-black tracking-tight text-foreground">
                        {metric.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {children}
          </div>

          {aside ? (
            <div className={cn("xl:pt-4", asideClassName)}>{aside}</div>
          ) : Icon ? (
            <div className="hidden xl:flex items-center justify-center h-full pt-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 blur opacity-50 transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-border/60 bg-background shadow-inner">
                  <Icon className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

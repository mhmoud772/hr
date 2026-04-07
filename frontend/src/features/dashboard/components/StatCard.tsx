import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
    unit?: string;
  };
  sparkline?: number[];
  variant?: "default" | "primary" | "success" | "warning";
}

export function StatCard({ title, value, icon: Icon, trend, sparkline, variant = "default" }: StatCardProps) {
  const { t } = useTranslation();
  const variantStyles = {
    default: "bg-card",
    primary: "bg-gradient-to-br from-primary/10 via-primary/5 to-card",
    success: "bg-gradient-to-br from-success/10 via-success/5 to-card",
    warning: "bg-gradient-to-br from-warning/10 via-warning/5 to-card",
  };

  const iconStyles = {
    default: "bg-muted/80 text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  };

  const trendIsPositive = trend ? (trend.isPositive ?? trend.value >= 0) : false;
  const trendLabel = trend?.label ?? t("trend_from_last_period");
  const trendValue = trend
    ? `${trendIsPositive ? "+" : "-"} ${Math.abs(trend.value)}${trend.unit ?? ""}`
    : "";

  const sparklinePath = (() => {
    if (!sparkline || sparkline.length < 2) return null;
    const values = sparkline.map((value) => (Number.isFinite(value) ? value : 0));
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100;
        const y = 24 - ((value - min) / range) * 24;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  })();

  const sparklineStroke =
    variant === "primary"
      ? "hsl(var(--primary))"
      : variant === "success"
        ? "hsl(var(--success))"
        : variant === "warning"
          ? "hsl(var(--warning))"
          : "hsl(var(--foreground))";

  return (
    <Card
      className={`${variantStyles[variant]} relative overflow-hidden rounded-[28px] border border-border/60 shadow-sm`}
    >
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    trendIsPositive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                  }`}
                >
                  {trendIsPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trendValue}
                </span>
                <span>{trendLabel}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
              <Icon className="w-6 h-6" />
            </div>
            {sparklinePath ? (
              <svg viewBox="0 0 100 24" className="h-6 w-24 overflow-visible">
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={sparklineStroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



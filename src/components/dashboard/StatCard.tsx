import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-card",
    primary: "bg-primary/10",
    success: "bg-emerald-500/10",
    warning: "bg-amber-500/10",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary text-primary-foreground",
    success: "bg-emerald-500 text-primary-foreground",
    warning: "bg-amber-500 text-primary-foreground",
  };

  return (
    <Card className={`${variantStyles[variant]} border-none shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-destructive'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% من الشهر الماضي
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

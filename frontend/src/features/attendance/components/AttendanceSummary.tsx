import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";

interface AttendanceSummaryProps {
  summaryData?: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };
}

export function AttendanceSummary({ summaryData }: AttendanceSummaryProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const data = summaryData || { total: 0, present: 0, absent: 0, late: 0 };
    return [
      { label: t("total_employees"), value: data.total, icon: Clock, color: "primary" },
      { label: t("present_label"), value: data.present, icon: CheckCircle, color: "success" },
      { label: t("absent_label"), value: data.absent, icon: XCircle, color: "destructive" },
      { label: t("late_count"), value: data.late, icon: AlertCircle, color: "warning" },
    ];
  }, [summaryData, t]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                stat.color === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                stat.color === 'destructive' ? 'bg-destructive/10 text-destructive' :
                'bg-amber-500/10 text-amber-600'
              }`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

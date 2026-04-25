import { Activity, Radio, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface PulseCardProps {
  data: {
    currentlyCheckedIn: number;
    deviceStatus: {
      online: number;
      total: number;
    };
    latestLogs: Array<{
      employee_code: string;
      device: string;
      timestamp: string;
      action: string;
    }>;
    lastSync: string | null;
  };
  isLoading?: boolean;
}

export function PulseCard({ data, isLoading }: PulseCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? ar : enUS;

  if (isLoading || !data) {
    return (
      <Card className="border border-border/60 shadow-sm overflow-hidden h-full animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded" />
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          </div>
          <div className="space-y-3">
             <div className="h-2 w-24 bg-muted rounded" />
             <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-full bg-muted/30 rounded-lg" />
                ))}
             </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 shadow-sm overflow-hidden h-full transition-all hover:shadow-md hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          {t("live_office_pulse")}
        </CardTitle>
        <div className="flex items-center gap-1.5 bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider">{t("live_badge")}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("currently_in")}
            </p>
            <p className="text-4xl font-black text-foreground tracking-tight">
              {data.currentlyCheckedIn}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("active_devices")}
            </p>
            <div className="flex items-center justify-end gap-2 text-primary font-bold">
               <Radio className="h-4 w-4 animate-pulse" />
               <p className="text-xl">{data.deviceStatus.online} <span className="text-muted-foreground/40 font-normal">/</span> {data.deviceStatus.total}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t("latest_activity")}
            </p>
          </div>
          <div className="space-y-1.5">
            {data.latestLogs.map((log, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between text-[11px] bg-muted/40 hover:bg-primary/5 p-2 rounded-lg group transition-all border border-transparent hover:border-primary/10"
              >
                <div className="flex items-center gap-2.5">
                   <div 
                     className={`h-2 w-2 rounded-full ring-4 ring-background ${
                       log.action === 'check_in' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                     }`} 
                   />
                   <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                     {log.employee_code}
                   </span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-muted-foreground/60 italic text-[10px] hidden sm:inline">{log.device}</span>
                   <span className="text-muted-foreground font-medium tabular-nums px-1.5 py-0.5 bg-background/50 rounded border border-border/40">
                     {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale })}
                   </span>
                </div>
              </div>
            ))}
            {data.latestLogs.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-border/40 rounded-xl">
                   <p className="text-muted-foreground text-xs font-medium">{t("no_recent_activity")}</p>
                </div>
            )}
          </div>
        </div>

        {data.lastSync && (
          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px]">
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <Clock className="h-3 w-3" />
               <span className="font-medium">{t("last_sync_completed")}</span>
             </div>
             <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">
               {formatDistanceToNow(new Date(data.lastSync), { addSuffix: true, locale })}
             </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

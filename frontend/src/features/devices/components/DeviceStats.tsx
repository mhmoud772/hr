import React from "react";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";

interface DeviceStatsProps {
  totalCount: number;
  onlineCount: number;
  offlineCount: number;
}

export function DeviceStats({ totalCount, onlineCount, offlineCount }: DeviceStatsProps) {
  const { t } = useTranslation();

  const stats = [
    { label: t("total_devices"), value: totalCount, icon: Fingerprint, color: "primary" },
    { label: t("online_status"), value: onlineCount, icon: Wifi, color: "success" },
    { label: t("offline_status"), value: offlineCount, icon: WifiOff, color: "destructive" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                stat.color === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                'bg-destructive/10 text-destructive'
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

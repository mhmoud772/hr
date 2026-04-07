import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useSelfServiceNotifications } from "../hooks/useSelfServiceNotifications";

export function NotificationsSection() {
  const { t } = useTranslation();
  const {
    notificationsQuery,
    notifications,
    unreadCount,
    totalCount,
    filter,
    setFilter,
    search,
    setSearch,
    markRead,
    markAllRead,
    isMarkingRead,
    isMarkingAllRead,
  } = useSelfServiceNotifications();

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t("self_service_notifications")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {t("status_all")} {totalCount}
            </Badge>
            <Badge variant={unreadCount ? "default" : "outline"}>
              {t("status_unread")} {unreadCount}
            </Badge>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-52"
          />
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as "all" | "read" | "unread")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              <SelectItem value="unread">{t("status_unread")}</SelectItem>
              <SelectItem value="read">{t("status_read")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={markAllRead}
            disabled={
              isMarkingAllRead ||
              notificationsQuery.isLoading ||
              unreadCount === 0
            }
          >
            {t("mark_all_read")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notificationsQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : notificationsQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : notifications.length ? (
          <div className="space-y-3">
            {notifications.map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {note.description || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.createdAt || ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={note.read ? "outline" : "default"}>
                    {note.read ? t("status_read") : t("status_unread")}
                  </Badge>
                  {!note.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead([note.id])}
                      disabled={isMarkingRead}
                    >
                      {t("mark_read")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("no_data")}</p>
        )}
      </CardContent>
    </Card>
  );
}

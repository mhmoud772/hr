import React from "react";
import { useTranslation } from "react-i18next";
import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface DeviceFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  viewMode: "table" | "grid";
  setViewMode: (val: "table" | "grid") => void;
  isRtl: boolean;
}

export function DeviceFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  isRtl,
}: DeviceFilterBarProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search
                className={`absolute ${
                  isRtl ? "right-3" : "left-3"
                } top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
              />
              <Input
                placeholder={t("search_devices_placeholder")}
                className={isRtl ? "pr-10" : "pl-10"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("status_all")}</SelectItem>
                <SelectItem value="online">{t("online_status")}</SelectItem>
                <SelectItem value="offline">{t("offline_status")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo } from "react";
import { FolderSync, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { PageHero } from "@/shared/components/PageHero";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { DeviceAdvancedControlPanel } from "@/features/devices/components/DeviceAdvancedControlPanel";

export default function DeviceCommandCenter() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const selectedDeviceIds = useMemo(() => {
    const raw = (searchParams.get("deviceIds") || "").trim();
    if (!raw) return [];
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }, [searchParams]);

  const canManage = ["system_admin", "admin", "hr_manager"].includes(String(user?.role || ""));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("command_center")}
        subtitle={t("advanced_controls_hint")}
        icon={ListChecks}
      />

      <Alert variant={selectedDeviceIds.length > 0 ? "info" : "default"}>
        <ListChecks className="w-4 h-4" />
        <AlertTitle>
          {t("selected_devices_count", { count: selectedDeviceIds.length })}
        </AlertTitle>
        <AlertDescription>
          {selectedDeviceIds.length > 0
            ? t("command_center_selected_hint")
            : t("command_center_group_hint")}
        </AlertDescription>
      </Alert>

      <DeviceAdvancedControlPanel
        selectedDeviceIds={selectedDeviceIds}
        canManage={canManage}
      />

      {!canManage && (
        <Alert variant="warning">
          <FolderSync className="w-4 h-4" />
          <AlertTitle>{t("view_mode_advanced")}</AlertTitle>
          <AlertDescription>
            {t("not_authorized_desc")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import {
  useCloseAttendanceDay,
  useCreateAttendance,
  useDeleteAttendance,
  useImportAttendanceLogs,
  useUpdateAttendance,
} from "@/features/attendance/hooks/useAttendance";
import type { Attendance } from "@/types/api";
import { buildAttendancePayload } from "../lib/attendance-payload";
import type { ApiAttendanceRequest, ApiPatchedAttendanceRequest } from "@/types/contracts";

/**
 * A custom hook to manage mutations for Attendance record management and logistics.
 */
export function useAttendanceActions(refetch?: () => void, refetchHistory?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();
  const closeDayMutation = useCloseAttendanceDay();
  const importLogsMutation = useImportAttendanceLogs();

  const handleSave = async (selectedRecord: Attendance | null, data: Partial<Attendance>) => {
    try {
      const payload = buildAttendancePayload(data);

      if (selectedRecord) {
        setActionLoading(selectedRecord.id);
        await updateMutation.mutateAsync({ id: selectedRecord.id, data: payload as ApiPatchedAttendanceRequest });
        toast({ title: t("attendance_updated"), description: t("attendance_updated_desc") });
      } else {
        await createMutation.mutateAsync(payload as ApiAttendanceRequest);
        toast({ title: t("attendance_added"), description: t("attendance_added_desc") });
      }
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async (selectedRecord: Attendance | null) => {
    const target = selectedRecord?.id;
    if (!target) return;
    setActionLoading(target);
    try {
      await deleteMutation.mutateAsync(target);
      toast({ title: t("attendance_deleted"), description: t("attendance_deleted_desc") });
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseDay = async (date: string) => {
    try {
      const result = await closeDayMutation.mutateAsync(date);
      toast({ title: t("attendance_closed"), description: t("attendance_closed_desc", { count: result.updated }) });
      if (refetch) refetch();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleImportLogs = async () => {
    try {
      await importLogsMutation.mutateAsync("device");
      toast({ title: t("attendance_imported") });
      if (refetchHistory) refetchHistory();
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return {
    handleSave,
    confirmDelete,
    handleCloseDay,
    handleImportLogs,
    actionLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isClosing: closeDayMutation.isPending,
    isImporting: importLogsMutation.isPending,
  };
}

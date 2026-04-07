import { useMemo } from "react";
import { useAttendanceQuery } from "@/features/attendance/hooks/useAttendance";
import { useTrainingQuery } from "@/features/training/hooks/useTraining";
import { usePerformanceQuery } from "@/features/performance/hooks/usePerformance";
import { usePayrollQuery } from "@/features/payroll/hooks/usePayroll";
import { useAssetsQuery } from "@/features/assets/hooks/useAssets";

/**
 * A central hook for fetching all read-only self-service data.
 * This keeps the main component metadata-only.
 */
export function useSelfServiceData(employeeId?: string) {
  const attendanceQuery = useAttendanceQuery();
  const trainingQuery = useTrainingQuery({ employee: employeeId });
  const performanceQuery = usePerformanceQuery({ employee: employeeId });
  const payrollQuery = usePayrollQuery({ employee: employeeId });
  const assetsQuery = useAssetsQuery();

  const assignedAssets = useMemo(() => {
    const items = assetsQuery.data ?? [];
    if (!employeeId) return items;
    return items.filter(
      (asset) => String(asset.assignedTo || "") === String(employeeId)
    );
  }, [assetsQuery.data, employeeId]);

  return {
    attendanceQuery,
    trainingQuery,
    performanceQuery,
    payrollQuery,
    assetsQuery,
    assignedAssets,
    isLoading:
      attendanceQuery.isLoading ||
      trainingQuery.isLoading ||
      performanceQuery.isLoading ||
      payrollQuery.isLoading ||
      assetsQuery.isLoading,
    isError:
      attendanceQuery.isError ||
      trainingQuery.isError ||
      performanceQuery.isError ||
      payrollQuery.isError ||
      assetsQuery.isError,
  };
}

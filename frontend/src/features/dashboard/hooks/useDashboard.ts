import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/features/dashboard/api/dashboard";
import type { TimeRange } from "@/types/api";

export const useDashboardSummary = (range: TimeRange) =>
  useQuery({
    queryKey: ["dashboard-summary", range],
    queryFn: () => getDashboardSummary(range),
  });


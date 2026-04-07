import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getDashboardPulse } from "@/features/dashboard/api/dashboard";
import type { TimeRange } from "@/types/api";

export const useDashboardSummary = (range: TimeRange) =>
  useQuery({
    queryKey: ["dashboard-summary", range],
    queryFn: () => getDashboardSummary(range),
  });

export const useDashboardPulse = () =>
  useQuery({
    queryKey: ["dashboard-pulse"],
    queryFn: () => getDashboardPulse(),
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000,
  });


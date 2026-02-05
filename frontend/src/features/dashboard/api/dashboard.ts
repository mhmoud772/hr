import { apiClient } from "@/shared/lib/api-client";
import type { DashboardSummary, TimeRange } from "@/types/api";

export const getDashboardSummary = async (range: TimeRange) => {
  const res = await apiClient.get("/dashboard/summary", { params: { range } });
  return res.data as DashboardSummary;
};


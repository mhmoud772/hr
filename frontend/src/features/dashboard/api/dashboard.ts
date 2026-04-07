import { apiClient } from "@/shared/lib/api-client";
import { normalizeDashboardPulse, normalizeDashboardSummary } from "@/shared/lib/normalizers/reports";
import type { DashboardPulse, DashboardSummary, TimeRange } from "../types";

export const getDashboardSummary = async (range: TimeRange) => {
  const res = await apiClient.get("/dashboard/summary", { params: { range } });
  return normalizeDashboardSummary(res.data as DashboardSummary | Record<string, unknown>);
};
export const getDashboardPulse = async () => {
  const res = await apiClient.get("/dashboard/pulse");
  return normalizeDashboardPulse(res.data as DashboardPulse | Record<string, unknown>);
};


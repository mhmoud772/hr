/**
 * Route Loaders — React Router v6.4+ Data API
 * ─────────────────────────────────────────────
 * These loaders pre-fetch data BEFORE the page renders,
 * completely eliminating the blank-screen + spinner experience.
 *
 * Each loader:
 * 1. Calls the API directly (bypassing React Query's cache)
 * 2. React Query hydrates from the result via queryClient.setQueryData
 * 3. The page component reads from cache instantly (no isLoading state)
 *
 * Usage in App.tsx:
 *   { path: "/", loader: dashboardLoader(queryClient), element: <Dashboard /> }
 */
import type { QueryClient } from "@tanstack/react-query";
import { getAttendanceSummary } from "@/features/attendance/api/attendance";
import { getDashboardSummary } from "@/features/dashboard/api/dashboard";
import { getLeaveBalances } from "@/features/leaves/api/leaves";
import { getDepartments } from "@/features/structure/api/departments";
import { getAuthToken, getRefreshToken } from "@/shared/lib/api-client";

// ── API helpers ───────────────────────────────────────────────────

async function fetchDashboard(range = "week") {
  return getDashboardSummary(range as "today" | "week" | "month");
}

async function fetchAttendanceSummary(date: string) {
  return getAttendanceSummary(date);
}

async function fetchDepartments() {
  return getDepartments();
}

function hasAuthSession() {
  return Boolean(getAuthToken() || getRefreshToken());
}

// ── Loaders ───────────────────────────────────────────────────────

/**
 * Dashboard loader — pre-fetches summary + departments in parallel.
 * Uses "week" as the default range; the page can switch ranges client-side.
 */
export function dashboardLoader(queryClient: QueryClient) {
  return async () => {
    if (!hasAuthSession()) {
      return { dashboardData: null, departments: [] };
    }

    const today = new Date().toISOString().slice(0, 10);
    const range = "week";

    // Fire all requests in parallel
    const [dashboardData, departments] = await Promise.allSettled([
      fetchDashboard(range),
      fetchDepartments(),
    ]);

    // Hydrate React Query cache so the component renders instantly
    if (dashboardData.status === "fulfilled") {
      queryClient.setQueryData(["dashboard-summary", range], dashboardData.value);
    }
    if (departments.status === "fulfilled") {
      queryClient.setQueryData(["departments", {}], departments.value);
    }

    // Return data for useLoaderData() if needed (optional)
    return {
      dashboardData: dashboardData.status === "fulfilled" ? dashboardData.value : null,
      departments: departments.status === "fulfilled" ? departments.value : [],
    };
  };
}

/**
 * Attendance loader — pre-fetches today's summary + department list.
 */
export function attendanceLoader(queryClient: QueryClient) {
  return async () => {
    if (!hasAuthSession()) {
      return { summary: null, departments: [] };
    }

    const today = new Date().toISOString().slice(0, 10);

    const [summary, departments] = await Promise.allSettled([
      fetchAttendanceSummary(today),
      fetchDepartments(),
    ]);

    if (summary.status === "fulfilled") {
      queryClient.setQueryData(["attendance-summary", today], summary.value);
    }
    if (departments.status === "fulfilled") {
      queryClient.setQueryData(["departments", {}], departments.value);
    }

    return {
      summary: summary.status === "fulfilled" ? summary.value : null,
      departments: departments.status === "fulfilled" ? departments.value : [],
    };
  };
}

/**
 * Leaves loader — pre-fetches leave balances + departments.
 */
export function leavesLoader(queryClient: QueryClient) {
  return async () => {
    if (!hasAuthSession()) {
      return { balances: [], departments: [] };
    }

    const [balances, departments] = await Promise.allSettled([
      getLeaveBalances(),
      fetchDepartments(),
    ]);

    if (balances.status === "fulfilled") {
      queryClient.setQueryData(["leave-balances", undefined], balances.value);
    }
    if (departments.status === "fulfilled") {
      queryClient.setQueryData(["departments", {}], departments.value);
    }

    return {
      balances: balances.status === "fulfilled" ? balances.value : [],
      departments: departments.status === "fulfilled" ? departments.value : [],
    };
  };
}

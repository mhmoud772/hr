import { Toaster } from "@/shared/ui/toaster";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, useLocation, Navigate, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v6";
import React, { Suspense, lazy, useEffect, useLayoutEffect, useState } from "react";
import { MainLayout } from "@/shared/layout/MainLayout";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { LoadingState } from "@/shared/components/LoadingState";
import { useTranslation } from "react-i18next";
import { getSetupStatus } from "@/features/auth/api/auth";
import * as Sentry from "@sentry/react";
import { dashboardLoader, attendanceLoader, leavesLoader } from "@/shared/lib/route-loaders";

const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const Employees = lazy(() => import("@/features/employees/pages/Employees"));
const Attendance = lazy(() => import("@/features/attendance/pages/Attendance"));
const Shifts = lazy(() => import("@/features/attendance/pages/Shifts"));
const Leaves = lazy(() => import("@/features/leaves/pages/Leaves"));
const Structure = lazy(() => import("@/features/structure/pages/Structure"));
const Devices = lazy(() => import("@/features/devices/pages/Devices"));
const DeviceCommandCenter = lazy(() => import("@/features/devices/pages/DeviceCommandCenter"));
const JobTitles = lazy(() => import("@/features/job-titles/pages/JobTitles"));
const Users = lazy(() => import("@/features/users/pages/Users"));
const Settings = lazy(() => import("@/features/settings/pages/Settings"));
const NotFound = lazy(() => import("@/shared/pages/NotFound"));
const Reports = lazy(() => import("@/features/reports/pages/Reports"));
const AuditLogs = lazy(() => import("@/features/audit-logs/pages/AuditLogs"));
const Payroll = lazy(() => import("@/features/payroll/pages/Payroll"));
const Recruitment = lazy(() => import("@/features/recruitment/pages/Recruitment"));
const Performance = lazy(() => import("@/features/performance/pages/Performance"));
const Training = lazy(() => import("@/features/training/pages/Training"));
const Assets = lazy(() => import("@/features/assets/pages/Assets"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const ChangePassword = lazy(() => import("@/features/auth/pages/ChangePassword"));
const ResetPassword = lazy(() => import("@/features/auth/pages/ResetPassword"));
const ResetPasswordConfirm = lazy(() => import("@/features/auth/pages/ResetPasswordConfirm"));
const NotAuthorized = lazy(() => import("@/features/auth/pages/NotAuthorized"));
const InitialSetup = lazy(() => import("@/features/auth/pages/InitialSetup"));
const SelfService = lazy(() => import("@/features/self-service/pages/SelfService"));
const Onboarding = lazy(() => import("@/features/onboarding/pages/Onboarding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes — data stays fresh, no refetch on navigation
      gcTime: 10 * 60 * 1000,          // 10 minutes — keep unused cache before garbage-collecting
      retry: 1,                         // 1 retry on failure (instant feedback on real errors)
      refetchOnWindowFocus: false,      // don't re-fetch when user alt-tabs back
    },
  },
});

// Modern Error Boundary for React Router v6.4+ Data API
function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();
  console.error("Route error:", error);
  let message = t("unexpected_error");
  if (isRouteErrorResponse(error)) {
    message = error.statusText || error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }
  
  useEffect(() => {
    if (error instanceof Error) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div style={{ color: "red", padding: 32 }}>
      <h2>{t("application_error")}</h2>
      <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded-md overflow-auto">{message}</pre>
    </div>
  );
}

// A guard component to handle the dynamic setup logic globally
const GlobalGuard = () => {
  const { t } = useTranslation();
  const [setupState, setSetupState] = useState<"loading" | "required" | "ready">("loading");
  const location = useLocation();

  useEffect(() => {
    let active = true;
    getSetupStatus()
      .then((status) => {
        if (!active) return;
        setSetupState(status.requiresSetup ? "required" : "ready");
      })
      .catch(() => {
        if (!active) return;
        setSetupState("ready");
      });
    return () => {
      active = false;
    };
  }, []);

  if (setupState === "loading") {
    return (
      <div className="p-8">
        <LoadingState label={t("loading_application")} />
      </div>
    );
  }

  const setupRequired = setupState === "required";
  const path = location.pathname;

  // If setup is required, only allow access to /initial-setup
  if (setupRequired && path !== "/initial-setup") {
    return <Navigate to="/initial-setup" replace />;
  }

  // If setup is NOT required but user visits /initial-setup, send them to login
  if (!setupRequired && path === "/initial-setup") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const LazyRoute = ({ element: Element }: { element: React.ElementType }) => {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div className="p-8 flex justify-center w-full"><LoadingState label={t("loading_page")} /></div>}>
      <Element />
    </Suspense>
  );
};

const router = createBrowserRouter([
  {
    element: (
      <ThemeProvider defaultTheme="light" storageKey="hr-companion-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NuqsAdapter>
              <GlobalGuard />
            </NuqsAdapter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/initial-setup", element: <LazyRoute element={InitialSetup} /> },
      { path: "/login", element: <LazyRoute element={Login} /> },
      { path: "/reset-password", element: <LazyRoute element={ResetPassword} /> },
      { path: "/reset-password/confirm", element: <LazyRoute element={ResetPasswordConfirm} /> },
      {
        element: (
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        ),
        children: [
          { path: "/", loader: dashboardLoader(queryClient), element: <LazyRoute element={Dashboard} /> },
          { path: "/employees", element: <LazyRoute element={Employees} /> },
          { path: "/attendance", loader: attendanceLoader(queryClient), element: <LazyRoute element={Attendance} /> },
          { path: "/shifts", element: <LazyRoute element={Shifts} /> },
          { path: "/leaves", loader: leavesLoader(queryClient), element: <LazyRoute element={Leaves} /> },
          { path: "/reports", element: <LazyRoute element={Reports} /> },
          { path: "/audit-logs", element: <LazyRoute element={AuditLogs} /> },
          { path: "/payroll", element: <LazyRoute element={Payroll} /> },
          { path: "/recruitment", element: <LazyRoute element={Recruitment} /> },
          { path: "/performance", element: <LazyRoute element={Performance} /> },
          { path: "/training", element: <LazyRoute element={Training} /> },
          { path: "/assets", element: <LazyRoute element={Assets} /> },
          { path: "/structure", element: <LazyRoute element={Structure} /> },
          { path: "/devices", element: <LazyRoute element={Devices} /> },
          {
            path: "/device-command-center",
            element: (
              <RequireAuth roles={["system_admin", "admin", "hr_manager"]}>
                <LazyRoute element={DeviceCommandCenter} />
              </RequireAuth>
            ),
          },
          { path: "/job-titles", element: <LazyRoute element={JobTitles} /> },
          { path: "/users", element: <LazyRoute element={Users} /> },
          { path: "/settings", element: <LazyRoute element={Settings} /> },
          { path: "/self-service", element: <LazyRoute element={SelfService} /> },
          { path: "/onboarding", element: <LazyRoute element={Onboarding} /> },
          { path: "/change-password", element: <LazyRoute element={ChangePassword} /> },
          { path: "/not-authorized", element: <LazyRoute element={NotAuthorized} /> },
          { path: "*", element: <LazyRoute element={NotFound} /> },
        ],
      },
    ],
  },
]);

const App = () => {
  const { i18n } = useTranslation();

  // Keep document language/direction aligned everywhere
  useLayoutEffect(() => {
    const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;

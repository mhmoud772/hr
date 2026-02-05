import { Toaster } from "@/shared/ui/toaster";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import { MainLayout } from "@/shared/layout/MainLayout";
import { ThemeProvider } from "@/shared/components/theme-provider";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Employees from "@/features/employees/pages/Employees";
import Attendance from "@/features/attendance/pages/Attendance";
import Leaves from "@/features/leaves/pages/Leaves";
import Structure from "@/features/structure/pages/Structure";
import Devices from "@/features/devices/pages/Devices";
import JobTitles from "@/features/job-titles/pages/JobTitles";
import Users from "@/features/users/pages/Users";
import Settings from "@/features/settings/pages/Settings";
import NotFound from "@/shared/pages/NotFound";
import Reports from "@/features/reports/pages/Reports";
import AuditLogs from "@/features/audit-logs/pages/AuditLogs";
import Payroll from "@/features/payroll/pages/Payroll";
import Recruitment from "@/features/recruitment/pages/Recruitment";
import Performance from "@/features/performance/pages/Performance";
import Training from "@/features/training/pages/Training";
import Assets from "@/features/assets/pages/Assets";
import Login from "@/features/auth/pages/Login";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import ResetPasswordConfirm from "@/features/auth/pages/ResetPasswordConfirm";
import NotAuthorized from "@/features/auth/pages/NotAuthorized";
import SelfService from "@/features/self-service/pages/SelfService";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AuthProvider } from "@/features/auth/components/AuthProvider";

const queryClient = new QueryClient();

// ErrorBoundary to display unexpected render errors.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: "red", padding: 32 }}>
          <h2>Application error:</h2>
          <pre>{this.state.error?.message || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hr-companion-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
                <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/leaves" element={<Leaves />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/recruitment" element={<Recruitment />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/structure" element={<Structure />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/job-titles" element={<JobTitles />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/self-service" element={<SelfService />} />
                  <Route path="/change-password" element={<Navigate to="/settings?tab=security" replace />} />
                  <Route path="/not-authorized" element={<NotAuthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;


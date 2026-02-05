import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { LoadingState } from "@/shared/components/LoadingState";

type RequireAuthProps = { children: ReactNode; roles?: string[] };

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus("denied");
      if (sessionStorage.getItem("authExpired")) {
        sessionStorage.removeItem("authExpired");
        toast.error(t("session_expired"));
      }
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }
    const inSecuritySettings =
      location.pathname === "/settings" &&
      new URLSearchParams(location.search).get("tab") === "security";
    if (user.must_change_password && !inSecuritySettings) {
      setStatus("denied");
      navigate("/settings?tab=security", { replace: true });
      return;
    }
    if (roles && !roles.includes(String(user.role || ""))) {
      setStatus("denied");
      navigate("/not-authorized", { replace: true });
      return;
    }
    setStatus("allowed");
  }, [navigate, roles, user, loading, location.pathname]);
  if (status !== "allowed") {
    return <LoadingState label={t("loading")} />;
  }
  return <>{children}</>;
}


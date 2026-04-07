import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { AuthCard, AuthShell } from "@/shared/components/AuthShell";

const NotFound = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AuthShell dir={isArabic ? "rtl" : "ltr"}>
      <AuthCard className="max-w-md text-center">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold">404</CardTitle>
          <p className="text-lg font-semibold">{t("not_found_title")}</p>
          <p className="text-sm text-muted-foreground">{t("not_found_desc")}</p>
        </CardHeader>
        <CardContent>
          <a href="/" className="text-sm text-primary underline hover:text-primary/90">
            {t("back_home")}
          </a>
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
};

export default NotFound;

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { AuthCard, AuthShell } from "@/shared/components/AuthShell";

export default function NotAuthorized() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");
  const navigate = useNavigate();

  return (
    <AuthShell dir={isArabic ? "rtl" : "ltr"}>
      <AuthCard className="max-w-md text-center">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{t("not_authorized_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("not_authorized_desc")}</p>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {t("contact_support", { defaultValue: "Contact support if you believe this is an error." })}
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate("/")}>{t("back_home")}</Button>
          </div>
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
}

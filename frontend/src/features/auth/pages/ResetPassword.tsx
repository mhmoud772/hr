import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { requestPasswordReset } from "@/features/auth/api/auth";
import { AlertTriangle, Mail } from "lucide-react";
import { AuthCard, AuthShell } from "@/shared/components/AuthShell";

export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArabic = i18n.language?.startsWith("ar");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("email_invalid"));
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(trimmed);
      toast({
        title: t("password_reset.success_title"),
        description: t("password_reset.email_hint"),
      });
      navigate("/reset-password/confirm", { state: { email: trimmed } });
    } catch (err) {
      setError(t("password_reset.error_desc"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell dir={isArabic ? "rtl" : "ltr"}>
      <AuthCard className="max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">{t("password_reset.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("password_reset.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("password_reset.email_label")}</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("password_reset.email_label")}
                autoComplete="email"
                disabled={submitting}
              />
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mt-0.5" />
              <span>{t("password_reset.email_hint")}</span>
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" aria-live="polite">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" type="button" onClick={() => navigate(-1)}>
                {t("password_reset.back")}
              </Button>
              <Button className="flex-1" type="submit" disabled={submitting || !email.trim()}>
                {submitting ? t("password_reset.sending") : t("password_reset.send_code")}
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{t("password_reset.email_hint")}</span>
            </div>
          </form>
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
}

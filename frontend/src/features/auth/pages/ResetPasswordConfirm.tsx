import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { confirmPasswordReset, requestPasswordReset } from "@/features/auth/api/auth";
import { AuthCard, AuthShell } from "@/shared/components/AuthShell";

export default function ResetPasswordConfirm() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail =
    ((location.state as { email?: string } | null)?.email ||
      new URLSearchParams(location.search).get("email") ||
      "").toString();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArabic = i18n.language?.startsWith("ar");
  const [resendIn, setResendIn] = useState(60);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const handleResend = async () => {
    if (resendIn > 0 || !email.trim()) return;
    setError(null);
    setResendIn(60);
    try {
      await requestPasswordReset(email.trim());
      toast({
        title: t("verification.resend"),
        description: t("verification.spam_hint"),
      });
    } catch {
      setError(t("password_reset.error_desc"));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedEmail || !trimmedCode) {
      setError(t("password_reset.error_desc"));
      return;
    }
    if (trimmedCode.length < 4) {
      setError(t("password_reset.error_desc"));
      return;
    }
    if (!password || password.length < 6) {
      setError(t("password_min"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwords_not_match"));
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(trimmedEmail, trimmedCode, password);
      toast({
        title: t("password_reset.success_title"),
        description: t("password_reset.success_desc"),
      });
      navigate("/login", { replace: true });
    } catch {
      setError(t("password_reset.error_desc"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell dir={isArabic ? "rtl" : "ltr"}>
      <AuthCard className="max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">{t("password_reset.code_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("password_reset.code_subtitle", { email: initialEmail })}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("password_reset.email_label")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("password_reset.email_label")}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-code">{t("password_reset.code_label")}</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("password_reset.new_password")}</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password_reset.new_password")}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("password_reset.confirm_password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("password_reset.confirm_password")}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? t("password_reset.sending") : t("password_reset.submit")}
            </Button>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("verification.spam_hint")}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={resendIn > 0 || submitting}
                onClick={handleResend}
              >
                {resendIn > 0 ? t("verification.resend_wait", { seconds: resendIn }) : t("verification.resend")}
              </Button>
            </div>
          </form>
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
}

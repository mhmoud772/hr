import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { confirmPasswordReset } from "@/features/auth/api/auth";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordConfirm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const query = useQueryParams();
  const uid = query.get("uid") || "";
  const token = query.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!uid || !token) {
      setError(t("reset_password_invalid_link"));
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
      await confirmPasswordReset(uid, token, password);
      toast({
        title: t("password_changed"),
        description: t("reset_password_success_desc"),
      });
      navigate("/login", { replace: true });
    } catch {
      setError(t("reset_password_invalid_link"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">{t("reset_password_new_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("reset_password_new_desc")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("new_password")}</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("new_password")}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("confirm_password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("confirm_password")}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" aria-live="polite">
                {error}
              </div>
            )}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? t("loading") : t("reset_password_new_submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

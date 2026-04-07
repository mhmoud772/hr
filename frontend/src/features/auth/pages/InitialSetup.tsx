import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { completeInitialSetup } from "@/features/auth/api/auth";
import { setAuthToken, setRefreshToken } from "@/shared/lib/api-client";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { AuthCard, AuthShell } from "@/shared/components/AuthShell";

export default function InitialSetup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    country: "",
    currency: "",
  });
  const isArabic = i18n.language.startsWith("ar");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError(t("generic_error", { defaultValue: "Invalid input" }));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("passwords_not_match"));
      return;
    }

    try {
      setSaving(true);
      const result = await completeInitialSetup({
        admin: {
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        },
        company: {
          name: form.companyName.trim(),
          country: form.country.trim(),
          currency: form.currency.trim(),
          email: form.email.trim(),
        },
      });

      if (result.token) {
        setAuthToken(result.token, "local");
      }
      if (result.refreshToken) {
        setRefreshToken(result.refreshToken, "local");
      }
      localStorage.setItem("user", JSON.stringify(result.user));
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t("generic_error");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell dir={isArabic ? "rtl" : "ltr"}>
      <AuthCard className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("onboarding_title", { defaultValue: "Initial Setup" })}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("onboarding_subtitle", { defaultValue: "Create your first admin account to activate the system." })}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">{t("full_name")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">{t("company_name_ar", { defaultValue: "Company name" })}</Label>
                <Input
                  id="company-name"
                  value={form.companyName}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t("company_country", { defaultValue: "Country" })}</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{t("company_currency", { defaultValue: "Currency" })}</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("confirm_password")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? t("saving") : t("start_now", { defaultValue: "Start now" })}
            </Button>
          </form>
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
}

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { Users, Calendar, Clock, ShieldCheck, Bell } from "lucide-react";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { t, i18n } = useTranslation();

  const LOCKOUT_KEY = "login_lockout_until";
  const ATTEMPTS_KEY = "login_attempts";
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 60 * 1000;

  const loginSchema = z.object({
    username: z.string().min(1, t("username_required")),
    password: z.string().min(6, t("password_min")),
  });

  const registerSchema = loginSchema
    .extend({
      name: z.string().min(2, t("name_required")),
      confirmPassword: z.string().min(6, t("confirm_password_required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwords_not_match"),
      path: ["confirmPassword"],
    });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  function getErrorMessage(err: unknown) {
    if (err instanceof Error) return err.message;
    try {
      return String(err);
    } catch {
      return t("generic_error");
    }
  }

  const getLockout = () => {
    const raw = sessionStorage.getItem(LOCKOUT_KEY);
    if (!raw) return null;
    const until = Number(raw);
    return Number.isFinite(until) ? until : null;
  };

  const setLockout = (until: number | null) => {
    if (until) {
      sessionStorage.setItem(LOCKOUT_KEY, String(until));
      setLockoutUntil(until);
    } else {
      sessionStorage.removeItem(LOCKOUT_KEY);
      setLockoutUntil(null);
    }
  };

  const getAttempts = () => Number(sessionStorage.getItem(ATTEMPTS_KEY) || "0");
  const setAttempts = (value: number) => sessionStorage.setItem(ATTEMPTS_KEY, String(value));

  const isLocked = useMemo(() => {
    const until = lockoutUntil ?? getLockout();
    if (!until) return false;
    return Date.now() < until;
  }, [lockoutUntil]);

  const isSubmitting = useMemo(
    () =>
      isRegistering
        ? registerForm.formState.isSubmitting
        : loginForm.formState.isSubmitting,
    [
      isRegistering,
      loginForm.formState.isSubmitting,
      registerForm.formState.isSubmitting,
    ],
  );

  const handleSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError("");
    if (isLocked) {
      setError(t("login_locked"));
      return;
    }
    try {
      await login(values.username, values.password, rememberMe);
      setAttempts(0);
      setLockout(null);
      const from = (location.state as { from?: string } | undefined)?.from || "/";
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error("Login error:", err);
      const attempts = getAttempts() + 1;
      setAttempts(attempts);
      if (attempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockout(until);
        setError(t("generic_error"));
        return;
      }
      setError(t("invalid_login"));
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setError("");
    try {
      await register(values.name, values.username, values.password);
      const from = (location.state as { from?: string } | undefined)?.from || "/";
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error("Register error:", err);
      const msg = getErrorMessage(err);
      setError(msg || t("register_failed"));
    }
  };

  const strength = useMemo(() => {
    const value = registerForm.watch("password") || "";
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }, [registerForm.watch("password")]);

  const strengthLabel = (
    i18n.language.startsWith("ar")
      ? ["ضعيف", "مقبول", "جيد", "قوي", "ممتاز"]
      : ["Weak", "Fair", "Good", "Strong", "Excellent"]
  )[strength] || "";
  const strengthColor = ["bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"][strength] || "bg-muted";

  const canRegister = import.meta.env.VITE_ALLOW_SIGNUP === "true";

  return (
    <div className="min-h-screen bg-[radial-gradient(140%_140%_at_0%_0%,rgba(14,165,233,0.35),transparent_42%),radial-gradient(140%_140%_at_100%_0%,rgba(34,197,94,0.32),transparent_48%),radial-gradient(120%_120%_at_50%_100%,rgba(59,130,246,0.28),transparent_55%),linear-gradient(135deg,#e9f1ff,#f8fbff,#e1effa)] flex items-center justify-center px-4 relative overflow-hidden">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold overflow-hidden">
            <img src="/logo.svg" alt={t("app_name")} className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">
            {isRegistering ? t("register_title") : t("login_title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isRegistering ? t("create_account") : t("app_subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              isRegistering
                ? registerForm.handleSubmit(handleRegister)
                : loginForm.handleSubmit(handleSubmit)
            }
            className="space-y-4"
          >
            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="full-name">{t("full_name")}</Label>
                <Input
                  id="full-name"
                  placeholder={t("full_name")}
                  autoComplete="name"
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username"
                placeholder={t("username")}
                autoComplete="username"
                autoFocus
                {...(isRegistering
                  ? registerForm.register("username")
                  : loginForm.register("username"))}
                aria-label={t("username")}
              />
              {(isRegistering
                ? registerForm.formState.errors.username
                : loginForm.formState.errors.username) && (
                <p className="text-xs text-destructive">
                  {
                    (isRegistering
                      ? registerForm.formState.errors.username
                      : loginForm.formState.errors.username
                    )?.message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="flex items-center gap-2">
              <Input
                id="password"
                placeholder={t("password")}
                type={showPassword ? "text" : "password"}
                autoComplete={
                  isRegistering ? "new-password" : "current-password"
                }
                {...(isRegistering
                  ? registerForm.register("password")
                  : loginForm.register("password"))}
                aria-label={t("password")}
              />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? t("hide") : t("show")}
                </Button>
              </div>
              {(isRegistering
                ? registerForm.formState.errors.password
                : loginForm.formState.errors.password) && (
                <p className="text-xs text-destructive">
                  {
                    (isRegistering
                      ? registerForm.formState.errors.password
                      : loginForm.formState.errors.password
                    )?.message
                  }
                </p>
              )}
              {isRegistering && (
                <div className="mt-2">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${strengthColor}`} style={{ width: `${(strength / 4) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{strengthLabel}</p>
                </div>
              )}
            </div>

            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t("confirm_password")}
                </Label>
                <Input
                  id="confirm-password"
                  placeholder={t("confirm_password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerForm.register("confirmPassword")}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {!isRegistering && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(value) => setRememberMe(Boolean(value))}
                    aria-label={t("remember_me")}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    {t("remember_me")}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => navigate("/reset-password")}
                >
                  {t("forgot_password")}
                </Button>
              </div>
            )}

            {isLocked && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {t("login_locked")}
              </div>
            )}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("loading")
                : isRegistering
                  ? t("register")
                  : t("login")}
            </Button>

            {!isRegistering && import.meta.env.VITE_SHOW_DEMO_LOGIN === "true" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => login("admin", "Admin12345!", true)}
                >
                  {t("login_demo_admin")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => login("employee", "Employee12345!", true)}
                >
                  {t("login_demo_employee")}
                </Button>
              </div>
            )}

            {canRegister && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-primary"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                    loginForm.reset();
                    registerForm.reset();
                  }}
                  aria-label={isRegistering ? t("have_account") : t("create_account")}
                >
                  {isRegistering ? t("have_account") : t("create_account")}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


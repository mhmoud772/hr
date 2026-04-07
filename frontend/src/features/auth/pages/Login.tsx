import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { Users, Calendar, Clock, Languages, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { webauthnAuthBegin, webauthnAuthFinish } from "@/features/auth/api/auth";
import { setAuthToken, setRefreshToken } from "@/shared/lib/api-client";
import { formatPublicKeyOptions, serializeAssertion } from "@/shared/lib/webauthn";
import { AuthCard, AuthShell } from "@/shared/components/AuthShell";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, refreshUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  const LOCKOUT_KEY = "login_lockout_until";
  const ATTEMPTS_KEY = "login_attempts";
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 60 * 1000;

  const loginSchema = z.object({
    username: z.string().min(1, t("username_required")),
    password: z.string().min(6, t("password_min")),
    mfa_code: z.string().optional(),
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

  const getErrorStatus = (err: unknown): number | undefined => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    return typeof status === "number" ? status : undefined;
  };

  const getErrorData = (err: unknown): unknown =>
    (err as { response?: { data?: unknown } })?.response?.data;

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

  useEffect(() => {
    if (!isLocked) {
      setLockoutSeconds(0);
      return;
    }
    const tick = () => {
      const until = lockoutUntil ?? getLockout();
      if (!until) return setLockoutSeconds(0);
      const diff = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLockoutSeconds(diff);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isLocked, lockoutUntil]);

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
      await login(values.username, values.password, rememberMe, values.mfa_code);
      setAttempts(0);
      setLockout(null);
      const from = (location.state as { from?: string } | undefined)?.from || "/";
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error("Login error:", err);
      const status = getErrorStatus(err);
      if (status === 401 || status === 400) {
        setError(t("invalid_login"));
      } else if (status && status >= 500) {
        setError(t("login_server_error"));
      } else {
        setError(t("generic_error"));
      }
      const attempts = getAttempts() + 1;
      setAttempts(attempts);
      if (attempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockout(until);
        setError(t("login_locked"));
        return;
      }
    }
  };

  const handleSecurityKeyLogin = async () => {
    const username = loginForm.getValues("username");
    if (!username.trim()) {
      setError(t("username_required"));
      return;
    }
    try {
      setError("");
      const options = await webauthnAuthBegin(username.trim());
      const publicKey = formatPublicKeyOptions(options.publicKey || options);
      const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
      const payload = serializeAssertion(assertion);
      payload.username = username.trim();
      const result = await webauthnAuthFinish(payload);
      const token =
        ("token" in result ? (result as { token?: string }).token : undefined) ??
        ("accessToken" in result ? (result as { accessToken?: string }).accessToken : undefined);
      const refreshToken =
        ("refreshToken" in result
          ? (result as { refreshToken?: string }).refreshToken
          : undefined) ?? null;
      if (!token) throw new Error("No token");
      setAuthToken(token, rememberMe ? "local" : "session");
      setRefreshToken(refreshToken, rememberMe ? "local" : "session");
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("WebAuthn login failed", err);
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
      const status = getErrorStatus(err);
      const data = getErrorData(err);
      if (status === 400 && data && ((data as { username?: string }).username || String(data).includes("username"))) {
        setError(t("username_taken"));
      } else if (status === 400 && data && ((data as { email?: string }).email || String(data).includes("email"))) {
        setError(t("email_taken"));
      } else {
        const msg = getErrorMessage(err);
        setError(msg || t("register_failed"));
      }
    }
  };

  const watchedRegisterPassword = registerForm.watch("password");

  const strength = useMemo(() => {
    const value = watchedRegisterPassword || "";
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }, [watchedRegisterPassword]);

  const strengthLabel =
    [
      t("password_strength_weak", "Weak"),
      t("password_strength_fair", "Fair"),
      t("password_strength_good", "Good"),
      t("password_strength_strong", "Strong"),
      t("password_strength_excellent", "Excellent"),
    ][strength] || "";
  const strengthColor = [
    "bg-destructive/70",
    "bg-warning/70",
    "bg-info/70",
    "bg-success/70",
    "bg-success",
  ][strength] || "bg-muted";

  const canRegister = import.meta.env.VITE_ALLOW_SIGNUP === "true";

  const toggleLanguage = async () => {
    const next = isArabic ? "en" : "ar";
    try {
      await i18n.changeLanguage(next);
      localStorage.setItem("i18nextLng", next);
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = next;
    } catch {
      // ignore toggle errors
    }
  };

  return (
    <AuthShell dir={isArabic ? "rtl" : "ltr"}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`absolute top-4 ${isArabic ? "left-4" : "right-4"} bg-card/70 backdrop-blur shadow-sm`}
        onClick={toggleLanguage}
        aria-label={isArabic ? "اللغة" : "Language"}
      >
        <Languages className="w-5 h-5" />
      </Button>
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
        <div
          className={`hidden lg:flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/70 p-8 shadow-xl backdrop-blur-xl ${
            isArabic ? "text-right" : "text-left"
          }`}
        >
          <div className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : ""}`}>
            <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary font-bold overflow-hidden">
              <img src="/logo.svg" alt={t("app_name")} className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t("app_name")}
              </p>
              <p className="text-2xl font-semibold">{t("onboarding_title")}</p>
            </div>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("app_subtitle")}
          </p>
          <div className="grid gap-3">
            {[
              {
                icon: Users,
                title: t("employees_title"),
                desc: t("employees_subtitle"),
              },
              {
                icon: Clock,
                title: t("attendance_title"),
                desc: t("attendance_subtitle"),
              },
              {
                icon: Calendar,
                title: t("leaves_title"),
                desc: t("leaves_subtitle"),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AuthCard className="max-w-md animate-in fade-in-0 slide-in-from-bottom-6">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold overflow-hidden lg:hidden">
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
              <div className="relative">
                <Input
                  id="password"
                  placeholder={t("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isRegistering ? "new-password" : "current-password"
                  }
                  className={isArabic ? "pl-12" : "pr-12"}
                  {...(isRegistering
                    ? registerForm.register("password")
                    : loginForm.register("password"))}
                  aria-label={t("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute top-1/2 -translate-y-1/2 ${isArabic ? "left-1" : "right-1"} text-muted-foreground hover:text-foreground`}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t("hide") : t("show")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              <div className="space-y-2">
                <Label htmlFor="mfa-code">{t("mfa_code")}</Label>
                <Input
                  id="mfa-code"
                  placeholder={t("mfa_code")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...loginForm.register("mfa_code")}
                />
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

            {!isRegistering && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleSecurityKeyLogin}
              >
                {t("login_with_security_key")}
              </Button>
            )}

            {isLocked && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                {lockoutSeconds > 0
                  ? t("lockout_countdown", {
                      seconds:
                        lockoutSeconds >= 60
                          ? `${Math.floor(lockoutSeconds / 60)}:${String(lockoutSeconds % 60).padStart(2, "0")}`
                          : lockoutSeconds,
                    })
                  : t("login_locked")}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

            {isRegistering && (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm space-y-2">
                <p className="font-medium">{t("password_requirements")}</p>
                <ul className="space-y-1">
                  {[
                    { ok: strength >= 1, label: t("password_req_length") },
                    { ok: /[A-Z]/.test(registerForm.watch("password") || ""), label: t("password_req_upper") },
                    { ok: /[0-9]/.test(registerForm.watch("password") || ""), label: t("password_req_number") },
                    { ok: /[^A-Za-z0-9]/.test(registerForm.watch("password") || ""), label: t("password_req_symbol") },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      {item.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </CardContent>
        </AuthCard>
      </div>
    </AuthShell>
  );
}



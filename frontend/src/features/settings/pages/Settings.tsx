import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building,
  Clock,
  Calendar,
  Bell,
  Save,
  Monitor,
  Upload,
  Download,
  RotateCcw,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import { webauthnRegisterBegin, webauthnRegisterFinish, mfaSetup, mfaEnable, mfaDisable } from "@/features/auth/api/auth";
import { formatPublicKeyOptions, serializeAttestation } from "@/shared/lib/webauthn";
import { useTheme } from "@/shared/components/theme-provider";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/components/AuthProvider";
import type { NotificationSettings } from "@/types/api";
import type { ApiSettings } from "@/types/contracts";
import { useAuditLogsQuery } from "@/features/audit-logs/hooks/useAuditLogs";
import { changePassword } from "@/features/auth/api/password";
import { useSearchParams } from "react-router-dom";
import { PageHero } from "@/shared/components/PageHero";

import { CompanyTab } from "@/features/settings/components/tabs/CompanyTab";
import { GeneralTab } from "@/features/settings/components/tabs/GeneralTab";
import { AttendanceTab } from "@/features/settings/components/tabs/AttendanceTab";
import { LeavesTab } from "@/features/settings/components/tabs/LeavesTab";
import { NotificationsTab } from "@/features/settings/components/tabs/NotificationsTab";
import { AITab } from "@/features/settings/components/tabs/AITab";
import { SecurityTab } from "@/features/settings/components/tabs/SecurityTab";
import { BackupTab } from "@/features/settings/components/tabs/BackupTab";
import { AuditTab } from "@/features/settings/components/tabs/AuditTab";

export default function Settings() {
  type NotificationTemplates = NonNullable<NotificationSettings["templates"]>;

  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [registeringKey, setRegisteringKey] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSwitchLoading, setMfaSwitchLoading] = useState(false);
  const role = String(user?.role || "").trim().toLowerCase();
  const explicitPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const permissions = new Set(explicitPermissions);
  const canAdmin = ["system_admin", "admin", "hr_manager"].includes(role);
  const canFetchSettingsApi = canAdmin || permissions.has("settings");
  const canFetchAuditLogsApi = canFetchSettingsApi;
  const isArabic = i18n.language.startsWith("ar");
  const tSafe = useCallback((key: string, ar: string) => (isArabic ? ar : t(key)), [isArabic, t]);
  const sanitizeTemplateValue = (value?: string) =>
    (value || "").replace(/\\{\\{\\s*employee\\s*\\}\\}/g, "").replace(/\\{employee\\}/g, "").trim();
  const sanitizeTemplates = (templates?: NotificationTemplates) => {
    if (!templates) return templates;
    const next: NotificationTemplates = { ...templates };
    (Object.keys(next) as Array<keyof NotificationTemplates>).forEach((key) => {
      const item = next[key];
      if (!item) return;
      next[key] = {
        ...item,
        emailSubject: sanitizeTemplateValue(item.emailSubject),
        emailBody: sanitizeTemplateValue(item.emailBody),
        smsBody: sanitizeTemplateValue(item.smsBody),
      };
    });
    return next;
  };
  const normalizeLanguage = useCallback(
    (value?: string) => (value?.toLowerCase().startsWith("ar") ? "ar" : "en"),
    [],
  );
  const applyPreferredLanguage = useCallback(
    async (nextLanguage: string) => {
      const normalizedLanguage = normalizeLanguage(nextLanguage);
      try {
        await i18n.changeLanguage(normalizedLanguage);
        localStorage.setItem("i18nextLng", normalizedLanguage);
        document.documentElement.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = normalizedLanguage;
      } catch {
        // Ignore runtime language-sync failures and keep the saved configuration.
      }
    },
    [i18n, normalizeLanguage],
  );

  const defaultCompany = useMemo(
    () => ({
      name: t("company_name_example"),
      name_en: t("company_name_en_example"),
      email: "info@example.com",
      phone: "+966 12 345 6789",
      address: t("company_address_example"),
      logoDataUrl: "",
      logos: [] as string[],
    }),
    [t],
  );

  const defaultAttendance = {
    work_start_time: "08:00",
    work_end_time: "17:00",
    late_threshold: "15",
    early_leave_threshold: "15",
    enable_geolocation: true,
    enable_face_recognition: false,
  };

  const defaultLeave = {
    annual_leave_default: "21",
    sick_leave_default: "14",
    emergency_leave_default: "5",
    require_approval: true,
    approval_levels: "2",
    min_advance_notice: "3",
  };

  const defaultNotification = useMemo(
    () => ({
      notificationsEnabled: true,
      email_notifications: true,
      sms_notifications: false,
      leave_request_notify: true,
      attendance_alerts: true,
      weekly_reports: true,
      digestFrequency: "instant" as const,
      digestTime: "09:00",
      weeklyDigestDay: "sun" as const,
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "06:00",
      templates: {
        leaveRequest: {
          emailSubject: t("tpl_leave_request_subject"),
          emailBody: t("tpl_leave_request_body_no_var"),
          smsBody: t("tpl_leave_request_sms_no_var"),
        },
        leaveApproved: {
          emailSubject: t("tpl_leave_approved_subject"),
          emailBody: t("tpl_leave_approved_body_no_var"),
          smsBody: t("tpl_leave_approved_sms_no_var"),
        },
        leaveRejected: {
          emailSubject: t("tpl_leave_rejected_subject"),
          emailBody: t("tpl_leave_rejected_body_no_var"),
          smsBody: t("tpl_leave_rejected_sms_no_var"),
        },
        attendanceAlert: {
          emailSubject: t("tpl_attendance_alert_subject"),
          emailBody: t("tpl_attendance_alert_body_no_var"),
          smsBody: t("tpl_attendance_alert_sms_no_var"),
        },
        weeklyReport: {
          emailSubject: t("tpl_weekly_report_subject"),
          emailBody: t("tpl_weekly_report_body_no_var"),
          smsBody: t("tpl_weekly_report_sms_no_var"),
        },
      },
    }),
    [t],
  );

  const defaultGeneral = useMemo(
    () => ({
      theme: theme as string,
      language: normalizeLanguage(i18n.language),
      timezone: "Asia/Riyadh",
      time_format: "24" as const,
      week_start: "sun" as const,
      work_week_days: ["sun", "mon", "tue", "wed", "thu"],
      weekend_days: ["fri", "sat"],
      holidayCalendar: [] as { date: string; name: string; type?: string }[],
      settingsAccess: {
        company: ["system_admin", "admin", "hr_manager"],
        general: ["system_admin", "admin", "hr_manager"],
        attendance: ["system_admin", "admin", "hr_manager"],
        leaves: ["system_admin", "admin", "hr_manager"],
        notifications: ["system_admin", "admin", "hr_manager", "supervisor"],
        ai: ["system_admin", "admin", "hr_manager"],
        security: ["system_admin", "admin", "hr_manager"],
        backup: ["system_admin", "admin", "hr_manager"],
        audit: ["system_admin", "admin", "hr_manager"],
      },
      security: {
        mfaEnabled: false,
        mfaRequired: false,
        passwordMinLength: 8,
        passwordRequireUpper: true,
        passwordRequireNumber: true,
        passwordRequireSymbol: false,
        passwordExpiryDays: 90,
      },
    }),
    [theme, i18n.language, normalizeLanguage],
  );

  const recommendedSecurityDefaults = useMemo(
    () => ({
      passwordMinLength: 8,
      passwordExpiryDays: 90,
      passwordRequireUpper: true,
      passwordRequireNumber: true,
      passwordRequireSymbol: true,
      mfaEnabled: false,
      mfaRequired: false,
    }),
    [],
  );

  const company = useSettings("company_settings", defaultCompany, { enabled: canFetchSettingsApi });
  const attendance = useSettings("attendance_settings", defaultAttendance, { enabled: canFetchSettingsApi });
  const leave = useSettings("leave_settings", defaultLeave, { enabled: canFetchSettingsApi });
  const notifications = useSettings("notification_settings", defaultNotification, { enabled: canFetchSettingsApi });
  const general = useSettings("general_settings", defaultGeneral, { enabled: canFetchSettingsApi });
  const ai = useSettings(
    "ai_settings",
    {
      enabled: false,
      runtime_enabled: false,
      provider: "openai",
      model_name: "",
      allow_fallback: true,
      access_roles: ["system_admin", "admin", "hr_manager"],
      features: {
        policy_assistant: true,
        dashboard_summary: true,
      },
    },
    { enabled: canFetchSettingsApi },
  );
  const auditLogsQuery = useAuditLogsQuery(
    { model_name: "Settings" },
    { enabled: canFetchAuditLogsApi },
  );

  const isLoading =
    company.loading ||
    attendance.loading ||
    leave.loading ||
    notifications.loading ||
    general.loading ||
    ai.loading;

  useEffect(() => {
    if (general.value.theme) {
      setTheme(general.value.theme as string);
    }
  }, [general.value.theme, setTheme]);

  const mustChangePassword = Boolean(user?.must_change_password);
  const canSettings = canAdmin || permissions.has("settings");
  const canAttendance = canAdmin || permissions.has("attendance");
  const canLeaves = canAdmin || permissions.has("leaves");
  const canManageNotifications = canAdmin || permissions.has("notifications") || role === "supervisor";
  const canViewAudit = canSettings;
  const settingsAccess = general.value.settingsAccess || defaultGeneral.settingsAccess;
  const allowAccess = (section: keyof typeof settingsAccess) => {
    if (role === "system_admin") return true;
    return !settingsAccess?.[section] || settingsAccess[section].includes(role);
  };

  const canViewCompany = canSettings && allowAccess("company");
  const canViewGeneral = canSettings && allowAccess("general");
  const canViewAttendance = canAttendance && allowAccess("attendance");
  const canViewLeaves = canLeaves && allowAccess("leaves");
  const canViewNotifications = canManageNotifications && allowAccess("notifications");
  const canViewAI = canSettings && allowAccess("ai");
  const canManageSecurity = canSettings && allowAccess("security");
  const canViewSecurity = canManageSecurity || mustChangePassword;
  const canViewBackup = canSettings && allowAccess("backup");
  const canViewAuditTab = canViewAudit && allowAccess("audit");

  const tabParam = searchParams.get("tab") || "";

  const availableTabs = useMemo(
    () => [
      { key: "company", label: t("tab_company"), icon: Building, allowed: canViewCompany },
      { key: "general", label: t("tab_general"), icon: Monitor, allowed: canViewGeneral },
      { key: "attendance", label: t("tab_attendance"), icon: Clock, allowed: canViewAttendance },
      { key: "leaves", label: t("tab_leaves"), icon: Calendar, allowed: canViewLeaves },
      { key: "notifications", label: t("tab_notifications"), icon: Bell, allowed: canViewNotifications },
      { key: "ai", label: t("tab_ai"), icon: AlertTriangle, allowed: canViewAI },
      { key: "security", label: t("self_service_security"), icon: ShieldCheck, allowed: canViewSecurity },
      { key: "backup", label: tSafe("export_settings", "تصدير الإعدادات"), icon: Download, allowed: canViewBackup },
      { key: "audit", label: t("audit_logs_title"), icon: ClipboardList, allowed: canViewAuditTab },
    ],
    [
      canViewCompany,
      canViewGeneral,
      canViewAttendance,
      canViewLeaves,
      canViewNotifications,
      canViewAI,
      canViewSecurity,
      canViewBackup,
      canViewAuditTab,
      t,
      tSafe,
    ],
  );

  const resolveTab = useMemo(() => {
    if (availableTabs.some((tab) => tab.key === tabParam && tab.allowed)) {
      return tabParam;
    }
    const firstAllowed = availableTabs.find((tab) => tab.allowed);
    return firstAllowed?.key || "company";
  }, [tabParam, availableTabs]);
  const [activeTab, setActiveTab] = useState(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab);
  }, [resolveTab]);

  const validateEmail = (value: string) =>
    !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePhone = (value: string) =>
    !value || /^[\\d+\\-\\s()]{7,}$/.test(value);
  const validateTimeRange = (start?: string, end?: string) =>
    !start || !end || start < end;
  const validateQuietHours = (enabled?: boolean, start?: string, end?: string) => {
    if (!enabled) return true;
    if (!start || !end) return false;
    return start !== end;
  };
  const validateNumberRange = (value: string, min: number, max: number) => {
    if (value === "") return true;
    const num = Number(value);
    return !Number.isNaN(num) && num >= min && num <= max;
  };

  const handleRegisterSecurityKey = async () => {
    setRegisteringKey(true);
    try {
      const options = await webauthnRegisterBegin();
      const publicKey = formatPublicKeyOptions(options.publicKey || options);
      const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
      const payload = serializeAttestation(cred);
      await webauthnRegisterFinish(payload);
      toast({ title: t("saved"), description: t("security_key_registered") });
    } catch (err) {
      toast({ title: t("generic_error"), variant: "destructive" });
    } finally {
      setRegisteringKey(false);
    }
  };
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!currentPassword || newPassword.length < 6) {
      setPasswordError(t("password_min"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwords_not_match"));
      return;
    }
    try {
      setPasswordSaving(true);
      await changePassword(currentPassword, newPassword);
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: t("saved"), description: t("password_changed") });
    } catch (err) {
      setPasswordError(t("password_change_failed"));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleMfaStart = async () => {
    setMfaLoading(true);
    try {
      const data = await mfaSetup();
      setMfaSetupData(data);
      toast({ title: t("mfa_setup_ready") });
    } catch (err) {
      toast({ title: t("generic_error"), variant: "destructive" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaCode.trim()) return;
    setMfaLoading(true);
    try {
      await mfaEnable(mfaCode.trim());
      await refreshUser();
      setMfaSetupData(null);
      setMfaCode("");
      toast({ title: t("mfa_enabled_toast") });
    } catch (err) {
      toast({ title: t("mfa_verify_failed"), variant: "destructive" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    setMfaLoading(true);
    try {
      await mfaDisable();
      await refreshUser();
      setMfaSetupData(null);
      setMfaCode("");
      toast({ title: t("mfa_disabled_toast") });
    } catch (err) {
      toast({ title: t("generic_error"), variant: "destructive" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSave = async (
    section: "company" | "general" | "attendance" | "leaves" | "notifications" | "ai" | "security",
  ) => {
    setFormErrors({});
    if (section === "company") {
      if (!validateEmail(company.value.email)) {
        setFormErrors({ company_email: t("invalid_email") });
        return;
      }
      if (!validatePhone(company.value.phone)) {
        setFormErrors({ company_phone: t("invalid_phone") });
        return;
      }
      const ok = await company.save();
      if (ok) {
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("company_title") }) });
      }
      return;
    }
    if (section === "general") {
      if (!general.value.timezone) {
        setFormErrors({ timezone: t("timezone_required") });
        return;
      }
      if (!general.value.work_week_days || general.value.work_week_days.length === 0) {
        setFormErrors({ work_week: t("generic_error") });
        return;
      }
      const ok = await general.save();
      if (ok) {
        await applyPreferredLanguage(general.value.language);
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("general_title") }) });
      }
      return;
    }
    if (section === "attendance") {
      if (!validateTimeRange(attendance.value.work_start_time, attendance.value.work_end_time)) {
        setFormErrors({ work_time: t("work_time_invalid") });
        return;
      }
      if (!validateNumberRange(attendance.value.late_threshold, 0, 240)) {
        setFormErrors({ late_threshold: t("invalid_phone") });
        return;
      }
      if (!validateNumberRange(attendance.value.early_leave_threshold, 0, 240)) {
        setFormErrors({ early_threshold: t("invalid_phone") });
        return;
      }
      const ok = await attendance.save();
      if (ok) {
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("attendance_settings_title") }) });
      }
      return;
    }
    if (section === "leaves") {
      if (!validateNumberRange(leave.value.annual_leave_default, 0, 365)) {
        setFormErrors({ annual_leave: t("invalid_phone") });
        return;
      }
      const ok = await leave.save();
      if (ok) {
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("leave_title") }) });
      }
      return;
    }
    if (section === "notifications") {
      if (!validateQuietHours(notifications.value.quietHoursEnabled, notifications.value.quietHoursStart, notifications.value.quietHoursEnd)) {
        setFormErrors({ quiet_hours: t("work_time_invalid") });
        return;
      }
      const ok = await notifications.save({
        ...notifications.value,
        templates: sanitizeTemplates(notifications.value.templates),
      });
      if (ok) {
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("notifications_title") }) });
      }
      return;
    }
    if (section === "ai") {
      const ok = await ai.save({
        ...ai.value,
        access_roles: general.value.settingsAccess?.ai || ai.value.access_roles,
      });
      if (ok) {
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("ai_settings_title") }) });
      }
      return;
    }
    if (section === "security") {
      const policy = general.value.security || {};
      const minLen = Number(policy.passwordMinLength || 0);
      if (Number.isNaN(minLen) || minLen < 6) {
        setFormErrors({ security_min_length: t("password_min") });
        return;
      }
      const ok = await general.save();
      if (ok) {
        toast({ title: t("saved"), description: t("settings_saved_desc", { section: t("self_service_security") }) });
      }
    }
  };

  const handleLogoChange = (files?: FileList | File[]) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const logo = typeof reader.result === "string" ? reader.result : "";
        const existing = company.value.logos ?? [];
        company.setValue({
          ...company.value,
          logoDataUrl: logo,
          logos: [...existing, logo],
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoRemove = (index: number) => {
    const current = company.value.logos ?? [];
    const next = current.filter((_, idx) => idx !== index);
    const logoDataUrl = company.value.logoDataUrl === current[index] ? next[0] || "" : company.value.logoDataUrl;
    company.setValue({ ...company.value, logoDataUrl, logos: next });
  };

  const addHoliday = () => {
    const holidays = general.value.holidayCalendar ?? [];
    general.setValue({
      ...general.value,
      holidayCalendar: [...holidays, { date: "", name: "", type: "holiday" }],
    });
  };

  const updateHoliday = (index: number, field: "date" | "name" | "type", value: string) => {
    const holidays = [...(general.value.holidayCalendar ?? [])];
    holidays[index] = { ...holidays[index], [field]: value };
    general.setValue({ ...general.value, holidayCalendar: holidays });
  };

  const removeHoliday = (index: number) => {
    const holidays = (general.value.holidayCalendar ?? []).filter((_, idx) => idx !== index);
    general.setValue({ ...general.value, holidayCalendar: holidays });
  };

  const toggleWorkDay = (day: string) => {
    const days = new Set(general.value.work_week_days ?? []);
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    general.setValue({ ...general.value, work_week_days: Array.from(days) });
  };

  const toggleWeekendDay = (day: string) => {
    const days = new Set(general.value.weekend_days ?? []);
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    general.setValue({ ...general.value, weekend_days: Array.from(days) });
  };

  const settingsRoles = ["system_admin", "admin", "hr_manager", "supervisor", "employee"] as const;
  const settingsSections = [
    { key: "company", label: t("tab_company") },
    { key: "general", label: t("tab_general") },
    { key: "attendance", label: t("tab_attendance") },
    { key: "leaves", label: t("tab_leaves") },
    { key: "notifications", label: t("tab_notifications") },
    { key: "ai", label: t("tab_ai") },
    { key: "security", label: t("self_service_security") },
    { key: "backup", label: t("export_settings") },
    { key: "audit", label: t("audit_logs_title") },
  ] as const;

  const toggleSettingsAccess = (section: typeof settingsSections[number]["key"], roleKey: typeof settingsRoles[number]) => {
    const access = { ...(general.value.settingsAccess || defaultGeneral.settingsAccess) } as Record<string, string[]>;
    const current = new Set(access[section] || []);
    if (current.has(roleKey)) {
      current.delete(roleKey);
    } else {
      current.add(roleKey);
    }
    access[section] = Array.from(current);
    general.setValue({ ...general.value, settingsAccess: access });
  };

  const exportSettings = () => {
    const payload: ApiSettings = {
      "company_settings": company.value,
      "attendance_settings": attendance.value,
      "leave_settings": leave.value,
      "notification_settings": notifications.value,
      "general_settings": general.value,
      "ai_settings": {
        ...ai.value,
        access_roles: general.value.settingsAccess?.ai || ai.value.access_roles,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ApiSettings;
      if (payload["company_settings"]) company.setValue({ ...defaultCompany, ...payload["company_settings"] });
      if (payload["attendance_settings"]) attendance.setValue({ ...defaultAttendance, ...payload["attendance_settings"] });
      if (payload["leave_settings"]) leave.setValue({ ...defaultLeave, ...payload["leave_settings"] });
      if (payload["notification_settings"]) notifications.setValue({ ...defaultNotification, ...payload["notification_settings"] });
      if (payload["general_settings"]) general.setValue({ ...defaultGeneral, ...payload["general_settings"] });
      if (payload["ai_settings"]) ai.setValue({ ...ai.value, ...payload["ai_settings"] });
      toast({ title: t("import_success") });
    } catch {
      toast({ title: t("import_failed"), variant: "destructive" });
    }
  };

  const resetAll = () => {
    company.reset();
    attendance.reset();
    leave.reset();
    notifications.reset();
    general.reset();
    ai.reset();
    toast({ title: t("reset_done") });
  };

  // Compile full props bag to inject into isolated tabs to retain functionality
  const tabProps = {
    t, tSafe, company, attendance, leave, notifications, general, ai, handleSave, setFormErrors, formErrors,
    canViewCompany, canViewGeneral, canViewAttendance, canViewLeaves, canViewNotifications, canViewAI,
    canManageSecurity, canViewBackup, canViewAuditTab, handleLogoChange, handleLogoRemove, addHoliday,
    updateHoliday, removeHoliday, toggleWorkDay, toggleWeekendDay, settingsRoles, settingsSections,
    toggleSettingsAccess, exportSettings, importSettings, resetAll, importInputRef, handlePasswordSubmit,
    currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    passwordSaving, passwordError, mfaSetupData, mfaCode, setMfaCode, mfaLoading, mfaSwitchLoading,
    handleMfaStart, handleMfaVerify, handleMfaDisable, validateEmail, validatePhone, validateTimeRange,
    validateQuietHours, validateNumberRange, theme, setTheme, i18n, isArabic, handleRegisterSecurityKey,
    registeringKey, auditLogsQuery, recommendedSecurityDefaults, role, permissions, canAdmin, isLoading,
    sanitizeTemplateValue, backupHistory: [], user, setMfaSwitchLoading, settingsAccess
  };

  const ActiveComponent = 
    activeTab === "company" ? CompanyTab :
    activeTab === "general" ? GeneralTab :
    activeTab === "attendance" ? AttendanceTab :
    activeTab === "leaves" ? LeavesTab :
    activeTab === "notifications" ? NotificationsTab :
    activeTab === "ai" ? AITab :
    activeTab === "security" ? SecurityTab :
    activeTab === "backup" ? BackupTab :
    activeTab === "audit" ? AuditTab : CompanyTab;
  const activeTabLabel =
    availableTabs.find((tab) => tab.key === activeTab)?.label || t("settings_title");
  const roleLabel = t(`role_${role}` as never, { defaultValue: role || "-" });
  const languageLabel =
    general.value.language === "ar"
      ? (isArabic ? "العربية" : "Arabic")
      : (isArabic ? "الإنجليزية" : "English");
  const themeLabel = general.value.theme || theme;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <PageHero
        title={t("settings_title")}
        subtitle={t("settings_subtitle")}
        metrics={[
          { label: t("categories"), value: availableTabs.filter((tab) => tab.allowed).length, tone: "primary" },
          { label: t("notifications_title"), value: notifications.value.notificationsEnabled ? t("enabled") : t("disabled"), tone: "default" },
        ]}
        actions={
          isLoading ? (
            <span className="text-sm font-medium animate-pulse text-muted-foreground">
              {t("loading")}
            </span>
          ) : undefined
        }
        aside={
          <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("active_session")}
                </p>
                <p className="text-xl font-black tracking-tight text-foreground">
                  {user?.username || user?.email || "-"}
                </p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("categories")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{activeTabLabel}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("theme")}
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-foreground">{themeLabel}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("language")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{languageLabel}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("notifications_title")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {notifications.value.notificationsEnabled ? t("enabled") : t("disabled")}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vertical Left Nav Layout (Pro-Max Approach) */}
        <aside className="w-full shrink-0 lg:w-64 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden rounded-[28px] bg-card/90 border border-border/60 shadow-sm">
            <CardContent className="space-y-6 p-4">
              <div className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("categories")}
              </div>
              <nav className="flex flex-col gap-1">
                {availableTabs.filter((tab) => tab.allowed).map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setSearchParams({ tab: tab.key });
                      }}
                      className={`relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-300 ${
                        active
                          ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                          : "border-transparent text-muted-foreground hover:border-primary/15 hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <tab.icon className={`h-4 w-4 ${active ? "scale-110 opacity-100" : "opacity-70"}`} />
                      {tab.label}
                      {active && (
                        <div className={`absolute ${isArabic ? "right-0" : "left-0"} hidden h-5 w-1 rounded-r-md bg-primary lg:block`} />
                      )}
                    </button>
                  );
                })}
              </nav>

              {canViewBackup && (
                <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
                  <div className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("quick_actions_title")}
                  </div>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => importSettings(e.target.files?.[0])}
                  />
                  <Button variant="ghost" onClick={exportSettings} className="w-full justify-start text-muted-foreground">
                    <Download className="mr-2 w-4 h-4" /> {t("export_settings")}
                  </Button>
                  <Button variant="ghost" onClick={() => importInputRef.current?.click()} className="w-full justify-start text-muted-foreground">
                    <Upload className="mr-2 w-4 h-4" /> {t("import_settings")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          <Card className="bg-card/90 border border-border/60 shadow-sm min-h-[500px] overflow-hidden rounded-2xl">
            <div className="p-6 sm:p-8">
              <ActiveComponent {...tabProps} />
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}




import { useEffect, useMemo, useRef, useState } from "react";
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
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { useTheme } from "@/shared/components/theme-provider";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/components/AuthProvider";
import type { SettingsPayload } from "@/types/api";
import { useAuditLogsQuery } from "@/features/audit-logs/hooks/useAuditLogs";
import { EmptyState } from "@/shared/components/EmptyState";
import { changePassword } from "@/features/auth/api/password";
import { useSearchParams } from "react-router-dom";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const isArabic = i18n.language.startsWith("ar");
  const tSafe = (key: string, ar: string) => (isArabic ? ar : t(key));
  const sanitizeTemplateValue = (value?: string) =>
    (value || "").replace(/\{\{\s*employee\s*\}\}/g, "").replace(/\{employee\}/g, "").trim();
  const sanitizeTemplates = (templates?: typeof notifications.value.templates) => {
    if (!templates) return templates;
    const next = { ...templates };
    (Object.keys(next) as Array<keyof typeof next>).forEach((key) => {
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

  const defaultCompany = useMemo(
    () => ({
      name: t("company_name_example"),
      nameEn: t("company_name_en_example"),
      email: "info@example.com",
      phone: "+966 12 345 6789",
      address: t("company_address_example"),
      logoDataUrl: "",
      logos: [] as string[],
    }),
    [t],
  );

  const defaultAttendance = {
    workStartTime: "08:00",
    workEndTime: "17:00",
    lateThreshold: "15",
    earlyLeaveThreshold: "15",
    enableGeolocation: true,
    enableFaceRecognition: false,
  };

  const defaultLeave = {
    annualLeaveDefault: "21",
    sickLeaveDefault: "14",
    emergencyLeaveDefault: "5",
    requireApproval: true,
    approvalLevels: "2",
    minAdvanceNotice: "3",
  };

  const defaultNotification = useMemo(
    () => ({
      notificationsEnabled: true,
      emailNotifications: true,
      smsNotifications: false,
      leaveRequestNotify: true,
      attendanceAlerts: true,
      weeklyReports: true,
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
      language: "ar",
      timezone: "Asia/Riyadh",
      timeFormat: "24" as const,
      weekStart: "sun" as const,
      workWeekDays: ["sun", "mon", "tue", "wed", "thu"],
      weekendDays: ["fri", "sat"],
      holidayCalendar: [] as { date: string; name: string; type?: string }[],
      settingsAccess: {
        company: ["system_admin", "admin", "hr_manager"],
        general: ["system_admin", "admin", "hr_manager"],
        attendance: ["system_admin", "admin", "hr_manager"],
        leaves: ["system_admin", "admin", "hr_manager"],
        notifications: ["system_admin", "admin", "hr_manager", "supervisor"],
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
    [theme],
  );

  const company = useSettings("company-settings", defaultCompany);
  const attendance = useSettings("attendance-settings", defaultAttendance);
  const leave = useSettings("leave-settings", defaultLeave);
  const notifications = useSettings("notification-settings", defaultNotification);
  const general = useSettings("general-settings", defaultGeneral);
  const auditLogsQuery = useAuditLogsQuery({ model_name: "Settings" });

  const isLoading =
    company.loading ||
    attendance.loading ||
    leave.loading ||
    notifications.loading ||
    general.loading;

  useEffect(() => {
    if (general.value.theme) {
      setTheme(general.value.theme as string);
    }
  }, [general.value.theme, setTheme]);

  useEffect(() => {
    if (general.value.language && i18n.language !== general.value.language) {
      i18n.changeLanguage(general.value.language).catch(() => {});
    }
  }, [general.value.language, i18n]);

  const role = String(user?.role || "");
  const mustChangePassword = Boolean(user?.must_change_password);
  const canAdmin = ["system_admin", "admin", "hr_manager"].includes(role);
  const permissions = new Set(user?.permissions && user.permissions.length ? user.permissions : []);
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
  const canManageSecurity = canSettings && allowAccess("security");
  const canViewSecurity = canManageSecurity || mustChangePassword;
  const canViewBackup = canSettings && allowAccess("backup");
  const canViewAuditTab = canViewAudit && allowAccess("audit");
  const tabParam = searchParams.get("tab") || "";
  const availableTabs = [
    { key: "company", allowed: canViewCompany },
    { key: "general", allowed: canViewGeneral },
    { key: "attendance", allowed: canViewAttendance },
    { key: "leaves", allowed: canViewLeaves },
    { key: "notifications", allowed: canViewNotifications },
    { key: "security", allowed: canViewSecurity },
    { key: "backup", allowed: canViewBackup },
    { key: "audit", allowed: canViewAuditTab },
  ];
  const resolveTab = useMemo(() => {
    if (availableTabs.some((tab) => tab.key === tabParam && tab.allowed)) {
      return tabParam;
    }
    const firstAllowed = availableTabs.find((tab) => tab.allowed);
    return firstAllowed?.key || "company";
  }, [tabParam, canViewCompany, canViewGeneral, canViewAttendance, canViewLeaves, canViewNotifications, canViewSecurity, canViewBackup, canViewAuditTab]);
  const [activeTab, setActiveTab] = useState(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab);
  }, [resolveTab]);

  const validateEmail = (value: string) =>
    !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePhone = (value: string) =>
    !value || /^[\d+\-\s()]{7,}$/.test(value);
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

  const handleSave = async (
    section: "company" | "general" | "attendance" | "leaves" | "notifications" | "security",
  ) => {
    setFormErrors({});
    if (!canViewCompany && section === "company") {
      toast({ title: t("not_authorized_title"), description: t("not_authorized_desc") });
      return;
    }
    if (!canViewGeneral && section === "general") {
      toast({ title: t("not_authorized_title"), description: t("not_authorized_desc") });
      return;
    }
    if (section === "attendance" && !canViewAttendance) {
      toast({ title: t("not_authorized_title"), description: t("not_authorized_desc") });
      return;
    }
    if (section === "leaves" && !canViewLeaves) {
      toast({ title: t("not_authorized_title"), description: t("not_authorized_desc") });
      return;
    }
    if (section === "notifications" && !canViewNotifications) {
      toast({ title: t("not_authorized_title"), description: t("not_authorized_desc") });
      return;
    }
    if (section === "security" && !canManageSecurity) {
      toast({ title: t("not_authorized_title"), description: t("not_authorized_desc") });
      return;
    }
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
        toast({
          title: t("saved"),
          description: t("settings_saved_desc", { section: t("company_title") }),
        });
      }
      return;
    }
    if (section === "general") {
      if (!general.value.timezone) {
        setFormErrors({ timezone: t("timezone_required") });
        return;
      }
      if (!general.value.workWeekDays || general.value.workWeekDays.length === 0) {
        setFormErrors({ work_week: t("generic_error") });
        return;
      }
      const ok = await general.save();
      if (ok) {
        toast({
          title: t("saved"),
          description: t("settings_saved_desc", { section: t("general_title") }),
        });
      }
      return;
    }
    if (section === "attendance") {
      if (!validateTimeRange(attendance.value.workStartTime, attendance.value.workEndTime)) {
        setFormErrors({ work_time: t("work_time_invalid") });
        return;
      }
      if (!validateNumberRange(attendance.value.lateThreshold, 0, 240)) {
        setFormErrors({ late_threshold: t("invalid_phone") });
        return;
      }
      if (!validateNumberRange(attendance.value.earlyLeaveThreshold, 0, 240)) {
        setFormErrors({ early_threshold: t("invalid_phone") });
        return;
      }
      const ok = await attendance.save();
      if (ok) {
        toast({
          title: t("saved"),
          description: t("settings_saved_desc", { section: t("attendance_settings_title") }),
        });
      }
      return;
    }
    if (section === "leaves") {
      if (!validateNumberRange(leave.value.annualLeaveDefault, 0, 365)) {
        setFormErrors({ annual_leave: t("invalid_phone") });
        return;
      }
      const ok = await leave.save();
      if (ok) {
        toast({
          title: t("saved"),
          description: t("settings_saved_desc", { section: t("leave_title") }),
        });
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
        toast({
          title: t("saved"),
          description: t("settings_saved_desc", { section: t("notifications_title") }),
        });
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
        toast({
          title: t("saved"),
          description: t("settings_saved_desc", { section: t("self_service_security") }),
        });
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
    company.setValue({
      ...company.value,
      logoDataUrl,
      logos: next,
    });
  };

  const addHoliday = () => {
    const holidays = general.value.holidayCalendar ?? [];
    general.setValue({
      ...general.value,
      holidayCalendar: [
        ...holidays,
        { date: "", name: "", type: "holiday" },
      ],
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
    const days = new Set(general.value.workWeekDays ?? []);
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    general.setValue({ ...general.value, workWeekDays: Array.from(days) });
  };

  const toggleWeekendDay = (day: string) => {
    const days = new Set(general.value.weekendDays ?? []);
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    general.setValue({ ...general.value, weekendDays: Array.from(days) });
  };

  const settingsRoles = ["system_admin", "admin", "hr_manager", "supervisor", "employee"] as const;
  const settingsSections = [
    { key: "company", label: t("tab_company") },
    { key: "general", label: t("tab_general") },
    { key: "attendance", label: t("tab_attendance") },
    { key: "leaves", label: t("tab_leaves") },
    { key: "notifications", label: t("tab_notifications") },
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

  const backupKey = "settings_backup_history";
  const [backupHistory, setBackupHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem(backupKey);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const exportSettings = () => {
    const payload: SettingsPayload = {
      "company-settings": company.value,
      "attendance-settings": attendance.value,
      "leave-settings": leave.value,
      "notification-settings": notifications.value,
      "general-settings": general.value,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings.json";
    a.click();
    URL.revokeObjectURL(url);
    const nextHistory = [new Date().toISOString(), ...backupHistory].slice(0, 10);
    setBackupHistory(nextHistory);
    localStorage.setItem(backupKey, JSON.stringify(nextHistory));
  };

  const importSettings = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as SettingsPayload;
      if (payload["company-settings"]) {
        company.setValue({ ...defaultCompany, ...payload["company-settings"] });
      }
      if (payload["attendance-settings"]) {
        attendance.setValue({ ...defaultAttendance, ...payload["attendance-settings"] });
      }
      if (payload["leave-settings"]) {
        leave.setValue({ ...defaultLeave, ...payload["leave-settings"] });
      }
      if (payload["notification-settings"]) {
        notifications.setValue({
          ...defaultNotification,
          ...payload["notification-settings"],
        });
      }
      if (payload["general-settings"]) {
        general.setValue({ ...defaultGeneral, ...payload["general-settings"] });
      }
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
    toast({ title: t("reset_done") });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings_title")}</h1>
        <p className="text-muted-foreground">{t("settings_subtitle")}</p>
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportSettings} className="gap-2" disabled={!canViewBackup}>
          <Download className="w-4 h-4" />
          {t("export_settings")}
        </Button>
        <Button
          variant="outline"
          onClick={() => importInputRef.current?.click()}
          className="gap-2"
          disabled={!canViewBackup}
        >
          <Upload className="w-4 h-4" />
          {t("import_settings")}
        </Button>
        <Button variant="outline" onClick={resetAll} className="gap-2" disabled={!canViewBackup}>
          <RotateCcw className="w-4 h-4" />
          {t("reset_defaults")}
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => importSettings(e.target.files?.[0])}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 flex flex-wrap">
          <TabsTrigger value="company" className="gap-2" disabled={!canViewCompany}>
            <Building className="w-4 h-4" />
            {t("tab_company")}
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2" disabled={!canViewGeneral}>
            <Monitor className="w-4 h-4" />
            {t("tab_general")}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2" disabled={!canViewAttendance}>
            <Clock className="w-4 h-4" />
            {t("tab_attendance")}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2" disabled={!canViewLeaves}>
            <Calendar className="w-4 h-4" />
            {t("tab_leaves")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" disabled={!canViewNotifications}>
            <Bell className="w-4 h-4" />
            {t("tab_notifications")}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2" disabled={!canViewSecurity}>
            <ShieldCheck className="w-4 h-4" />
            {t("self_service_security")}
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2" disabled={!canViewBackup}>
            <Download className="w-4 h-4" />
            {tSafe("export_settings", "تصدير الإعدادات")}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2" disabled={!canViewAuditTab}>
            <ClipboardList className="w-4 h-4" />
            {t("audit_logs_title")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          {!canViewCompany ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                {t("company_title")}
              </CardTitle>
              <CardDescription>{t("company_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {company.value.logoDataUrl ? (
                    <img
                      src={company.value.logoDataUrl}
                      alt="Logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("no_logo")}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {t("upload_logo")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleLogoChange(e.target.files || undefined)}
                  />
                </div>
              </div>
              {(company.value.logos || []).length > 0 && (
                <div className="space-y-2">
                  <Label>{t("documents")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(company.value.logos || []).map((logo, index) => (
                      <div key={`${logo}-${index}`} className="border rounded-lg p-2 space-y-2">
                        <div className="h-16 w-full rounded bg-muted/30 overflow-hidden">
                          <img src={logo} alt="logo" className="h-full w-full object-cover" />
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleLogoRemove(index)}>
                          {t("delete")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("company_name_ar")}</Label>
                  <Input
                    value={company.value.name}
                    onChange={(e) =>
                      company.setValue({
                        ...company.value,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("company_name_en")}</Label>
                  <Input
                    value={company.value.nameEn}
                    onChange={(e) =>
                      company.setValue({
                        ...company.value,
                        nameEn: e.target.value,
                      })
                    }
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("company_email")}</Label>
                  <Input
                    type="email"
                    value={company.value.email}
                    onChange={(e) =>
                      company.setValue({
                        ...company.value,
                        email: e.target.value,
                      })
                    }
                    dir="ltr"
                  />
                  {formErrors.company_email && (
                    <p className="text-xs text-destructive">{formErrors.company_email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("company_phone")}</Label>
                  <Input
                    value={company.value.phone}
                    onChange={(e) =>
                      company.setValue({
                        ...company.value,
                        phone: e.target.value,
                      })
                    }
                    dir="ltr"
                  />
                  {formErrors.company_phone && (
                    <p className="text-xs text-destructive">{formErrors.company_phone}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("company_address")}</Label>
                <Input
                  value={company.value.address}
                  onChange={(e) =>
                    company.setValue({
                      ...company.value,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              {company.error && <p className="text-xs text-destructive">{company.error}</p>}
              <Button
                onClick={() => handleSave("company")}
                disabled={company.saving || isLoading}
              >
                <Save className="w-4 h-4 ml-2" />
                {company.saving ? t("saving") : t("save_changes")}
              </Button>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="general">
          {!canViewGeneral ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
          <Card className="bg-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                {t("general_title")}
              </CardTitle>
              <CardDescription>{t("general_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("theme_label")}</Label>
                  <Select
                    value={general.value.theme}
                    onValueChange={(value) =>
                      general.setValue({ ...general.value, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_theme")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("light")}</SelectItem>
                      <SelectItem value="dark">{t("dark")}</SelectItem>
                      <SelectItem value="system">{t("system")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("language_label")}</Label>
                  <Select
                    value={general.value.language}
                    onValueChange={(value) =>
                      general.setValue({
                        ...general.value,
                        language: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_language")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{t("arabic")}</SelectItem>
                      <SelectItem value="en">{t("english")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("timezone_label")}</Label>
                <Select
                  value={general.value.timezone}
                  onValueChange={(value) =>
                    general.setValue({ ...general.value, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_timezone")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">{t("timezone_riyadh")}</SelectItem>
                    <SelectItem value="Asia/Dubai">{t("timezone_dubai")}</SelectItem>
                    <SelectItem value="Africa/Cairo">{t("timezone_cairo")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("time_format")}</Label>
                  <Select
                    value={general.value.timeFormat}
                    onValueChange={(value) =>
                      general.setValue({
                        ...general.value,
                        timeFormat: value as "12" | "24",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_time_format")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12h</SelectItem>
                      <SelectItem value="24">24h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("week_start")}</Label>
                  <Select
                    value={general.value.weekStart}
                    onValueChange={(value) =>
                      general.setValue({
                        ...general.value,
                        weekStart: value as "sat" | "sun" | "mon",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_week_start")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sat">{t("day_sat")}</SelectItem>
                      <SelectItem value="sun">{t("day_sun")}</SelectItem>
                      <SelectItem value="mon">{t("day_mon")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">{t("work_week")}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("work_days")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {["sat", "sun", "mon", "tue", "wed", "thu", "fri"].map((day) => (
                        <Button
                          key={`work-${day}`}
                          type="button"
                          size="sm"
                          variant={(general.value.workWeekDays || []).includes(day) ? "default" : "outline"}
                          onClick={() => toggleWorkDay(day)}
                        >
                          {t(`day_${day}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("weekend_days")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {["sat", "sun", "mon", "tue", "wed", "thu", "fri"].map((day) => (
                        <Button
                          key={`weekend-${day}`}
                          type="button"
                          size="sm"
                          variant={(general.value.weekendDays || []).includes(day) ? "default" : "outline"}
                          onClick={() => toggleWeekendDay(day)}
                        >
                          {t(`day_${day}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                {formErrors.work_week && (
                  <p className="text-xs text-destructive">{t("generic_error")}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("holiday_calendar")}</p>
                    <p className="text-sm text-muted-foreground">{t("holiday_calendar_desc")}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={addHoliday}>
                    {t("add")}
                  </Button>
                </div>
                {(general.value.holidayCalendar || []).length ? (
                  <div className="space-y-2">
                    {(general.value.holidayCalendar || []).map((holiday, index) => (
                      <div key={`${holiday.date}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          type="date"
                          value={holiday.date}
                          onChange={(e) => updateHoliday(index, "date", e.target.value)}
                        />
                        <Input
                          value={holiday.name}
                          placeholder={t("title")}
                          onChange={(e) => updateHoliday(index, "name", e.target.value)}
                        />
                        <Select
                          value={holiday.type || "holiday"}
                          onValueChange={(value) => updateHoliday(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="holiday">{t("holiday_type_holiday")}</SelectItem>
                            <SelectItem value="event">{t("holiday_type_event")}</SelectItem>
                            <SelectItem value="exception">{t("holiday_type_exception")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={() => removeHoliday(index)}>
                          {t("delete")}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("no_data")}</p>
                )}
              </div>

              {formErrors.timezone && (
                <p className="text-xs text-destructive">{formErrors.timezone}</p>
              )}
              {general.error && <p className="text-xs text-destructive">{general.error}</p>}
              <Button onClick={() => handleSave("general")} disabled={general.saving || isLoading}>
                <Save className="w-4 h-4 ml-2" />
                {general.saving ? t("saving") : t("save_changes")}
              </Button>
            </CardContent>
          </Card>
          )}
        </TabsContent>
        <TabsContent value="attendance">
          {!canViewAttendance ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t("attendance_settings_title")}
                </CardTitle>
                <CardDescription>{t("attendance_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("work_start_time")}</Label>
                    <Input
                      type="time"
                      value={attendance.value.workStartTime}
                      onChange={(e) =>
                        attendance.setValue({
                          ...attendance.value,
                          workStartTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("work_end_time")}</Label>
                    <Input
                      type="time"
                      value={attendance.value.workEndTime}
                      onChange={(e) =>
                        attendance.setValue({
                          ...attendance.value,
                          workEndTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("late_threshold_minutes")}</Label>
                  <Input
                    type="number"
                    value={attendance.value.lateThreshold}
                    onChange={(e) =>
                      attendance.setValue({
                        ...attendance.value,
                        lateThreshold: e.target.value,
                      })
                    }
                  />
                  {formErrors.late_threshold && (
                    <p className="text-xs text-destructive">{formErrors.late_threshold}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("early_leave_threshold_minutes")}</Label>
                  <Input
                    type="number"
                    value={attendance.value.earlyLeaveThreshold}
                    onChange={(e) =>
                      attendance.setValue({
                        ...attendance.value,
                        earlyLeaveThreshold: e.target.value,
                      })
                    }
                  />
                  {formErrors.early_threshold && (
                    <p className="text-xs text-destructive">{formErrors.early_threshold}</p>
                  )}
                </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{t("advanced_options")}</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("enable_geolocation_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("enable_geolocation_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={attendance.value.enableGeolocation}
                      onCheckedChange={(checked) =>
                        attendance.setValue({
                          ...attendance.value,
                          enableGeolocation: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("enable_face_recognition_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("enable_face_recognition_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={attendance.value.enableFaceRecognition}
                      onCheckedChange={(checked) =>
                        attendance.setValue({
                          ...attendance.value,
                          enableFaceRecognition: checked,
                        })
                      }
                    />
                  </div>
                </div>

                {formErrors.work_time && (
                  <p className="text-xs text-destructive">{formErrors.work_time}</p>
                )}
                {attendance.error && (
                  <p className="text-xs text-destructive">{attendance.error}</p>
                )}
                <Button
                  onClick={() => handleSave("attendance")}
                  disabled={attendance.saving || isLoading}
                >
                  <Save className="w-4 h-4 ml-2" />
                  {attendance.saving ? t("saving") : t("save_changes")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaves">
          {!canViewLeaves ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t("leave_title")}
                </CardTitle>
                <CardDescription>{t("leave_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("annual_leave_days")}</Label>
                    <Input
                      type="number"
                      value={leave.value.annualLeaveDefault}
                      onChange={(e) =>
                        leave.setValue({
                          ...leave.value,
                          annualLeaveDefault: e.target.value,
                        })
                      }
                    />
                    {formErrors.annual_leave && (
                      <p className="text-xs text-destructive">{formErrors.annual_leave}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("sick_leave_days")}</Label>
                    <Input
                      type="number"
                      value={leave.value.sickLeaveDefault}
                      onChange={(e) =>
                        leave.setValue({
                          ...leave.value,
                          sickLeaveDefault: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("emergency_leave_days")}</Label>
                    <Input
                      type="number"
                      value={leave.value.emergencyLeaveDefault}
                      onChange={(e) =>
                        leave.setValue({
                          ...leave.value,
                          emergencyLeaveDefault: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("min_advance_notice_days")}</Label>
                  <Input
                    type="number"
                    value={leave.value.minAdvanceNotice}
                    onChange={(e) =>
                      leave.setValue({
                        ...leave.value,
                        minAdvanceNotice: e.target.value,
                      })
                    }
                    className="w-48"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("require_leave_approval_title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("require_leave_approval_desc")}
                    </p>
                  </div>
                  <Switch
                    checked={leave.value.requireApproval}
                    onCheckedChange={(checked) =>
                      leave.setValue({
                        ...leave.value,
                        requireApproval: checked,
                      })
                    }
                  />
                </div>

                {leave.value.requireApproval && (
                  <div className="space-y-2">
                    <Label>{t("approval_levels")}</Label>
                    <Select
                      value={leave.value.approvalLevels}
                      onValueChange={(value) =>
                        leave.setValue({
                          ...leave.value,
                          approvalLevels: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t("approval_level_1")}</SelectItem>
                        <SelectItem value="2">{t("approval_level_2")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {leave.error && <p className="text-xs text-destructive">{leave.error}</p>}
                <Button onClick={() => handleSave("leaves")} disabled={leave.saving || isLoading}>
                  <Save className="w-4 h-4 ml-2" />
                  {leave.saving ? t("saving") : t("save_changes")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications">
          {!canViewNotifications ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  {t("notifications_title")}
                </CardTitle>
                <CardDescription>{t("notifications_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">{t("notification_channels_title")}</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("email_notifications_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("email_notifications_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.value.emailNotifications}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("sms_notifications_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("sms_notifications_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.value.smsNotifications}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          smsNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{t("notification_types_title")}</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("leave_request_notify_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("leave_request_notify_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.value.leaveRequestNotify}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          leaveRequestNotify: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("attendance_alerts_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("attendance_alerts_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.value.attendanceAlerts}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          attendanceAlerts: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("weekly_reports_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("weekly_reports_desc")}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.value.weeklyReports}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          weeklyReports: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("digest_frequency")}</Label>
                    <Select
                      value={notifications.value.digestFrequency}
                      onValueChange={(value) =>
                        notifications.setValue({
                          ...notifications.value,
                          digestFrequency: value as "instant" | "daily" | "weekly",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_frequency")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">{t("frequency_instant")}</SelectItem>
                        <SelectItem value="daily">{t("frequency_daily")}</SelectItem>
                        <SelectItem value="weekly">{t("frequency_weekly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("notifications_enabled")}</Label>
                    <Switch
                      checked={Boolean(notifications.value.notificationsEnabled)}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          notificationsEnabled: checked,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label>{tSafe("digest_time", "وقت الملخّص")}</Label>
                    <Input
                      type="time"
                      value={notifications.value.digestTime}
                      onChange={(e) =>
                        notifications.setValue({
                          ...notifications.value,
                          digestTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tSafe("weekly_digest_day", "يوم الملخّص الأسبوعي")}</Label>
                    <Select
                      value={notifications.value.weeklyDigestDay}
                      onValueChange={(value) =>
                        notifications.setValue({
                          ...notifications.value,
                          weeklyDigestDay: value as "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sat">{t("day_sat")}</SelectItem>
                        <SelectItem value="sun">{t("day_sun")}</SelectItem>
                        <SelectItem value="mon">{t("day_mon")}</SelectItem>
                        <SelectItem value="tue">{t("day_tue")}</SelectItem>
                        <SelectItem value="wed">{t("day_wed")}</SelectItem>
                        <SelectItem value="thu">{t("day_thu")}</SelectItem>
                        <SelectItem value="fri">{t("day_fri")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("quiet_hours_start")}</Label>
                    <Input
                      type="time"
                      value={notifications.value.quietHoursStart}
                      onChange={(e) =>
                        notifications.setValue({
                          ...notifications.value,
                          quietHoursStart: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("quiet_hours_end")}</Label>
                    <Input
                      type="time"
                      value={notifications.value.quietHoursEnd}
                      onChange={(e) =>
                        notifications.setValue({
                          ...notifications.value,
                          quietHoursEnd: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tSafe("quiet_hours_enabled", "تفعيل ساعات الصمت")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("quiet_hours_desc", "إيقاف البريد/الرسائل خارج الدوام")}</p>
                  </div>
                  <Switch
                    checked={Boolean(notifications.value.quietHoursEnabled)}
                    onCheckedChange={(checked) =>
                      notifications.setValue({
                        ...notifications.value,
                        quietHoursEnabled: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{tSafe("notification_templates", "قوالب الإشعارات")}</h4>
                  {[
                    { key: "leaveRequest", label: t("leave_request_notify_title") },
                    { key: "leaveApproved", label: t("approved") },
                    { key: "leaveRejected", label: t("rejected") },
                    { key: "attendanceAlert", label: t("attendance_alerts_title") },
                    { key: "weeklyReport", label: t("weekly_reports_title") },
                  ].map((template) => (
                    <div key={template.key} className="rounded-lg border p-3 space-y-3">
                      <p className="font-medium">{template.label}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{tSafe("email_subject", "عنوان البريد")}</Label>
                          <Input
                            value={sanitizeTemplateValue(
                              notifications.value.templates?.[template.key as keyof NonNullable<typeof notifications.value.templates>]?.emailSubject,
                            )}
                            onChange={(e) =>
                              notifications.setValue({
                                ...notifications.value,
                                templates: {
                                  ...notifications.value.templates,
                                  [template.key]: {
                                    ...(notifications.value.templates?.[template.key as keyof NonNullable<typeof notifications.value.templates>] || {}),
                                    emailSubject: e.target.value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{tSafe("sms_body", "نص الرسالة")}</Label>
                          <Input
                            value={sanitizeTemplateValue(
                              notifications.value.templates?.[template.key as keyof NonNullable<typeof notifications.value.templates>]?.smsBody,
                            )}
                            onChange={(e) =>
                              notifications.setValue({
                                ...notifications.value,
                                templates: {
                                  ...notifications.value.templates,
                                  [template.key]: {
                                    ...(notifications.value.templates?.[template.key as keyof NonNullable<typeof notifications.value.templates>] || {}),
                                    smsBody: e.target.value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{tSafe("email_body", "محتوى البريد")}</Label>
                        <Textarea
                          value={sanitizeTemplateValue(
                            notifications.value.templates?.[template.key as keyof NonNullable<typeof notifications.value.templates>]?.emailBody,
                          )}
                          onChange={(e) =>
                            notifications.setValue({
                              ...notifications.value,
                              templates: {
                                ...notifications.value.templates,
                                [template.key]: {
                                  ...(notifications.value.templates?.[template.key as keyof NonNullable<typeof notifications.value.templates>] || {}),
                                  emailBody: e.target.value,
                                },
                              },
                            })
                          }
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">{tSafe("template_hint_no_var", "لا يستخدم القالب متغيرات.")}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {notifications.error && (
                  <p className="text-xs text-destructive">{notifications.error}</p>
                )}
                {formErrors.quiet_hours && (
                  <p className="text-xs text-destructive">{formErrors.quiet_hours}</p>
                )}
                <Button
                  onClick={() => handleSave("notifications")}
                  disabled={notifications.saving || isLoading}
                >
                  <Save className="w-4 h-4 ml-2" />
                  {notifications.saving ? t("saving") : t("save_changes")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security">
          {!canViewSecurity ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  {t("self_service_security")}
                </CardTitle>
                <CardDescription>{t("security_settings_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tSafe("mfa_enabled", "تفعيل MFA")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("mfa_enabled_desc", "السماح للمستخدمين بتفعيل MFA")}</p>
                  </div>
                  <Switch
                    disabled={!canManageSecurity}
                    checked={Boolean(general.value.security?.mfaEnabled)}
                    onCheckedChange={(checked) =>
                      general.setValue({
                        ...general.value,
                        security: { ...general.value.security, mfaEnabled: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tSafe("mfa_required", "إلزام MFA")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("mfa_required_desc", "فرض MFA على جميع المستخدمين")}</p>
                  </div>
                  <Switch
                    disabled={!canManageSecurity}
                    checked={Boolean(general.value.security?.mfaRequired)}
                    onCheckedChange={(checked) =>
                      general.setValue({
                        ...general.value,
                        security: { ...general.value.security, mfaRequired: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tSafe("password_min_length", "الحد الأدنى لطول كلمة المرور")}</Label>
                    <Input
                      type="number"
                      disabled={!canManageSecurity}
                      value={general.value.security?.passwordMinLength ?? ""}
                      onChange={(e) =>
                        general.setValue({
                          ...general.value,
                          security: {
                            ...general.value.security,
                            passwordMinLength: Number(e.target.value || 0),
                          },
                        })
                      }
                    />
                    {formErrors.security_min_length && (
                      <p className="text-xs text-destructive">{formErrors.security_min_length}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{tSafe("password_expiry_days", "انتهاء كلمة المرور (أيام)")}</Label>
                    <Input
                      type="number"
                      disabled={!canManageSecurity}
                      value={general.value.security?.passwordExpiryDays ?? ""}
                      onChange={(e) =>
                        general.setValue({
                          ...general.value,
                          security: {
                            ...general.value.security,
                            passwordExpiryDays: Number(e.target.value || 0),
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{tSafe("password_require_upper", "حرف كبير مطلوب")}</p>
                      <p className="text-sm text-muted-foreground">{tSafe("password_require_upper_desc", "حرف واحد كبير على الأقل")}</p>
                    </div>
                    <Switch
                      disabled={!canManageSecurity}
                      checked={Boolean(general.value.security?.passwordRequireUpper)}
                      onCheckedChange={(checked) =>
                        general.setValue({
                          ...general.value,
                          security: {
                            ...general.value.security,
                            passwordRequireUpper: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{tSafe("password_require_number", "رقم مطلوب")}</p>
                      <p className="text-sm text-muted-foreground">{tSafe("password_require_number_desc", "رقم واحد على الأقل")}</p>
                    </div>
                    <Switch
                      disabled={!canManageSecurity}
                      checked={Boolean(general.value.security?.passwordRequireNumber)}
                      onCheckedChange={(checked) =>
                        general.setValue({
                          ...general.value,
                          security: {
                            ...general.value.security,
                            passwordRequireNumber: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{tSafe("password_require_symbol", "رمز مطلوب")}</p>
                      <p className="text-sm text-muted-foreground">{tSafe("password_require_symbol_desc", "رمز خاص واحد على الأقل")}</p>
                    </div>
                    <Switch
                      disabled={!canManageSecurity}
                      checked={Boolean(general.value.security?.passwordRequireSymbol)}
                      onCheckedChange={(checked) =>
                        general.setValue({
                          ...general.value,
                          security: {
                            ...general.value.security,
                            passwordRequireSymbol: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{t("change_password")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("change_password_desc", "حدّث كلمة المرور الخاصة بك")}</p>
                  </div>
                  <form onSubmit={handlePasswordSubmit} className="grid gap-4 sm:grid-cols-2">
                    {passwordError && (
                      <p className="text-sm text-destructive sm:col-span-2">{passwordError}</p>
                    )}
                    <div className="space-y-2">
                      <Label>{t("current_password")}</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("new_password")}</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>{t("confirm_password")}</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="submit" disabled={passwordSaving}>
                        {passwordSaving ? t("saving") : t("save_changes")}
                      </Button>
                    </div>
                  </form>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{tSafe("settings_permissions", "صلاحيات الإعدادات")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("settings_permissions_desc", "تحديد من يمكنه الدخول لكل تبويب")}</p>
                  </div>
                  <div className="space-y-3">
                    {settingsSections.map((section) => (
                      <div key={section.key} className="rounded-lg border p-3">
                        <p className="font-medium mb-2">{section.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {settingsRoles.map((roleKey) => (
                            <Button
                              key={`${section.key}-${roleKey}`}
                              type="button"
                              size="sm"
                              variant={(settingsAccess?.[section.key] || []).includes(roleKey) ? "default" : "outline"}
                              disabled={!canManageSecurity}
                              onClick={() => toggleSettingsAccess(section.key, roleKey)}
                            >
                              {t(`role_${roleKey}`)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={() => handleSave("security")} disabled={!canManageSecurity || general.saving || isLoading}>
                  <Save className="w-4 h-4 ml-2" />
                  {general.saving ? t("saving") : t("save_changes")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backup">
          {!canViewBackup ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  {tSafe("backup_restore", "النسخ الاحتياطي والاستعادة")}
                </CardTitle>
                <CardDescription>{tSafe("backup_restore_desc", "تصدير الإعدادات أو استعادتها من ملف")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportSettings} className="gap-2">
                    <Download className="w-4 h-4" />
                    {tSafe("export_settings", "تصدير الإعدادات")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => importInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {tSafe("import_settings", "استيراد الإعدادات")}
                  </Button>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">{tSafe("backup_history", "سجل النسخ الاحتياطي")}</p>
                  {backupHistory.length ? (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {backupHistory.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("no_data")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit">
          {!canViewAuditTab ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card border-none shadow-sm">
              <CardHeader>
                <CardTitle>{t("audit_logs_title")}</CardTitle>
                <CardDescription>{t("audit_logs_subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{t("loading")}</p>
                ) : auditLogsQuery.isError ? (
                  <EmptyState icon={AlertTriangle} title={t("error_loading")} />
                ) : auditLogsQuery.data?.length ? (
                  <div className="space-y-2 text-sm">
                    {auditLogsQuery.data.map((log) => (
                      <div key={log.id} className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3">
                        <div>
                          <p className="font-medium">{t(log.action)}</p>
                          <p className="text-muted-foreground">{log.userName || "-"}</p>
                        </div>
                        <div className="text-muted-foreground">{log.created_at || "-"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("no_data")}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

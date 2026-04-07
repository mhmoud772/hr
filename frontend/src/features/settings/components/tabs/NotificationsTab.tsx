import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Bell, Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { Separator } from "@/shared/ui/separator";
import { Badge } from "@/shared/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/components/EmptyState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NotificationsTab(props: any) {
  const { 
    t, 
    company, attendance, leave, notifications, general, 
    handleSave, setFormErrors, formErrors,
    canViewCompany, canViewGeneral, canViewAttendance, canViewLeaves,
    canViewNotifications, canManageSecurity, canViewBackup, canViewAuditTab,
    handleLogoChange, handleLogoRemove, addHoliday, updateHoliday, removeHoliday,
    toggleWorkDay, toggleWeekendDay, settingsRoles, settingsSections, toggleSettingsAccess,
    exportSettings, importSettings, resetAll, importInputRef,
    handlePasswordSubmit, currentPassword, setCurrentPassword, newPassword, setNewPassword,
    confirmPassword, setConfirmPassword, passwordSaving, passwordError,
    mfaSetupData, mfaCode, setMfaCode, mfaLoading, mfaSwitchLoading,
    handleMfaStart, handleMfaVerify, handleMfaDisable,
    validateEmail, validatePhone, validateTimeRange, validateQuietHours, validateNumberRange,
    theme, setTheme, i18n, isArabic, tSafe, handleRegisterSecurityKey, registeringKey,
    auditLogsQuery, recommendedSecurityDefaults, role, permissions, canAdmin, isLoading, sanitizeTemplateValue
  } = props;

  return (
    <div className="animate-fade-in space-y-6">
      
          {!canViewNotifications ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card/90 border border-border/60 shadow-sm">
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
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("email_notifications_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("email_notifications_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
                      checked={notifications.value.emailNotifications}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("sms_notifications_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("sms_notifications_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
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
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("leave_request_notify_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("leave_request_notify_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
                      checked={notifications.value.leaveRequestNotify}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          leaveRequestNotify: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("attendance_alerts_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("attendance_alerts_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
                      checked={notifications.value.attendanceAlerts}
                      onCheckedChange={(checked) =>
                        notifications.setValue({
                          ...notifications.value,
                          attendanceAlerts: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("weekly_reports_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("weekly_reports_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{tSafe("quiet_hours_enabled", "تفعيل ساعات الصمت")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("quiet_hours_desc", "إيقاف البريد/الرسائل خارج الدوام")}</p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
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
        
    </div>
  );
}

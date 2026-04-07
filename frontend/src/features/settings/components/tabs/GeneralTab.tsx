import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
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
export function GeneralTab(props: any) {
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
    auditLogsQuery, recommendedSecurityDefaults, role, permissions, canAdmin, isLoading
  } = props;

  return (
    <div className="animate-fade-in space-y-6">
      
          {!canViewGeneral ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
          <Card className="bg-card/90 border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                {t("general_title")}
              </CardTitle>
              <CardDescription>{t("general_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <p className="text-xs text-destructive">{formErrors.work_week}</p>
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
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add")}
                  </Button>
                </div>
                {(general.value.holidayCalendar || []).length > 0 ? (
                  <div className="space-y-4">
                    {(general.value.holidayCalendar || []).map((holiday, index) => (
                      <div key={`${holiday.date}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                        <div className="space-y-2">
                          <Label>{t("date")}</Label>
                          <DatePicker
                            value={holiday.date}
                            onChange={(date) => updateHoliday(index, "date", date)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("title")}</Label>
                          <Input
                            value={holiday.name}
                            placeholder={t("title")}
                            onChange={(e) => updateHoliday(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("type")}</Label>
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
                        </div>
                        <Button type="button" variant="ghost" className="text-destructive h-10 w-10 px-0" onClick={() => removeHoliday(index)}>
                          <Trash2 className="w-4 h-4" />
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
                <Save className="w-4 h-4 mr-2" />
                {general.saving ? t("saving") : t("save_changes")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
}

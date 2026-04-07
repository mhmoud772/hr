import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Clock, Save } from "lucide-react";
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
export function AttendanceTab(props: any) {
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
      
          {!canViewAttendance ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card/90 border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t("attendance_settings_title")}
                </CardTitle>
                <CardDescription>{t("attendance_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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


                <div className="space-y-4">
                  <h4 className="font-medium">{t("advanced_options")}</h4>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("enable_geolocation_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("enable_geolocation_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
                      checked={attendance.value.enableGeolocation}
                      onCheckedChange={(checked) =>
                        attendance.setValue({
                          ...attendance.value,
                          enableGeolocation: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{t("enable_face_recognition_title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("enable_face_recognition_desc")}
                      </p>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
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
        
    </div>
  );
}

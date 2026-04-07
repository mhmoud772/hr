import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Calendar, Save } from "lucide-react";
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
export function LeavesTab(props: any) {
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
      
          {!canViewLeaves ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card/90 border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t("leave_title")}
                </CardTitle>
                <CardDescription>{t("leave_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{t("require_leave_approval_title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("require_leave_approval_desc")}
                    </p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
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
        
    </div>
  );
}

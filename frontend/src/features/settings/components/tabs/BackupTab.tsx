import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Download } from "lucide-react";
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
export function BackupTab(props: any) {
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
    auditLogsQuery, recommendedSecurityDefaults, role, permissions, canAdmin, backupHistory
  } = props;

  return (
    <div className="animate-fade-in space-y-6">
      
          {!canViewBackup ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card/90 border border-border/60 shadow-sm">
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
        
    </div>
  );
}
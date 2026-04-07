import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle } from "lucide-react";
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
export function AuditTab(props: any) {
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
    auditLogsQuery, recommendedSecurityDefaults, role, permissions, canAdmin
  } = props;

  return (
    <div className="animate-fade-in space-y-6">
      
          {!canViewAuditTab ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card/90 border border-border/60 shadow-sm">
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
        
    </div>
  );
}
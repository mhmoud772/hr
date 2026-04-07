import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Save } from "lucide-react";
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
export function CompanyTab(props: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
      {!canViewCompany ? (
        <EmptyState
          icon={AlertTriangle}
          title={t("not_authorized_title")}
          description={t("not_authorized_desc")}
        />
      ) : (
        <Card className="bg-card/90 border border-border/60 shadow-sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(company.value.logos || []).map((logo, index) => (
                    <div key={`${logo}-${index}`} className="border rounded-lg p-2 space-y-2">
                      <div className="h-16 w-full rounded bg-muted/30 overflow-hidden">
                        <img src={logo} alt="logo" className="h-full w-full object-cover" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLogoRemove(index)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Button onClick={() => handleSave("company")} disabled={company.saving}>
              <Save className="w-4 h-4 ml-2" />
              {company.saving ? t("saving") : t("save_changes")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

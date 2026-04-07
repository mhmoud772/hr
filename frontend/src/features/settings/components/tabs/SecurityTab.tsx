import React from "react";
import { Copy, Plus, Trash2, Shield, Fingerprint, Calendar as CalendarIcon, Upload, Link, HardDrive, Filter, Smartphone, Building, RotateCcw, ShieldCheck, Mail, Sun, Monitor, AlertTriangle, Save } from "lucide-react";
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
export function SecurityTab(props: any) {
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
    auditLogsQuery, recommendedSecurityDefaults, role, permissions, canAdmin, isLoading,
    user, setMfaSwitchLoading, settingsAccess
  } = props;

  const canViewSecurity = canManageSecurity;

  return (
    <div className="animate-fade-in space-y-6">
      
          {!canViewSecurity ? (
            <EmptyState icon={AlertTriangle} title={t("not_authorized_title")} description={t("not_authorized_desc")} />
          ) : (
            <Card className="bg-card/90 border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  {t("self_service_security")}
                </CardTitle>
                <CardDescription>{t("security_settings_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{tSafe("mfa_enabled", "تفعيل MFA")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("mfa_enabled_desc", "السماح للمستخدمين بتفعيل MFA")}</p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
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
                <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{tSafe("mfa_required", "إلزام MFA")}</p>
                    <p className="text-sm text-muted-foreground">{tSafe("mfa_required_desc", "فرض MFA على جميع المستخدمين")}</p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
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
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{tSafe("mfa_personal_title", "المصادقة متعددة العوامل الخاصة بي")}</p>
                      <p className="text-sm text-muted-foreground">
                        {tSafe("mfa_personal_desc", "فعّل رمز تطبيق المصادقة لحماية حسابك")}
                      </p>
                    </div>
                  <div className="flex flex-wrap items-center gap-3">
                      <Switch
                        className="self-start sm:self-center"
                        disabled={mfaSwitchLoading}
                        checked={Boolean(user?.mfa_enabled || mfaSetupData)}
                        onCheckedChange={async (checked) => {
                          if (checked) {
                            setMfaSwitchLoading(true);
                            await handleMfaStart();
                            setMfaSwitchLoading(false);
                          } else {
                            setMfaSwitchLoading(true);
                            await handleMfaDisable();
                            setMfaSwitchLoading(false);
                          }
                        }}
                      />
                      {!user?.mfa_enabled && !mfaSetupData && (
                        <span className="text-xs text-muted-foreground">{tSafe("mfa_start_hint", "فعّل المفتاح للتنشيط")}</span>
                      )}
                    </div>
                  </div>
                  {mfaSetupData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">{tSafe("mfa_scan_qr", "امسح الرمز في تطبيق المصادقة")}</p>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                            mfaSetupData.otpauth_url || "",
                          )}`}
                          alt={tSafe("mfa_scan_qr", "امسح الرمز")}
                          className="rounded-lg border border-border/60 bg-card/80 p-2 shadow-sm"
                        />
                        <code className="text-xs bg-muted px-2 py-1 rounded">{mfaSetupData.secret}</code>
                      </div>
                      <div className="space-y-2">
                        <Label>{tSafe("mfa_enter_code", "أدخل رمز المصادقة")}</Label>
                        <Input
                          value={mfaCode}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          onChange={(e) => setMfaCode(e.target.value)}
                          placeholder="123456"
                          disabled={mfaLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          {tSafe("mfa_manual_code", "أو أدخل الكود يدوياً في التطبيق")}
                        </p>
                        <Button onClick={handleMfaVerify} disabled={!mfaCode.trim() || mfaLoading}>
                          {tSafe("mfa_verify", "تأكيد الرمز")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2">
                      <div>
                        <p className="font-medium">{tSafe("password_require_upper", "حرف كبير مطلوب")}</p>
                        <p className="text-sm text-muted-foreground">{tSafe("password_require_upper_desc", "حرف واحد كبير على الأقل")}</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline">?</Badge>
                          </TooltipTrigger>
                          <TooltipContent>{tSafe("password_policy_help", "يوصى بطول 8+ وحروف كبيرة/أرقام/رموز")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
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
                  <div className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2">
                      <div>
                        <p className="font-medium">{tSafe("password_require_number", "رقم مطلوب")}</p>
                        <p className="text-sm text-muted-foreground">{tSafe("password_require_number_desc", "رقم واحد على الأقل")}</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline">?</Badge>
                          </TooltipTrigger>
                          <TooltipContent>{tSafe("password_policy_help", "يوصى بطول 8+ وحروف كبيرة/أرقام/رموز")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
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
                  <div className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2">
                      <div>
                        <p className="font-medium">{tSafe("password_require_symbol", "رمز مطلوب")}</p>
                        <p className="text-sm text-muted-foreground">{tSafe("password_require_symbol_desc", "رمز خاص واحد على الأقل")}</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline">?</Badge>
                          </TooltipTrigger>
                          <TooltipContent>{tSafe("password_policy_help", "يوصى بطول 8+ وحروف كبيرة/أرقام/رموز")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      className="self-start sm:self-center"
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
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{t("security_keys")}</p>
                      <p className="text-sm text-muted-foreground">
                        {tSafe("security_keys_desc", "أضف مفتاح أمني لتسجيل الدخول بدون كلمة مرور")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegisterSecurityKey}
                      disabled={registeringKey || !canManageSecurity}
                    >
                      {registeringKey ? t("loading") : t("register_security_key")}
                    </Button>
                  </div>
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
        
    </div>
  );
}

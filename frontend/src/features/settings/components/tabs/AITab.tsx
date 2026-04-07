import React from "react";
import { AlertTriangle, Bot, BrainCircuit, Cpu, Power, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/components/EmptyState";
import { Switch } from "@/shared/ui/switch";
import { Separator } from "@/shared/ui/separator";
import { Badge } from "@/shared/ui/badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AITab(props: any) {
  const { t, tSafe, ai, general, handleSave, canViewAI, settingsRoles, toggleSettingsAccess } = props;

  const aiAccessRoles = general.value.settingsAccess?.ai || ai.value.access_roles || [];
  const featureEnabled = Boolean(ai.value.enabled);
  const runtimeEnabled = Boolean(ai.value.runtime_enabled);
  const effectiveEnabled = featureEnabled;
  const providerLabel = ai.value.provider || "-";
  const modelLabel = ai.value.model_name || "-";

  return (
    <div className="animate-fade-in space-y-6">
      {!canViewAI ? (
        <EmptyState
          icon={AlertTriangle}
          title={t("not_authorized_title")}
          description={t("not_authorized_desc")}
        />
      ) : (
          <Card className="bg-card/90 border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              {t("ai_settings_title")}
            </CardTitle>
            <CardDescription>{t("ai_settings_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{t("ai_feature_enabled")}</p>
                    <Badge variant={effectiveEnabled ? "default" : "secondary"} className="rounded-full">
                      {effectiveEnabled ? t("ai_runtime_live") : t("ai_runtime_disabled")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("ai_feature_enabled_desc")}</p>
                </div>
                <Switch
                  className="self-start sm:self-center"
                  checked={featureEnabled}
                  onCheckedChange={(checked) =>
                    ai.setValue({
                      ...ai.value,
                      enabled: checked,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("ai_runtime_status")}
                  </span>
                  <ShieldCheck className={`h-4 w-4 ${runtimeEnabled ? "text-emerald-500" : "text-amber-500"}`} />
                </div>
                <p className="text-lg font-bold text-foreground">
                  {runtimeEnabled ? t("ai_runtime_ready") : t("ai_runtime_unavailable")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("ai_runtime_note")}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("ai_provider")}
                  </span>
                  <Cpu className="h-4 w-4 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground">{providerLabel}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("ai_provider_env_note")}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("ai_effective_status")}
                  </span>
                  <Power className={`h-4 w-4 ${effectiveEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
                </div>
                <p className="text-lg font-bold text-foreground">
                  {effectiveEnabled ? t("ai_runtime_live") : t("ai_runtime_disabled")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("ai_effective_status_desc")}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                  <p className="font-medium text-foreground">{t("ai_feature_policy_assistant")}</p>
                  <p className="text-sm text-muted-foreground">{t("ai_feature_policy_assistant_desc")}</p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
                    checked={Boolean(ai.value.features?.policy_assistant)}
                    onCheckedChange={(checked) =>
                      ai.setValue({
                        ...ai.value,
                        features: {
                          ...ai.value.features,
                          policy_assistant: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                  <p className="font-medium text-foreground">{t("ai_feature_dashboard_summary")}</p>
                  <p className="text-sm text-muted-foreground">{t("ai_feature_dashboard_summary_desc")}</p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
                    checked={Boolean(ai.value.features?.dashboard_summary)}
                    onCheckedChange={(checked) =>
                      ai.setValue({
                        ...ai.value,
                        features: {
                          ...ai.value.features,
                          dashboard_summary: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                  <p className="font-medium text-foreground">{t("ai_feature_allow_fallback")}</p>
                  <p className="text-sm text-muted-foreground">{t("ai_feature_allow_fallback_desc")}</p>
                  </div>
                  <Switch
                    className="self-start sm:self-center"
                    checked={Boolean(ai.value.allow_fallback)}
                    onCheckedChange={(checked) =>
                      ai.setValue({
                        ...ai.value,
                        allow_fallback: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("ai_model_name")}
                </span>
                <BrainCircuit className="h-4 w-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">{modelLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("ai_model_env_note")}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground">{t("ai_access_roles")}</p>
                <p className="text-sm text-muted-foreground">{t("ai_access_roles_desc")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {settingsRoles.map((roleKey: string) => {
                  const active = aiAccessRoles.includes(roleKey);
                  return (
                    <Button
                      key={roleKey}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => toggleSettingsAccess("ai", roleKey)}
                    >
                      {t(`role_${roleKey}`)}
                    </Button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {aiAccessRoles.map((roleKey: string) => (
                  <Badge key={roleKey} variant="secondary" className="rounded-full">
                    {t(`role_${roleKey}`)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSave("ai")} className="gap-2">
                <Save className="h-4 w-4" />
                {tSafe("save_changes", "حفظ التعديلات")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

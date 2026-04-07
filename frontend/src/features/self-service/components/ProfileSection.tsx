import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
import { Textarea } from "@/shared/ui/textarea";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useSelfServiceProfile } from "../hooks/useSelfServiceProfile";

export function ProfileSection() {
  const { t } = useTranslation();
  const {
    employee,
    employeeQuery,
    isEditing,
    setIsEditing,
    isSaving,
    form,
    updateField,
    save,
  } = useSelfServiceProfile();

  if (employeeQuery.isLoading) {
    return <LoadingState label={t("loading")} />;
  }

  if (employeeQuery.isError) {
    return <EmptyState icon={AlertTriangle} title={t("error_loading")} />;
  }

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("my_profile")}</CardTitle>
        <Button
          variant="outline"
          onClick={() => setIsEditing((prev) => !prev)}
          disabled={employeeQuery.isLoading || employeeQuery.isError}
        >
          {isEditing ? t("cancel") : t("edit")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">{t("full_name_label")}</p>
              <p className="font-medium">{employee?.name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("employee_id")}</p>
              <p className="font-medium">{employee?.id || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("department")}</p>
              <p className="font-medium">{employee?.department || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("job_title")}</p>
              <p className="font-medium">{employee?.jobTitle || "-"}</p>
            </div>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-1">{t("email")}</p>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t("phone")}</p>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t("nationality")}</p>
                <Input
                  value={form.nationality}
                  onChange={(e) => updateField("nationality", e.target.value)}
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t("birth_date")}</p>
                <DatePicker
                  value={form.birthDate}
                  onChange={(date) => updateField("birthDate", date)}
                />
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">{t("address")}</p>
                <Textarea
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button onClick={save} disabled={isSaving}>
                  {isSaving ? t("saving") : t("save_changes")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">{t("email")}</p>
                <p className="font-medium">{employee?.email || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("phone")}</p>
                <p className="font-medium">{employee?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("nationality")}</p>
                <p className="font-medium">{employee?.nationality || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("birth_date")}</p>
                <p className="font-medium">{employee?.birthDate || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">{t("address")}</p>
                <p className="font-medium">{employee?.address || "-"}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

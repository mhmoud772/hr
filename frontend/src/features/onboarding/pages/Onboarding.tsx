import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHero } from "@/shared/components/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { Progress } from "@/shared/ui/progress";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useCreateDepartment } from "@/features/structure/hooks/useDepartments";
import { useCreateEmployee } from "@/features/employees/hooks/useEmployees";
import { useInviteUsers } from "@/features/users/hooks/useUsers";
import type { Employee } from "@/types/api";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { Navigate } from "react-router-dom";
import { ADMIN_ROLES } from "@/shared/lib/permissions";

type WizardStep = "company" | "structure" | "policies" | "employee" | "invite";

const defaultCompany = {
  name: "",
  nameEn: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  currency: "",
  logoDataUrl: "",
};

const defaultAttendance = {
  workStartTime: "09:00",
  workEndTime: "17:00",
  lateThreshold: "00:10",
  earlyLeaveThreshold: "00:10",
  enableGeolocation: false,
  enableFaceRecognition: false,
};

const defaultLeave = {
  annualLeaveDefault: "21",
  sickLeaveDefault: "7",
  emergencyLeaveDefault: "3",
  requireApproval: true,
  approvalLevels: "1",
  minAdvanceNotice: "1",
};

const suggestedDepartments = ["HR", "Finance", "Technology", "Operations", "Sales", "Marketing"];

const workweekDefaults = ["sun", "mon", "tue", "wed", "thu"];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const company = useSettings("company-settings", defaultCompany);
  const attendance = useSettings("attendance-settings", defaultAttendance);
  const leave = useSettings("leave-settings", defaultLeave);
  const createDepartment = useCreateDepartment();
  const createEmployee = useCreateEmployee();
  const inviteUsers = useInviteUsers();

  const storageKey = "onboarding:wizard";

  const readSaved = () => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const savedState = readSaved();

  const [step, setStep] = useState<WizardStep>(savedState?.step || "company");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    savedState?.selectedDepartments || suggestedDepartments.slice(0, 3),
  );
  const [workDays, setWorkDays] = useState<string[]>(savedState?.workDays || workweekDefaults);
  const [firstEmployee, setFirstEmployee] = useState<Partial<Employee>>(
    savedState?.firstEmployee || {
      name: "",
      id: "",
      email: "",
      department: "",
      jobTitle: "",
    },
  );
  const [invites, setInvites] = useState<string>(savedState?.invites || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ step, selectedDepartments, workDays, firstEmployee, invites }),
    );
  }, [step, selectedDepartments, workDays, firstEmployee, invites]);

  const progressMap: Record<WizardStep, number> = {
    company: 20,
    structure: 40,
    policies: 60,
    employee: 80,
    invite: 100,
  };

  const toggleDept = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSelectedDepartments((prev) =>
      prev.includes(trimmed) ? prev.filter((d) => d !== trimmed) : [...new Set([...prev, trimmed])],
    );
  };

  const toggleWorkDay = (day: string) => {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const next = () => {
    if (step === "company") setStep("structure");
    else if (step === "structure") setStep("policies");
    else if (step === "policies") setStep("employee");
    else if (step === "employee") setStep("invite");
  };

  const prev = () => {
    if (step === "invite") setStep("employee");
    else if (step === "employee") setStep("policies");
    else if (step === "policies") setStep("structure");
    else if (step === "structure") setStep("company");
  };

  const saveCurrentStep = async () => {
    setSaving(true);
    try {
      if (step === "company") {
        if (!company.value.name || !company.value.country || !company.value.currency) {
          throw new Error(t("onboarding_company_required"));
        }
        await company.save();
      } else if (step === "structure") {
        // create selected departments if not exists (best-effort)
        const unique = Array.from(new Set(selectedDepartments.filter(Boolean)));
        await Promise.all(
          unique.map((name) =>
            createDepartment.mutateAsync({ name }).catch(() => null),
          ),
        );
      } else if (step === "policies") {
        await attendance.save({
          ...attendance.value,
          workWeekDays: workDays,
          weekendDays: ["fri", "sat"].filter((d) => !workDays.includes(d)),
        });
        await leave.save();
      } else if (step === "employee") {
        if (firstEmployee.name && firstEmployee.id && firstEmployee.email) {
          await createEmployee.mutateAsync({
            id: firstEmployee.id || "",
            name: firstEmployee.name,
            email: firstEmployee.email,
            status: "active",
            department: firstEmployee.department || undefined,
            jobTitle: firstEmployee.jobTitle || undefined,
          });
        } else {
          throw new Error(t("onboarding_employee_required"));
        }
      } else if (step === "invite") {
        const uniqueEmails = Array.from(
          new Set(
            invites
              .split(/[,\n;]+/)
              .map((value) => value.trim().toLowerCase())
              .filter(Boolean),
          ),
        );

        if (uniqueEmails.length > 0) {
          const result = await inviteUsers.mutateAsync({
            emails: uniqueEmails,
            role: "employee",
          });

          const invitedCount = Number(result?.invited || 0);
          const createdUsers = Number(result?.createdUsers || 0);
          const invalidEmails = Array.isArray(result?.invalidEmails) ? result.invalidEmails : [];

          if (invitedCount > 0) {
            toast({
              title: t("onboarding_invite_hint", { defaultValue: "Invites" }),
              description: t("invite_note", {
                defaultValue: `Invites processed: ${invitedCount} (new accounts: ${createdUsers}).`,
              }),
            });
          }

          if (invalidEmails.length > 0) {
            toast({
              title: t("generic_error", { defaultValue: "Warning" }),
              description: invalidEmails.join(", "),
              variant: "destructive",
            });
          }
        }
      }
      return true;
    } catch (err: unknown) {
      toast({
        title: t("generic_error"),
        description: err instanceof Error ? err.message : t("error_loading"),
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const ok = await saveCurrentStep();
    if (ok) next();
  };

  const finish = async () => {
    const ok = await saveCurrentStep();
    if (ok) {
      localStorage.setItem(storageKey, JSON.stringify({ completed: true }));
      localStorage.setItem(`onboarding:${user?.id || "guest"}`, JSON.stringify({ completed: true }));
      navigate("/");
      toast({
        title: t("onboarding_done"),
        description: t("onboarding_done_desc"),
      });
    }
  };

  const StepWrapper = ({ children }: { children: React.ReactNode }) => (
    <Card className="bg-card/90 border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("onboarding_step")}</span>
          <span className="text-sm text-muted-foreground">{progressMap[step]}%</span>
        </CardTitle>
        <Progress value={progressMap[step]} />
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );

  return (
    ADMIN_ROLES.has(String(user?.role || "").toLowerCase().trim()) ? (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("onboarding_title")}
        subtitle={t("onboarding_subtitle")}
        actions={
          <Button variant="ghost" onClick={() => navigate("/")}>
            {t("skip_now")}
          </Button>
        }
      />

      <StepWrapper>
        {step === "company" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("company_name_ar")}</Label>
              <Input
                value={company.value.name}
                onChange={(e) => company.setValue({ ...company.value, name: e.target.value })}
                placeholder={t("company_name_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company_country")}</Label>
              <Input
                value={company.value.country || ""}
                onChange={(e) => company.setValue({ ...company.value, country: e.target.value })}
                placeholder="Saudi Arabia"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company_currency")}</Label>
              <Input
                value={company.value.currency || ""}
                onChange={(e) => company.setValue({ ...company.value, currency: e.target.value })}
                placeholder="SAR"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company_email")}</Label>
              <Input
                value={company.value.email}
                onChange={(e) => company.setValue({ ...company.value, email: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company_phone")}</Label>
              <Input
                value={company.value.phone}
                onChange={(e) => company.setValue({ ...company.value, phone: e.target.value })}
                placeholder="+9665xxxxxxx"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("company_address")}</Label>
              <Textarea
                value={company.value.address}
                onChange={(e) => company.setValue({ ...company.value, address: e.target.value })}
                placeholder={t("company_address_placeholder")}
              />
            </div>
          </div>
        )}

        {step === "structure" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("onboarding_structure_hint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedDepartments.map((dept) => (
            <Badge
              key={dept}
              variant={selectedDepartments.includes(dept) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleDept(dept)}
            >
              {dept}
            </Badge>
          ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>{t("onboarding_add_department")}</Label>
              <Input
                placeholder={t("department_name")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      toggleDept(value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("press_enter_to_add")}
              </p>
            </div>
          </div>
        )}

        {step === "policies" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("work_start_time")}</Label>
              <Input
                type="time"
                value={attendance.value.workStartTime}
                onChange={(e) =>
                  attendance.setValue({ ...attendance.value, workStartTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("work_end_time")}</Label>
              <Input
                type="time"
                value={attendance.value.workEndTime}
                onChange={(e) =>
                  attendance.setValue({ ...attendance.value, workEndTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("work_days")}</Label>
              <div className="flex flex-wrap gap-2">
                {["sat", "sun", "mon", "tue", "wed", "thu", "fri"].map((day) => (
                  <Badge
                    key={day}
                    variant={workDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleWorkDay(day)}
                  >
                    {t(`day_${day}`, day.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="sm:col-span-2" />
            <div className="space-y-2">
              <Label>{t("annual_leave")}</Label>
              <Input
                type="number"
                value={leave.value.annualLeaveDefault}
                onChange={(e) => leave.setValue({ ...leave.value, annualLeaveDefault: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sick_leave")}</Label>
              <Input
                type="number"
                value={leave.value.sickLeaveDefault}
                onChange={(e) => leave.setValue({ ...leave.value, sickLeaveDefault: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={leave.value.requireApproval}
                onCheckedChange={(v) => leave.setValue({ ...leave.value, requireApproval: v })}
              />
              <div>
                <p className="font-medium">{t("leave_require_approval")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("leave_require_approval_desc")}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "employee" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("employee_name")}</Label>
              <Input
                value={firstEmployee.name || ""}
                onChange={(e) => setFirstEmployee({ ...firstEmployee, name: e.target.value })}
                placeholder={t("employee_name_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("employee_id")}</Label>
              <Input
                value={firstEmployee.id || ""}
                onChange={(e) => setFirstEmployee({ ...firstEmployee, id: e.target.value })}
                placeholder={t("employee_id_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input
                value={firstEmployee.email || ""}
                onChange={(e) => setFirstEmployee({ ...firstEmployee, email: e.target.value })}
                placeholder={t("employee_email_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("department")}</Label>
              <Input
                value={firstEmployee.department || ""}
                onChange={(e) => setFirstEmployee({ ...firstEmployee, department: e.target.value })}
                placeholder={t("department_placeholder")}
              />
            </div>
          </div>
        )}

        {step === "invite" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("onboarding_invite_hint")}
            </p>
            <Textarea
              value={invites}
              onChange={(e) => setInvites(e.target.value)}
              placeholder={t("invite_placeholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("invite_note")}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2">
            {step !== "company" && (
              <Button variant="outline" onClick={prev}>
                {t("previous")}
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/")} >
              {t("skip_now")}
            </Button>
          </div>
          <div className="flex gap-2">
            {step !== "invite" && (
              <Button onClick={handleNext} disabled={saving}>
                {t("next")}
              </Button>
            )}
            {step === "invite" && (
              <Button onClick={finish} disabled={saving}>
                {t("finish")}
              </Button>
            )}
          </div>
        </div>
      </StepWrapper>
    </div>
    ) : (
      <Navigate to="/" replace />
    )
  );
}

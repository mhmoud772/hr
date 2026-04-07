import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { ArrowRight, Building2, CalendarCheck, Check, CloudUpload, Users, Wand2, type LucideIcon } from "lucide-react";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useToast } from "@/shared/hooks/use-toast";
import { useImportEmployeesCSV } from "@/features/employees/hooks/useEmployees";
import { useTranslation } from "react-i18next";

type StepId = "goal" | "team" | "next";

type OnboardingState = {
  goal?: string;
  teamSize?: string;
  nextAction?: string;
};

const GOAL_OPTIONS = [
  { value: "attendance", titleKey: "onboarding.goal_attendance_title", descKey: "onboarding.goal_attendance_desc", icon: CalendarCheck },
  { value: "employees", titleKey: "onboarding.goal_employees_title", descKey: "onboarding.goal_employees_desc", icon: Users },
  { value: "payroll", titleKey: "onboarding.goal_payroll_title", descKey: "onboarding.goal_payroll_desc", icon: Building2 },
];

const TEAM_OPTIONS = [
  { value: "1-10", titleKey: "onboarding.team_1_10_title", descKey: "onboarding.team_1_10_desc" },
  { value: "11-50", titleKey: "onboarding.team_11_50_title", descKey: "onboarding.team_11_50_desc" },
  { value: "51-200", titleKey: "onboarding.team_51_200_title", descKey: "onboarding.team_51_200_desc" },
  { value: "200+", titleKey: "onboarding.team_200_plus_title", descKey: "onboarding.team_200_plus_desc" },
];

const NEXT_OPTIONS = [
  { value: "import", titleKey: "onboarding.next_import_title", descKey: "onboarding.next_import_desc", icon: CloudUpload, target: "/employees" },
  { value: "policies", titleKey: "onboarding.next_policies_title", descKey: "onboarding.next_policies_desc", icon: Wand2, target: "/settings?tab=attendance" },
  { value: "explore", titleKey: "onboarding.next_explore_title", descKey: "onboarding.next_explore_desc", icon: ArrowRight, target: "/" },
];

function OptionCard({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
  doneLabel,
  isRtl,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  doneLabel: string;
  isRtl: boolean;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all border-border/60 hover:border-primary/60 hover:shadow-md hover:bg-muted/30",
        selected ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "",
      )}
      onClick={onSelect}
    >
      <CardContent className={cn("p-4 flex items-start gap-3", isRtl ? "flex-row-reverse text-right" : "")}>
        {Icon ? <Icon className="w-5 h-5 text-primary mt-0.5" /> : null}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{title}</p>
            {selected ? (
              <Badge variant="success" className="gap-1">
                <Check className="w-3 h-3" /> {doneLabel}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const importEmployees = useImportEmployeesCSV();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<StepId>("goal");
  const [state, setState] = useState<OnboardingState>({});
  const isRtl = i18n.language?.startsWith("ar");

  const storageKey = useMemo(() => {
    const id = user?.id || "guest";
    return `onboarding:${id}`;
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const role = String(user.role || "").toLowerCase().trim();
    const isAdmin = ["system_admin", "admin", "hr_manager"].includes(role);
    if (!isAdmin) return;
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as { completed?: boolean }) : null;
    if (!parsed?.completed) {
      setOpen(true);
    }
  }, [storageKey, user]);

  const progress = step === "goal" ? 33 : step === "team" ? 66 : 100;

  const selectGoal = (goal: string) => {
    setState((prev) => ({ ...prev, goal }));
  };
  const selectTeam = (teamSize: string) => {
    setState((prev) => ({ ...prev, teamSize }));
  };
  const selectNext = (nextAction: string) => {
    setState((prev) => ({ ...prev, nextAction }));
  };

  const canContinue =
    (step === "goal" && !!state.goal) ||
    (step === "team" && !!state.teamSize) ||
    step === "next";

  useEffect(() => {
    if (state.nextAction === "import" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [state.nextAction]);

  const handleFileChange = async (file?: File | null) => {
    if (!file) return;
    try {
      const result = await importEmployees.mutateAsync(file);
      const created = result?.created ?? "—";
      const updated = result?.updated ?? "—";
      toast({
        title: t("import_employees_success", "Employees imported"),
        description: t("import_employees_success_desc", { created, updated }),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("error_loading", "Failed to load data");
      toast({
        title: t("generic_error", "Something went wrong"),
        description: message,
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const goNext = () => {
    if (step === "goal") setStep("team");
    else if (step === "team") setStep("next");
  };

  const finish = (target?: string) => {
    localStorage.setItem(storageKey, JSON.stringify({ ...state, completed: true, completedAt: Date.now() }));
    setOpen(false);
    if (target) {
      navigate(target);
    }
  };

  const skip = () => {
    localStorage.setItem(storageKey, JSON.stringify({ completed: true, skipped: true }));
    setOpen(false);
  };

  const doneLabel = t("onboarding.badge_done", "Done");
  const cardShellClassName = cn(
    "w-[calc(100vw-2rem)] max-w-xl rounded-3xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl",
    "left-1/2 top-auto bottom-4 translate-x-[-50%] translate-y-0",
    "sm:left-auto sm:right-6 sm:top-auto sm:bottom-6 sm:translate-x-0",
    isRtl ? "text-right" : "text-left",
  );

  return (
    <Dialog open={open} modal={false} onOpenChange={setOpen}>
      <DialogContent
        hideOverlay
        className={cn(cardShellClassName, "bg-gradient-to-br from-card/95 via-card to-muted/30")}
        fallbackTitle="Onboarding"
        fallbackDescription="Onboarding wizard"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          skip();
        }}
      >
        <DialogHeader className={cn(isRtl ? "text-right sm:text-right" : "text-left sm:text-left")}>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {t("onboarding.welcome", "Welcome to HR Companion")}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {t("onboarding.subtitle", "Let's set things up in a few quick steps.")}
          </DialogDescription>
        </DialogHeader>

        <div className={cn("flex items-center gap-3", isRtl ? "flex-row-reverse" : "")}>
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>

        <div className="space-y-4">
          {step === "goal" && (
            <>
              <p className="font-semibold text-lg">{t("onboarding.goal_q", "What is your first goal?")}</p>
              <div className="grid gap-3">
                {GOAL_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    title={t(opt.titleKey)}
                    description={t(opt.descKey)}
                    icon={opt.icon}
                    selected={state.goal === opt.value}
                    onSelect={() => selectGoal(opt.value)}
                    doneLabel={doneLabel}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            </>
          )}

          {step === "team" && (
            <>
              <p className="font-semibold text-lg">{t("onboarding.team_q", "What is your team size?")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {TEAM_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    title={t(opt.titleKey)}
                    description={t(opt.descKey)}
                    selected={state.teamSize === opt.value}
                    onSelect={() => selectTeam(opt.value)}
                    doneLabel={doneLabel}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            </>
          )}

          {step === "next" && (
            <>
              <p className="font-semibold text-lg">{t("onboarding.next_q", "What would you like to do next?")}</p>
              <div className="grid gap-3">
                {NEXT_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    title={t(opt.titleKey)}
                    description={t(opt.descKey)}
                    icon={opt.icon}
                    selected={state.nextAction === opt.value}
                    onSelect={() => selectNext(opt.value)}
                    doneLabel={doneLabel}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", isRtl ? "sm:flex-row-reverse" : "")}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          <Button variant="ghost" onClick={skip}>
            {t("onboarding_skip", "Skip for now")}
          </Button>
          <div className="flex gap-2">
            {step !== "next" && (
              <Button
                disabled={!canContinue || importEmployees.isPending}
                onClick={goNext}
                className="min-w-24"
              >
                {t("next", "Next")}
              </Button>
            )}
            {step === "next" && (
              <Button
                disabled={importEmployees.isPending}
                onClick={() => {
                  const target = NEXT_OPTIONS.find((o) => o.value === state.nextAction)?.target || "/";
                  finish(target);
                }}
                className="min-w-28"
              >
                {t("start_now", "Start now")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

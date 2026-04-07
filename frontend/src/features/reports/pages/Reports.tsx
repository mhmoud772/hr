import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";
import { useReportGeneration } from "@/features/reports/hooks/useReportGeneration";
import { useReportAI } from "@/features/reports/hooks/useReportAI";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHero } from "@/shared/components/PageHero";
import type { 
  ReportType, 
  Attendance, 
  Leave,
  PayrollRecord,
  RecruitmentCandidate,
  PerformanceReview,
  TrainingRecord,
  Asset,
  AuditLog,
} from "@/types/api";

import { AIInsightsPanel } from "../components/AIInsightsPanel";
import { ReportSection } from "../components/ReportSection";
import { TableToolbar } from "@/shared/components/TableToolbar";
import { DatePicker } from "@/shared/ui/date-picker";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

type ReportRow =
  | Attendance
  | Leave
  | PayrollRecord
  | RecruitmentCandidate
  | PerformanceReview
  | TrainingRecord
  | Asset
  | AuditLog;

type GenericReportRow = {
  employeeId?: string;
  id?: string;
  employeeName?: string;
  name?: string;
  userName?: string;
  date?: string;
  createdAt?: string;
  hireDate?: string;
  status?: string;
};

interface ColumnDefinition {
  header: string;
  render: (row: ReportRow) => React.ReactNode;
}

export default function Reports() {
  const { t, i18n } = useTranslation();
  
  const [activeReport, setActiveReport] = useState<ReportType>("attendance");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState("all");
  const [jobTitle, setJobTitle] = useState("all");
  const [status, setStatus] = useState("all");

  const {
    data,
    loading,
    generateReport,
    exportToPdf,
    exportToCsv,
    exportToExcel,
  } = useReportGeneration();

  const {
    aiAnalysis,
    isAnalyzing,
    analyzeReport,
    isEnabled: isAIEnabled,
  } = useReportAI();

  const departmentsQuery = useDepartmentsQuery();
  const jobTitlesQuery = useJobTitlesQuery({});

  const departmentOptions = useMemo(
    () => (departmentsQuery.data || []).map((dept) => ({ id: String(dept.id), name: dept.name })),
    [departmentsQuery.data],
  );

  const jobTitleOptions = useMemo(
    () => (jobTitlesQuery.data?.results || []).map((job) => ({ id: String(job.id), name: job.name })),
    [jobTitlesQuery.data],
  );

  const handleGenerate = () => {
    generateReport(activeReport, {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
      department: department === "all" ? undefined : department,
      jobTitle: jobTitle === "all" ? undefined : jobTitle,
      status: status === "all" ? undefined : status,
    });
  };

  const handleAnalyze = () => {
    void analyzeReport(activeReport, data);
  };

  const statusOptions: Record<string, string[]> = {
    attendance: ["present", "absent", "late"],
    leaves: ["pending", "approved", "rejected"],
    payroll: ["draft", "approved", "paid"],
    recruitment: ["applied", "screening", "interview", "offered", "hired", "rejected"],
    training: ["planned", "in_progress", "completed", "cancelled"],
    assets: ["available", "assigned", "maintenance", "retired"],
  };

  const leaveTypes = ["annual", "sick", "emergency", "unpaid"];

  const reportTabs: { value: ReportType; label: string }[] = [
    { value: "attendance", label: t("report_attendance") },
    { value: "leaves", label: t("report_leaves") },
    { value: "payroll", label: t("report_payroll") },
    { value: "recruitment", label: t("report_recruitment") },
    { value: "performance", label: t("report_performance") },
    { value: "training", label: t("report_training") },
    { value: "assets", label: t("report_assets") },
    { value: "audit", label: t("report_audit") },
  ];

  const getColumns = (type: ReportType): ColumnDefinition[] => {
    const common = [
      { 
        header: t("employee_id"), 
        render: (row: ReportRow) => (row as GenericReportRow).employeeId || (row as GenericReportRow).id || "-" 
      },
      { 
        header: t("name"), 
        render: (row: ReportRow) => (row as GenericReportRow).employeeName || (row as GenericReportRow).name || (row as GenericReportRow).userName || t("unknown") 
      },
    ];

    switch (type) {
      case "attendance":
        return [
          ...common,
          { header: t("date"), render: (row: ReportRow) => (row as Attendance).date },
          { header: t("status"), render: (row: ReportRow) => (row as Attendance).status },
          { header: t("check_in"), render: (row: ReportRow) => (row as Attendance).checkIn || "-" },
          { header: t("check_out"), render: (row: ReportRow) => (row as Attendance).checkOut || "-" },
        ];
      case "leaves":
        return [
          ...common,
          { header: t("leave_type"), render: (row: ReportRow) => t(`leave_type_${(row as Leave).leaveType}`) },
          { header: t("start_date"), render: (row: ReportRow) => (row as Leave).startDate },
          { header: t("end_date"), render: (row: ReportRow) => (row as Leave).endDate },
          { header: t("status"), render: (row: ReportRow) => (row as Leave).status },
        ];
      case "payroll":
        return [
          ...common,
          {
            header: t("period"),
            render: (row: ReportRow) =>
              `${(row as PayrollRecord).period_start} - ${(row as PayrollRecord).period_end}`,
          },
          { header: t("basic_salary"), render: (row: ReportRow) => (row as PayrollRecord).base_salary },
          { header: t("allowances"), render: (row: ReportRow) => (row as PayrollRecord).allowances },
          { header: t("deductions"), render: (row: ReportRow) => (row as PayrollRecord).deductions },
          { header: t("net_salary"), render: (row: ReportRow) => (row as PayrollRecord).net_salary },
        ];
      default:
        return [
          ...common,
          { header: t("date"), render: (row: ReportRow) => (row as GenericReportRow).date || (row as GenericReportRow).createdAt || (row as GenericReportRow).hireDate || "-" },
          { header: t("status"), render: (row: ReportRow) => (row as GenericReportRow).status || "-" },
        ];
    }
  };

  const activeReportLabel =
    reportTabs.find((tab) => tab.value === activeReport)?.label || "-";
  const selectedDepartmentLabel =
    department === "all"
      ? t("status_all")
      : departmentOptions.find((option) => option.id === department)?.name || department;
  const selectedJobTitleLabel =
    jobTitle === "all"
      ? t("status_all")
      : jobTitleOptions.find((option) => option.name === jobTitle)?.name || jobTitle;
  const selectedStatusLabel =
    status === "all"
      ? t("status_all")
      : activeReport === "leaves"
        ? t(`leave_type_${status}`)
        : t(status);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("reports_title")}
        subtitle={t("reports_subtitle")}
        metrics={[
          { label: t("total_records"), value: data.length, tone: "primary" },
          {
            label: t("status"),
            value: activeReportLabel,
            tone: "default",
          },
        ]}
        aside={
          <div className="space-y-4">
            <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t("reports_title")}
                  </p>
                  <p className="text-xl font-black tracking-tight text-foreground">{activeReportLabel}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <FileText className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t("from_date")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {startDate.toLocaleDateString(i18n.language)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t("to_date")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {endDate.toLocaleDateString(i18n.language)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full bg-card text-muted-foreground">
                  {t("department")}: {selectedDepartmentLabel}
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-card text-muted-foreground">
                  {t("job_title")}: {selectedJobTitleLabel}
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-card text-muted-foreground">
                  {t("status")}: {selectedStatusLabel}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border-primary/20 bg-primary/10 text-primary"
                >
                  {t("ai_assistant")}: {isAIEnabled ? t("enabled") : t("disabled")}
                </Badge>
              </div>
            </div>
          </div>
        }
      />

      <Tabs 
        value={activeReport} 
        onValueChange={(val) => {
          setActiveReport(val as ReportType);
          setStatus("all");
        }}
        className="space-y-6"
      >
        <div className="overflow-x-auto rounded-[28px] border border-border/60 bg-card/80 p-3 shadow-sm">
          <TabsList className="h-auto gap-2 bg-transparent p-0">
            {reportTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="rounded-2xl border border-transparent bg-background/60 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-foreground data-[state=active]:border-primary/20 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-4">
            <TableToolbar
              filters={
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{t("from")}:</span>
                    <DatePicker value={startDate} onChange={(date) => date && setStartDate(date)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{t("to")}:</span>
                    <DatePicker value={endDate} onChange={(date) => date && setEndDate(date)} />
                  </div>
                  
                  {(activeReport === "attendance" || activeReport === "leaves") && (
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="w-full sm:w-40 bg-background/50 border-none shadow-none focus:ring-1">
                        <SelectValue placeholder={t("department")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("status_all")}</SelectItem>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {(activeReport === "attendance" || activeReport === "leaves") && (
                    <Select value={jobTitle} onValueChange={setJobTitle}>
                      <SelectTrigger className="w-full sm:w-40 bg-background/50 border-none shadow-none focus:ring-1">
                        <SelectValue placeholder={t("job_title")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("status_all")}</SelectItem>
                        {jobTitleOptions.map((job) => (
                          <SelectItem key={job.id} value={job.name}>
                            {job.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {activeReport === "leaves" ? (
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full sm:w-40 bg-background/50 border-none shadow-none focus:ring-1">
                        <SelectValue placeholder={t("leave_type_label")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("status_all")}</SelectItem>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`leave_type_${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : activeReport !== "performance" && (
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full sm:w-40 bg-background/50 border-none shadow-none focus:ring-1">
                        <SelectValue placeholder={t("status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("status_all")}</SelectItem>
                        {statusOptions[activeReport]?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {t(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              }
              actions={
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerate} disabled={loading} size="sm" className="min-w-28">
                    {loading ? t("loading") : t("generate_report")}
                  </Button>
                  {isAIEnabled && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={loading || isAnalyzing}
                      variant="secondary"
                      size="sm"
                      className="px-3 shrink-0"
                      title={t('ai_analyze_button_title', "Analyze with AI")}
                    >
                      {isAnalyzing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Sparkles className="w-4 h-4 text-primary" />
                      }
                    </Button>
                  )}
                </div>
              }
            />
          </CardContent>
        </Card>

        <AIInsightsPanel 
          aiAnalysis={aiAnalysis} 
          isAIEnabled={isAIEnabled} 
        />

        {reportTabs.map((tab) => (
          <ReportSection
            // ReportSection itself is generic; at runtime the tab data is homogeneous per report type.
            key={tab.value}
            value={tab.value}
            title={tab.label}
            data={activeReport === tab.value ? (data as ReportRow[]) : []}
            loading={activeReport === tab.value && loading}
            columns={getColumns(tab.value)}
            onExportPdf={() => exportToPdf(tab.value, data)}
            onExportCsv={() => exportToCsv(tab.value, data)}
            onExportExcel={() => exportToExcel(tab.value, data)}
          />
        ))}
      </Tabs>
    </div>
  );
}

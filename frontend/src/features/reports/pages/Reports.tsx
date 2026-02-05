
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";
import { getAttendanceReport } from "@/features/attendance/api/attendance";
import { getLeavesReport } from "@/features/leaves/api/leaves";
import { getPayrollReport } from "@/features/payroll/api/payroll";
import { getRecruitmentReport } from "@/features/recruitment/api/recruitment";
import { getPerformanceReport } from "@/features/performance/api/performance";
import { getTrainingReport } from "@/features/training/api/training";
import { getAssetsReport } from "@/features/assets/api/assets";
import { generateAttendanceReport, generateLeavesReport, downloadPDF } from "@/shared/lib/pdf-reports";
import { exportToCsv, exportToExcelXml } from "@/shared/lib/export";
import type {
  Attendance,
  Leave,
  PayrollRecord,
  RecruitmentCandidate,
  PerformanceReview,
  TrainingRecord,
  Asset,
} from "@/types/api";

type ReportType =
  | "attendance"
  | "leaves"
  | "payroll"
  | "recruitment"
  | "performance"
  | "training"
  | "assets"
  | "discipline";

export default function Reports() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const departmentsQuery = useDepartmentsQuery();
  const jobTitlesQuery = useJobTitlesQuery({});

  const [activeReport, setActiveReport] = useState<ReportType>("attendance");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [department, setDepartment] = useState("all");
  const [jobTitle, setJobTitle] = useState("all");
  const [status, setStatus] = useState("all");
  const [leaveType, setLeaveType] = useState("all");
  const [loading, setLoading] = useState(false);

  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [leaveData, setLeaveData] = useState<Leave[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [recruitmentData, setRecruitmentData] = useState<RecruitmentCandidate[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceReview[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);
  const [assetsData, setAssetsData] = useState<Asset[]>([]);

  const departmentOptions = useMemo(
    () => (departmentsQuery.data || []).map((dept) => ({ id: String(dept.id), name: dept.name })),
    [departmentsQuery.data],
  );
  const jobTitleOptions = useMemo(
    () => (jobTitlesQuery.data?.results || []).map((job) => ({ id: job.id, name: job.name })),
    [jobTitlesQuery.data],
  );

  const clearData = () => {
    setAttendanceData([]);
    setLeaveData([]);
    setPayrollData([]);
    setRecruitmentData([]);
    setPerformanceData([]);
    setTrainingData([]);
    setAssetsData([]);
  };
  const handleGenerate = async () => {
    setLoading(true);
    clearData();
    try {
      if (activeReport === "attendance") {
        const data = await getAttendanceReport({
          start: start || undefined,
          end: end || undefined,
          status: status === "all" ? undefined : status,
          department: department === "all" ? undefined : department,
          job_title: jobTitle === "all" ? undefined : jobTitle,
        } as any);
        setAttendanceData(data);
      }
      if (activeReport === "leaves") {
        const data = await getLeavesReport({
          start: start || undefined,
          end: end || undefined,
          status: status === "all" ? undefined : status,
          leave_type: leaveType === "all" ? undefined : leaveType,
          department: department === "all" ? undefined : department,
          job_title: jobTitle === "all" ? undefined : jobTitle,
        } as any);
        setLeaveData(data);
      }
      if (activeReport === "payroll") {
        const data = await getPayrollReport({
          start: start || undefined,
          end: end || undefined,
          status: status === "all" ? undefined : status,
        });
        setPayrollData(data);
      }
      if (activeReport === "recruitment") {
        const data = await getRecruitmentReport({
          start: start || undefined,
          end: end || undefined,
          status: status === "all" ? undefined : status,
        });
        setRecruitmentData(data);
      }
      if (activeReport === "performance") {
        const data = await getPerformanceReport({
          start: start || undefined,
          end: end || undefined,
        });
        setPerformanceData(data);
      }
      if (activeReport === "training") {
        const data = await getTrainingReport({
          start: start || undefined,
          end: end || undefined,
          status: status === "all" ? undefined : status,
        });
        setTrainingData(data);
      }
      if (activeReport === "assets") {
        const data = await getAssetsReport({
          status: status === "all" ? undefined : status,
        });
        setAssetsData(data);
      }
      if (activeReport === "discipline") {
        const data = await getAttendanceReport({
          start: start || undefined,
          end: end || undefined,
        });
        const filtered = data.filter((item) => item.status === "absent" || item.status === "late");
        setAttendanceData(filtered);
      }
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendancePdf = () => {
    const report = generateAttendanceReport(
      attendanceData.map((item) => ({
        employeeId: item.employeeId,
        name: item.employeeName || "",
        date: item.date,
        checkIn: item.checkIn || "-",
        checkOut: item.checkOut || "-",
        workHours: item.workHours || "-",
        status: item.status,
      })),
      `${start || t("range_today")} - ${end || t("range_today")}`,
    );
    downloadPDF(report, "attendance-report");
  };

  const handleExportLeavesPdf = () => {
    const report = generateLeavesReport(
      leaveData.map((item) => ({
        employeeName: item.employeeName || "",
        leaveType: item.leaveType,
        startDate: item.startDate,
        endDate: item.endDate,
        days: item.days || 0,
        status: item.status,
        reason: item.reason,
      })),
      t("leave_requests"),
    );
    downloadPDF(report, "leave-report");
  };

  const handleExportCsv = (rows: Record<string, unknown>[], filename: string) => {
    exportToCsv(rows, filename);
  };

  const handleExportExcel = (rows: Record<string, unknown>[], filename: string) => {
    exportToExcelXml(rows, filename);
  };

  const statusOptions = {
    attendance: ["present", "absent", "late"],
    leaves: ["pending", "approved", "rejected"],
    payroll: ["draft", "approved", "paid"],
    recruitment: ["applied", "screening", "interview", "offered", "hired", "rejected"],
    training: ["planned", "in_progress", "completed", "cancelled"],
    assets: ["available", "assigned", "maintenance", "retired"],
  };

  const leaveTypes = ["annual", "sick", "emergency", "unpaid"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("reports_title")}</h1>
        <p className="text-muted-foreground">{t("reports_subtitle")}</p>
      </div>

      <Tabs value={activeReport} onValueChange={(val) => setActiveReport(val as ReportType)} className="space-y-4">
        <TabsList className="bg-muted/50 flex flex-wrap">
          <TabsTrigger value="attendance">{t("report_type_attendance")}</TabsTrigger>
          <TabsTrigger value="leaves">{t("report_type_leaves")}</TabsTrigger>
          <TabsTrigger value="payroll">{t("report_type_payroll")}</TabsTrigger>
          <TabsTrigger value="recruitment">{t("report_type_recruitment")}</TabsTrigger>
          <TabsTrigger value="performance">{t("report_type_performance")}</TabsTrigger>
          <TabsTrigger value="training">{t("report_type_training")}</TabsTrigger>
          <TabsTrigger value="assets">{t("report_type_assets")}</TabsTrigger>
          <TabsTrigger value="discipline">{t("report_type_discipline")}</TabsTrigger>
        </TabsList>

        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-4 flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("from_date")}</label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("to_date")}</label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            {(activeReport === "attendance" || activeReport === "leaves") && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t("department")}</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-48">
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
              </div>
            )}
            {(activeReport === "attendance" || activeReport === "leaves") && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t("job_title")}</label>
                <Select value={jobTitle} onValueChange={setJobTitle}>
                  <SelectTrigger className="w-48">
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
              </div>
            )}
            {activeReport === "leaves" && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t("leave_type_label")}</label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger className="w-44">
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
              </div>
            )}
            {activeReport !== "performance" && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t("status")}</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("status_all")}</SelectItem>
                    {(statusOptions as Record<string, string[]>)[activeReport]?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? t("loading") : t("generate_report")}
            </Button>
          </CardContent>
        </Card>
        <TabsContent value="attendance">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("attendance_report_title")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportAttendancePdf} disabled={!attendanceData.length}>
                  {t("export_pdf")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      attendanceData.map((item) => ({
                        employeeId: item.employeeId,
                        name: item.employeeName || "",
                        date: item.date,
                        status: item.status,
                        checkIn: item.checkIn || "-",
                        checkOut: item.checkOut || "-",
                        workHours: item.workHours || "-",
                      })),
                      "attendance-report.csv",
                    )
                  }
                  disabled={!attendanceData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      attendanceData.map((item) => ({
                        employeeId: item.employeeId,
                        name: item.employeeName || "",
                        date: item.date,
                        status: item.status,
                        checkIn: item.checkIn || "-",
                        checkOut: item.checkOut || "-",
                        workHours: item.workHours || "-",
                      })),
                      "attendance-report.xls",
                    )
                  }
                  disabled={!attendanceData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: attendanceData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : attendanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee_id")}</TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.employeeId}</TableCell>
                        <TableCell>{row.employeeName || "-"}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{t(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("leave_report_title")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportLeavesPdf} disabled={!leaveData.length}>
                  {t("export_pdf")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      leaveData.map((item) => ({
                        employeeName: item.employeeName || "",
                        leaveType: item.leaveType,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        days: item.days || 0,
                        status: item.status,
                      })),
                      "leave-report.csv",
                    )
                  }
                  disabled={!leaveData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      leaveData.map((item) => ({
                        employeeName: item.employeeName || "",
                        leaveType: item.leaveType,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        days: item.days || 0,
                        status: item.status,
                      })),
                      "leave-report.xls",
                    )
                  }
                  disabled={!leaveData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: leaveData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : leaveData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee_name")}</TableHead>
                      <TableHead>{t("leave_type_label")}</TableHead>
                      <TableHead>{t("from_date")}</TableHead>
                      <TableHead>{t("to_date")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.employeeName || "-"}</TableCell>
                        <TableCell>{t(`leave_type_${row.leaveType}`)}</TableCell>
                        <TableCell>{row.startDate}</TableCell>
                        <TableCell>{row.endDate}</TableCell>
                        <TableCell>{t(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payroll">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("report_type_payroll")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      payrollData.map((item) => ({
                        employeeId: item.employeeId,
                        periodStart: item.period_start,
                        periodEnd: item.period_end,
                        baseSalary: item.base_salary,
                        allowances: item.allowances,
                        deductions: item.deductions,
                        netSalary: item.net_salary,
                        status: item.status,
                      })),
                      "payroll-report.csv",
                    )
                  }
                  disabled={!payrollData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      payrollData.map((item) => ({
                        employeeId: item.employeeId,
                        periodStart: item.period_start,
                        periodEnd: item.period_end,
                        baseSalary: item.base_salary,
                        allowances: item.allowances,
                        deductions: item.deductions,
                        netSalary: item.net_salary,
                        status: item.status,
                      })),
                      "payroll-report.xls",
                    )
                  }
                  disabled={!payrollData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: payrollData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : payrollData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee_id")}</TableHead>
                      <TableHead>{t("period")}</TableHead>
                      <TableHead>{t("net_salary")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.employeeId}</TableCell>
                        <TableCell>{row.period_start} - {row.period_end}</TableCell>
                        <TableCell>{row.net_salary}</TableCell>
                        <TableCell>{t(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruitment">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("report_type_recruitment")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      recruitmentData.map((item) => ({
                        name: item.name,
                        email: item.email || "",
                        phone: item.phone || "",
                        position: item.position,
                        status: item.status,
                        appliedAt: item.applied_at || "",
                      })),
                      "recruitment-report.csv",
                    )
                  }
                  disabled={!recruitmentData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      recruitmentData.map((item) => ({
                        name: item.name,
                        email: item.email || "",
                        phone: item.phone || "",
                        position: item.position,
                        status: item.status,
                        appliedAt: item.applied_at || "",
                      })),
                      "recruitment-report.xls",
                    )
                  }
                  disabled={!recruitmentData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: recruitmentData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : recruitmentData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("job_title")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruitmentData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email || "-"}</TableCell>
                        <TableCell>{row.position}</TableCell>
                        <TableCell>{t(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("report_type_performance")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      performanceData.map((item) => ({
                        employeeId: item.employeeId,
                        period: item.period,
                        rating: item.rating,
                        reviewer: item.reviewerName || "",
                        notes: item.notes || "",
                      })),
                      "performance-report.csv",
                    )
                  }
                  disabled={!performanceData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      performanceData.map((item) => ({
                        employeeId: item.employeeId,
                        period: item.period,
                        rating: item.rating,
                        reviewer: item.reviewerName || "",
                        notes: item.notes || "",
                      })),
                      "performance-report.xls",
                    )
                  }
                  disabled={!performanceData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: performanceData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : performanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee_id")}</TableHead>
                      <TableHead>{t("period")}</TableHead>
                      <TableHead>{t("rating")}</TableHead>
                      <TableHead>{t("reviewer")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.employeeId}</TableCell>
                        <TableCell>{row.period}</TableCell>
                        <TableCell>{row.rating}</TableCell>
                        <TableCell>{row.reviewerName || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="training">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("report_type_training")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      trainingData.map((item) => ({
                        employeeId: item.employeeId,
                        title: item.title,
                        provider: item.provider || "",
                        startDate: item.start_date || "",
                        endDate: item.end_date || "",
                        status: item.status,
                      })),
                      "training-report.csv",
                    )
                  }
                  disabled={!trainingData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      trainingData.map((item) => ({
                        employeeId: item.employeeId,
                        title: item.title,
                        provider: item.provider || "",
                        startDate: item.start_date || "",
                        endDate: item.end_date || "",
                        status: item.status,
                      })),
                      "training-report.xls",
                    )
                  }
                  disabled={!trainingData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: trainingData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : trainingData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee_id")}</TableHead>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("provider")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.employeeId}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.provider || "-"}</TableCell>
                        <TableCell>{t(`training_status_${row.status}`)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("report_type_assets")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      assetsData.map((item) => ({
                        name: item.name,
                        serial: item.serial_number || "",
                        category: item.category || "",
                        status: item.status,
                        assignedTo: item.assignedTo || "",
                      })),
                      "assets-report.csv",
                    )
                  }
                  disabled={!assetsData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      assetsData.map((item) => ({
                        name: item.name,
                        serial: item.serial_number || "",
                        category: item.category || "",
                        status: item.status,
                        assignedTo: item.assignedTo || "",
                      })),
                      "assets-report.xls",
                    )
                  }
                  disabled={!assetsData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: assetsData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : assetsData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("asset_name")}</TableHead>
                      <TableHead>{t("serial_number")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetsData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.serial_number || "-"}</TableCell>
                        <TableCell>{row.category || "-"}</TableCell>
                        <TableCell>{t(`asset_status_${row.status}`)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discipline">
          <Card className="bg-card border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("report_type_discipline")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportCsv(
                      attendanceData.map((item) => ({
                        employeeId: item.employeeId,
                        name: item.employeeName || "",
                        date: item.date,
                        status: item.status,
                      })),
                      "discipline-report.csv",
                    )
                  }
                  disabled={!attendanceData.length}
                >
                  {t("export_csv")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleExportExcel(
                      attendanceData.map((item) => ({
                        employeeId: item.employeeId,
                        name: item.employeeName || "",
                        date: item.date,
                        status: item.status,
                      })),
                      "discipline-report.xls",
                    )
                  }
                  disabled={!attendanceData.length}
                >
                  {t("export_excel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("records_count", { count: attendanceData.length })}</p>
              {loading ? (
                <LoadingState label={t("loading")} />
              ) : attendanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee_id")}</TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.slice(0, 10).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.employeeId}</TableCell>
                        <TableCell>{row.employeeName || "-"}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{t(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { 
  generateAttendanceReport, 
  generateLeavesReport, 
  downloadPDF 
} from "@/shared/lib/pdf-reports";
import { exportToCsv, exportToExcelXml } from "@/shared/lib/export";
import type { 
  Attendance, 
  Leave, 
  PayrollRecord, 
  RecruitmentCandidate, 
  PerformanceReview, 
  TrainingRecord, 
  Asset,
  AuditLog,
} from "@/types/api";

export const formatEmployeeRef = (item: {
  employeeId?: string;
  employeeCode?: string;
}) => item.employeeCode || item.employeeId || "-";

export const formatEmployeeName = (item: {
  employeeName?: string;
  employeeCode?: string;
  employeeId?: string;
}) => item.employeeName || item.employeeCode || item.employeeId || "-";

export const formatAssignedTo = (item: Asset) =>
  item.assignedToName || item.assignedToCode || item.assignedTo || "-";

export const reportExport = {
  attendancePdf: (data: Attendance[], range: string) => {
    const report = generateAttendanceReport(
      data.map((item) => ({
        employeeId: formatEmployeeRef(item),
        name: formatEmployeeName(item),
        date: item.date,
        checkIn: item.checkIn || "-",
        checkOut: item.checkOut || "-",
        workHours: item.workHours || "-",
        status: item.status,
      })),
      range
    );
    downloadPDF(report, "attendance-report");
  },

  leavesPdf: (data: Leave[], title: string) => {
    const report = generateLeavesReport(
      data.map((item) => ({
        employeeName: formatEmployeeName(item),
        leaveType: item.leaveType,
        startDate: item.startDate,
        endDate: item.endDate,
        days: item.days || 0,
        status: item.status,
        reason: item.reason,
      })),
      title
    );
    downloadPDF(report, "leave-report");
  },

  csv: (rows: Record<string, unknown>[], filename: string) => {
    exportToCsv(rows, filename);
  },

  excel: (rows: Record<string, unknown>[], filename: string) => {
    exportToExcelXml(rows, filename);
  },

  // Mappers for structured data
  mappers: {
    attendance: (data: Attendance[]) => data.map(item => ({
      employeeId: formatEmployeeRef(item),
      name: formatEmployeeName(item),
      date: item.date,
        status: item.status,
        checkIn: item.checkIn || "-",
        checkOut: item.checkOut || "-",
        workHours: item.workHours || "-",
    })),
    leaves: (data: Leave[]) => data.map(item => ({
      employeeName: formatEmployeeName(item),
      leaveType: item.leaveType,
      startDate: item.startDate,
      endDate: item.endDate,
      days: item.days || 0,
      status: item.status,
    })),
    payroll: (data: PayrollRecord[]) => data.map(item => ({
      employeeId: formatEmployeeRef(item),
      employeeName: formatEmployeeName(item),
      periodStart: item.period_start,
      periodEnd: item.period_end,
      baseSalary: item.base_salary,
      allowances: item.allowances,
      deductions: item.deductions,
      netSalary: item.net_salary,
      status: item.status,
    })),
    recruitment: (data: RecruitmentCandidate[]) => data.map(item => ({
      name: item.name,
      email: item.email || "",
      phone: item.phone || "",
      position: item.position,
      status: item.status,
      appliedAt: item.applied_at || "",
    })),
    performance: (data: PerformanceReview[]) => data.map(item => ({
      employeeId: formatEmployeeRef(item),
      employeeName: formatEmployeeName(item),
      period: item.period,
      rating: item.rating,
      reviewer: item.reviewerName || "",
      notes: item.notes || "",
    })),
    training: (data: TrainingRecord[]) => data.map(item => ({
      employeeId: formatEmployeeRef(item),
      employeeName: formatEmployeeName(item),
      title: item.title,
      provider: item.provider || "",
      startDate: item.start_date || "",
      endDate: item.end_date || "",
      status: item.status,
    })),
    assets: (data: Asset[]) => data.map(item => ({
      name: item.name,
      serial: item.serial_number || "",
      category: item.category || "",
      status: item.status,
      assignedTo: formatAssignedTo(item),
    })),
    audit: (data: AuditLog[]) => data.map(item => ({
      userName: item.userName || item.user || "-",
      action: item.action,
      model: item.model_name,
      objectId: item.object_id,
      date: item.created_at || "-",
    }))
  }
};

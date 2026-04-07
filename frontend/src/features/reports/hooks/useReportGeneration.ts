import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/shared/hooks/use-toast";
import { getAttendanceReport as fetchAttendance } from "@/features/attendance/api/attendance";
import { getLeavesReport as fetchLeaves } from "@/features/leaves/api/leaves";
import { getPayrollReport as fetchPayroll } from "@/features/payroll/api/payroll";
import { getRecruitmentReport as fetchRecruitment } from "@/features/recruitment/api/recruitment";
import { getPerformanceReport as fetchPerformance } from "@/features/performance/api/performance";
import { getTrainingReport as fetchTraining } from "@/features/training/api/training";
import { getAssetsReport as fetchAssets } from "@/features/assets/api/assets";
import { reportExport } from "../lib/report-export";
import type { Asset, ReportType } from "@/types/api";
import type { AuditLog } from "@/features/audit-logs/types";
import type { Attendance } from "@/features/attendance/types";
import type { Leave } from "@/features/leaves/types";
import type { PayrollRecord } from "@/features/payroll/types";
import type { RecruitmentCandidate } from "@/features/recruitment/types";
import type { PerformanceReview } from "@/features/performance/types";
import type { TrainingRecord } from "@/features/training/types";

type ReportFilters = {
  start?: string;
  end?: string;
  department?: string;
  jobTitle?: string;
  status?: string;
};

type ReportDataByType = {
  attendance: Attendance[];
  leaves: Leave[];
  payroll: PayrollRecord[];
  recruitment: RecruitmentCandidate[];
  performance: PerformanceReview[];
  training: TrainingRecord[];
  assets: Asset[];
  audit: AuditLog[];
};

type ReportDataset = ReportDataByType[ReportType];

export function useReportGeneration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportDataset>([]);

  const generateReport = async (type: ReportType, filters: ReportFilters) => {
    setLoading(true);
    try {
      let result: ReportDataset = [];
      switch (type) {
        case "attendance":
          result = await fetchAttendance(filters);
          break;
        case "leaves":
          result = await fetchLeaves(filters);
          break;
        case "payroll":
          result = await fetchPayroll(filters);
          break;
        case "recruitment":
          result = await fetchRecruitment(filters);
          break;
        case "performance":
          result = await fetchPerformance(filters);
          break;
        case "training":
          result = await fetchTraining(filters);
          break;
        case "assets":
          result = await fetchAssets(filters);
          break;
        case "audit":
        default:
          result = [];
      }
      setData(result);
    } catch (error) {
      console.error("Failed to generate report", error);
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPdf = (type: ReportType, reportData: ReportDataset) => {
    const range = "Recent Report"; // Simplified for now
    if (type === "attendance") {
      reportExport.attendancePdf(reportData as Attendance[], range);
    } else if (type === "leaves") {
      reportExport.leavesPdf(reportData as Leave[], "Leave Report");
    } else {
      toast({
        title: "Not Implemented",
        description: `PDF export for ${type} is coming soon.`,
      });
    }
  };

  const exportToCsv = (type: ReportType, reportData: ReportDataset) => {
    const mapper = reportExport.mappers[type];
    const rows = mapper ? mapper(reportData as never) : [];
    reportExport.csv(rows, `${type}-report.csv`);
  };

  const exportToExcel = (type: ReportType, reportData: ReportDataset) => {
    const mapper = reportExport.mappers[type];
    const rows = mapper ? mapper(reportData as never) : [];
    reportExport.excel(rows, `${type}-report.xlsx`);
  };

  return {
    data,
    loading,
    generateReport,
    exportToPdf,
    exportToCsv,
    exportToExcel,
  };
}

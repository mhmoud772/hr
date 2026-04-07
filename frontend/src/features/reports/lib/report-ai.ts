import { aiApi } from "@/features/ai/api/ai";
import { TFunction } from "i18next";
import type { 
  Attendance, 
  AuditLog,
  Leave, 
  PayrollRecord, 
  RecruitmentCandidate, 
  PerformanceReview, 
  TrainingRecord, 
  Asset,
  ReportType
} from "@/types/api";

export type ReportData = 
  | Attendance[] 
  | Leave[] 
  | PayrollRecord[] 
  | RecruitmentCandidate[] 
  | PerformanceReview[] 
  | TrainingRecord[] 
  | Asset[]
  | AuditLog[];

export const generateReportPrompt = (
  type: ReportType, 
  data: ReportData, 
  t: TFunction
) => {
  const reportTypeName = t(`report_type_${type}`);
  const dataString = JSON.stringify(data);
  
  const hints: Record<string, string> = {
    attendance: "Look for patterns of absenteeism, late arrivals, or overtime trends.",
    leaves: "Identify high leave periods or types of leave that might impact productivity.",
    payroll: "Analyze salary distributions and identify top cost centers or outliers.",
    recruitment: "Evaluate candidate status distribution and time-to-hire if applicable.",
    performance: "Identify top performers and areas where low ratings are concentrated.",
    training: "Assess the completion rate and diversity of training topics provided.",
    assets: "Report on asset utilization, categories, and maintenance status.",
    audit: "Identify unusual system activities, frequency of deletions, or critical manual updates."
  };

  const hint = hints[type] || "";
  
  return t('ai_analyze_prompt', {
    report: reportTypeName,
    data: dataString,
    hint,
    defaultValue: `You are an HR analyst. Analyze this ${reportTypeName} report data. ${hint} Provide exactly 3 concise, actionable insights or potential issues. Data: ${dataString}`
  });
};

export const reportAi = {
  analyze: async (type: ReportType, data: ReportData, t: TFunction) => {
    const prompt = generateReportPrompt(type, data, t);
    const response = await aiApi.query({ prompt });
    return response.answer;
  }
};

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { reportAi, type ReportData } from "../lib/report-ai";
import type { ReportType } from "@/types/api";

export function useReportAI() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const analyzeData = async (type: ReportType, data: ReportData) => {
    if (!data || data.length === 0) {
      toast({ 
        title: t("no_data"), 
        description: t("ai_generate_first", "Generate a report first before analyzing."), 
        variant: "destructive" 
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      // Data as ReportData to satisfy lib type
      const result = await reportAi.analyze(type, data as ReportData, t);
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
      toast({
        title: t("error"),
        description: t("ai_summary_error", "Could not generate AI insights at this time."),
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analysis,
    analyzing: isAnalyzing,
    analyzeData,
    aiAnalysis: analysis,
    isAnalyzing: isAnalyzing,
    analyzeReport: analyzeData,
    setAiAnalysis: setAnalysis,
    isEnabled: true
  };
}

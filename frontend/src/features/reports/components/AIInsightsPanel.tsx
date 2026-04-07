import React from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface AIInsightsPanelProps {
  aiAnalysis: string | null;
  isAIEnabled: boolean;
}

export function AIInsightsPanel({ aiAnalysis, isAIEnabled }: AIInsightsPanelProps) {
  const { t } = useTranslation();

  if (!isAIEnabled || !aiAnalysis) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <CardTitle className="text-sm font-semibold text-primary">
          {t('ai_report_insights_title', "AI Report Insights")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 px-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {aiAnalysis}
      </CardContent>
    </Card>
  );
}

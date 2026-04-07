import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { aiApi } from '../api/ai';
import type { AIResponse } from '../types';
import { useTranslation } from 'react-i18next';

export const AIDashboardSummary: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isRtl = i18n.language === "ar";

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiApi.getDashboardSummary();
      setResponse(data);
    } catch (err) {
      console.error('Failed to fetch AI summary', err);
      setError(t('ai_summary_error', 'Could not generate AI insights at this time.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-md overflow-hidden relative group transition-all duration-300 hover:shadow-lg">
      <div className={`absolute top-0 p-4 opacity-5 transition-opacity pointer-events-none group-hover:opacity-10 ${isRtl ? "left-0" : "right-0"}`}>
        <Sparkles className="w-16 h-16 text-primary" />
      </div>

      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            {t('ai_executive_summary', 'AI Executive Summary')}
            {response?.isMock && (
              <span
                className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal"
                data-testid="ai-summary-demo-badge"
              >
                {t('ai_demo_badge', 'Demo')}
              </span>
            )}
          </CardTitle>
          {error && !loading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary transition-transform active:rotate-180"
              onClick={fetchSummary}
              title={t('retry', 'Retry')}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2 py-2" data-testid="ai-summary-loading">
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t('ai_analyzing_health', 'Analyzing system health...')}</span>
            </div>
          </div>
        ) : error ? (
          <div
            className="flex items-center gap-3 py-3 text-destructive/90 bg-destructive/5 rounded-lg px-3 border border-destructive/10 animate-in fade-in zoom-in-95 duration-300"
            data-testid="ai-summary-error"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-4">
              <span className="text-sm font-medium">{error}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={fetchSummary}
              >
                {t('retry', 'Retry')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
            <p
              className={`text-sm leading-relaxed text-foreground/90 font-medium italic ${isRtl ? "pl-8" : "pr-8"}`}
              data-testid="ai-summary-content"
            >
              "{response?.answer}"
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t("ai_powered_by")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

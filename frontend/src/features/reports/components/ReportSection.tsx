import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { TabsContent } from "@/shared/ui/tabs";

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

interface ReportSectionProps<T> {
  value: string;
  title: string;
  data: T[];
  loading: boolean;
  columns: Column<T>[];
  onExportPdf?: () => void;
  onExportCsv?: () => void;
  onExportExcel?: () => void;
}

export function ReportSection<T extends { id: string | number }>({
  value,
  title,
  data,
  loading,
  columns,
  onExportPdf,
  onExportCsv,
  onExportExcel,
}: ReportSectionProps<T>) {
  const { t } = useTranslation();

  return (
    <TabsContent value={value}>
      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {onExportPdf && (
              <Button variant="outline" onClick={onExportPdf} disabled={!data.length}>
                {t("export_pdf")}
              </Button>
            )}
            {onExportCsv && (
              <Button variant="outline" onClick={onExportCsv} disabled={!data.length}>
                {t("export_csv")}
              </Button>
            )}
            {onExportExcel && (
              <Button variant="outline" onClick={onExportExcel} disabled={!data.length}>
                {t("export_excel")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("records_count", { count: data.length })}
          </p>
          {loading ? (
            <LoadingState label={t("loading")} />
          ) : data.length > 0 ? (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {columns.map((col, idx) => (
                      <TableHead key={idx}>{col.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 50).map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((col, idx) => (
                        <TableCell key={idx}>{col.render(row)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.length > 50 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20 border-t border-border/60">
                  {t("showing_top_records", { count: 50 })}
                </div>
              )}
            </div>
          ) : (
            <EmptyState title={t("no_data")} description={t("generate_report_hint")} />
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

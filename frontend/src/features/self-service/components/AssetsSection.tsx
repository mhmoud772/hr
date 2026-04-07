import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useSelfServiceData } from "../hooks/useSelfServiceData";
import type { Asset } from "@/features/assets/types";

export function AssetsSection({ employeeId }: { employeeId?: string }) {
  const { t } = useTranslation();
  const { assetsQuery, assignedAssets } = useSelfServiceData(employeeId);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_assets")}</CardTitle>
      </CardHeader>
      <CardContent>
        {assetsQuery.isLoading ? (
          <LoadingState label={t("loading")} />
        ) : assetsQuery.isError ? (
          <EmptyState icon={AlertTriangle} title={t("error_loading")} />
        ) : assignedAssets.length ? (
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
              {assignedAssets.map((asset: Asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.serial_number || "-"}</TableCell>
                  <TableCell>{asset.category || "-"}</TableCell>
                  <TableCell>{t(`asset_status_${asset.status}`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">{t("no_data")}</p>
        )}
      </CardContent>
    </Card>
  );
}

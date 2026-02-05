import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
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
import { useAssetsQuery, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/features/assets/hooks/useAssets";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import type { Asset } from "@/types/api";

const assetStatuses = ["available", "assigned", "maintenance", "retired"];

export default function Assets() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const query = useAssetsQuery();
  const employeesQuery = useEmployeesQuery();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    serial_number: "",
    category: "",
    status: "available",
    assignedTo: "",
    notes: "",
  });

  const openAdd = () => {
    setSelected(null);
    setFormData({
      name: "",
      serial_number: "",
      category: "",
      status: "available",
      assignedTo: "",
      notes: "",
    });
    setFormOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setSelected(asset);
    setFormData({
      name: asset.name || "",
      serial_number: asset.serial_number || "",
      category: asset.category || "",
      status: asset.status || "available",
      assignedTo: asset.assignedTo || "",
      notes: asset.notes || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      return;
    }
    const payload = {
      name: formData.name,
      serial_number: formData.serial_number,
      category: formData.category,
      status: formData.status,
      assignedTo: formData.assignedTo || null,
      notes: formData.notes,
    };
    try {
      if (selected?.id) {
        await updateAsset.mutateAsync({ id: selected.id, data: payload });
      } else {
        await createAsset.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAsset.mutateAsync(id);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("assets_title")}</h1>
          <p className="text-muted-foreground">{t("assets_subtitle")}</p>
        </div>
        <Button onClick={openAdd}>{t("add")}</Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle>{t("assets_list")}</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <LoadingState label={t("loading")} />
          ) : query.isError ? (
            <EmptyState icon={AlertTriangle} title={t("error_loading")} />
          ) : query.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("asset_name")}</TableHead>
                  <TableHead>{t("serial_number")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.serial_number || "-"}</TableCell>
                    <TableCell>{t(`asset_status_${asset.status}`)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(asset)}>
                          {t("edit")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(String(asset.id))}>
                          {t("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("no_data")}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selected ? t("edit") : t("add")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("asset_name")}</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("serial_number")}</Label>
                <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("status")}</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`asset_status_${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("assigned_to")}</Label>
              <Select
                value={formData.assignedTo || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignedTo: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_employee")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("none")}</SelectItem>
                  {(employeesQuery.data?.results || []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">{selected ? t("save") : t("add")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

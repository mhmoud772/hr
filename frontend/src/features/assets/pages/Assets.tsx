import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { AlertTriangle, Edit, Trash2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
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
import { PageHero } from "@/shared/components/PageHero";
import { TableToolbar } from "@/shared/components/TableToolbar";
import { parseSortValue, sortRows } from "@/shared/lib/tableUtils";
import { IconActionButton } from "@/shared/components/IconActionButton";

const assetStatuses = ["available", "assigned", "maintenance", "retired"];

export default function Assets() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const query = useAssetsQuery();
  const employeesQuery = useEmployeesQuery();
  const isRtl = i18n.language?.startsWith("ar");
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortValue, setSortValue] = useState("name:asc");
  const employees = useMemo(() => employeesQuery.data?.results ?? [], [employeesQuery.data?.results]);
  const employeeNameById = useMemo(
    () => new Map(employees.map((emp) => [String(emp.id), emp.name])),
    [employees],
  );
  const getAssignedName = (id?: string | number | null) =>
    id ? employeeNameById.get(String(id)) || String(id) : t("none");

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

  const filteredAssets = useMemo(() => {
    const list = query.data ?? [];
    return list.filter((asset) => {
      const matchesSearch =
        !search ||
        [asset.name, asset.serial_number, asset.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [query.data, search, statusFilter]);

  const { key: sortKey, direction } = parseSortValue(sortValue);
  const sortedAssets = useMemo(
    () =>
      sortRows(
        filteredAssets,
        sortKey,
        direction,
        {
          name: (asset) => asset.name,
          status: (asset) => asset.status,
          serial: (asset) => asset.serial_number,
          category: (asset) => asset.category,
        },
      ),
    [filteredAssets, sortKey, direction],
  );

  const getAssetStatusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "success";
      case "assigned":
        return "info";
      case "maintenance":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("assets_title")}
        subtitle={t("assets_subtitle")}
        icon={Package}
        actions={<Button onClick={openAdd}>{t("add_asset")}</Button>}
      />

      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardContent className="p-4">
          <TableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search_assets"),
            }}
            filters={
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {assetStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`asset_status_${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            sort={{
              value: sortValue,
              onChange: setSortValue,
              options: [
                { value: "name:asc", label: t("sort_name_asc") },
                { value: "status:asc", label: t("sort_status") },
                { value: "category:asc", label: t("sort_category") },
                { value: "serial:asc", label: t("sort_serial") },
              ],
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t("assets_list")}</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <LoadingState label={t("loading")} />
          ) : query.isError ? (
            <EmptyState icon={AlertTriangle} title={t("error_loading")} />
          ) : sortedAssets.length ? (
            <>
              <div className="md:hidden space-y-3">
                {sortedAssets.map((asset) => (
                  <div key={asset.id} className="rounded-lg border border-border/60 bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{asset.name}</div>
                        <div className="text-xs text-muted-foreground">{asset.serial_number || "-"}</div>
                        <div className="text-xs text-muted-foreground">{asset.category || "-"}</div>
                        <div className="text-xs text-muted-foreground">{getAssignedName(asset.assignedTo)}</div>
                      </div>
                      <Badge variant={getAssetStatusVariant(asset.status)}>{t(`asset_status_${asset.status}`)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <IconActionButton label={t("edit")} onClick={() => openEdit(asset)}>
                        <Edit className="w-4 h-4" />
                      </IconActionButton>
                      <IconActionButton
                        label={t("delete")}
                        className="text-destructive"
                        onClick={() => handleDelete(String(asset.id))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconActionButton>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("asset_name")}</TableHead>
                      <TableHead>{t("serial_number")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("assigned_to")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.serial_number || "-"}</TableCell>
                        <TableCell>{asset.category || "-"}</TableCell>
                        <TableCell>{getAssignedName(asset.assignedTo)}</TableCell>
                        <TableCell>
                          <Badge variant={getAssetStatusVariant(asset.status)}>
                            {t(`asset_status_${asset.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <IconActionButton label={t("edit")} onClick={() => openEdit(asset)}>
                              <Edit className="w-4 h-4" />
                            </IconActionButton>
                            <IconActionButton
                              label={t("delete")}
                              className="text-destructive"
                              onClick={() => handleDelete(String(asset.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconActionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyState title={t("no_data")} />
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{selected ? t("edit") : t("add")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("asset_name")}</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("serial_number")}</Label>
                <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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



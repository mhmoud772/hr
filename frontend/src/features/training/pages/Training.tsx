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
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useTrainingQuery, useCreateTraining, useUpdateTraining, useDeleteTraining } from "@/features/training/hooks/useTraining";
import type { TrainingRecord } from "@/types/api";

const trainingStatuses = ["planned", "in_progress", "completed", "cancelled"];

export default function Training() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const query = useTrainingQuery();
  const employeesQuery = useEmployeesQuery();
  const createTraining = useCreateTraining();
  const updateTraining = useUpdateTraining();
  const deleteTraining = useDeleteTraining();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TrainingRecord | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    title: "",
    provider: "",
    start_date: "",
    end_date: "",
    status: "planned",
    notes: "",
  });

  const openAdd = () => {
    setSelected(null);
    setFormData({
      employeeId: "",
      title: "",
      provider: "",
      start_date: "",
      end_date: "",
      status: "planned",
      notes: "",
    });
    setFormOpen(true);
  };

  const openEdit = (record: TrainingRecord) => {
    setSelected(record);
    setFormData({
      employeeId: record.employeeId,
      title: record.title,
      provider: record.provider || "",
      start_date: record.start_date || "",
      end_date: record.end_date || "",
      status: record.status,
      notes: record.notes || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.title.trim()) {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      return;
    }
    try {
      if (selected?.id) {
        await updateTraining.mutateAsync({ id: selected.id, data: formData });
      } else {
        await createTraining.mutateAsync(formData);
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTraining.mutateAsync(id);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("training_title")}</h1>
          <p className="text-muted-foreground">{t("training_subtitle")}</p>
        </div>
        <Button onClick={openAdd}>{t("add")}</Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle>{t("training_records")}</CardTitle>
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
                  <TableHead>{t("employee_id")}</TableHead>
                  <TableHead>{t("title")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employeeId}</TableCell>
                    <TableCell>{record.title}</TableCell>
                    <TableCell>{t(`training_status_${record.status}`)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(record)}>
                          {t("edit")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(String(record.id))}>
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
            <div className="space-y-2">
              <Label>{t("employee_id")}</Label>
              <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_employee")} />
                </SelectTrigger>
                <SelectContent>
                  {(employeesQuery.data?.results || []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("title")}</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("provider")}</Label>
                <Input value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("from_date")}</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("to_date")}</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("status")}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trainingStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`training_status_${status}`)}
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

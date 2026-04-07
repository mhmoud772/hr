import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { AlertTriangle, GraduationCap, CheckCircle2, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHero } from "@/shared/components/PageHero";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
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
import type { ApiTrainingRecordRequest, ApiPatchedTrainingRecordRequest } from "@/types/contracts";

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
      const payload: ApiTrainingRecordRequest = {
        employee: parseInt(formData.employeeId, 10),
        title: formData.title,
        provider: formData.provider || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      };
      if (selected?.id) {
        await updateTraining.mutateAsync({ id: selected.id, data: payload as ApiPatchedTrainingRecordRequest });
      } else {
        await createTraining.mutateAsync(payload);
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

  const totalTraining = query.data?.length || 0;
  const completedTraining = query.data?.filter(r => r.status === "completed").length || 0;
  const inProgressTraining = query.data?.filter(r => r.status === "in_progress").length || 0;

  const spotlightMetrics = [
    {
      label: t("total_records"),
      value: totalTraining,
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      label: t("training_status_completed"),
      value: completedTraining,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: t("training_status_in_progress"),
      value: inProgressTraining,
      icon: Clock,
      color: "text-warning",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("training_title")}
        subtitle={t("training_subtitle")}
        icon={GraduationCap}
        metrics={spotlightMetrics.map((item, index) => ({
          label: item.label,
          value: item.value,
          icon: item.icon,
          tone: index === 0 ? "primary" : index === 1 ? "success" : "warning",
        }))}
        actions={
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        }
      />

      <Card className="bg-card/90 border border-border/60 shadow-sm">
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
            <EmptyState 
              icon={GraduationCap} 
              title={t("no_data")} 
              description={t("training_no_records_desc", "No training records found. You can add new sessions here.")}
              actionLabel={t("add_training_record")}
              onAction={openAdd}
            />
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
                <DatePicker value={formData.start_date} onChange={(date) => setFormData({ ...formData, start_date: date })} />
              </div>
              <div className="space-y-2">
                <Label>{t("to_date")}</Label>
                <DatePicker value={formData.end_date} onChange={(date) => setFormData({ ...formData, end_date: date })} />
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

import { useShifts, useCreateShift, useUpdateShift, useDeleteShift } from "../hooks/use-shifts";
import { Button } from "@/shared/ui/button";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/shared/ui/table";
import { Plus, Trash2, Pencil, Clock, Download } from "lucide-react";
import { LoadingState } from "@/shared/components/LoadingState";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import type { Shift } from "@/types/api";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/shared/lib/api-client";
import { useToast } from "@/shared/hooks/use-toast";

// ── Zod Schema ──────────────────────────────────────────────────
const shiftSchema = z.object({
  name: z.string().min(2, "shift_name_min"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "time_format_invalid"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "time_format_invalid"),
  grace_period_minutes: z.coerce.number().min(0).max(120),
  description: z.string().optional(),
}).refine(d => d.start_time !== d.end_time, {
  message: "times_same_error",
  path: ["end_time"],
});

type ShiftForm = z.infer<typeof shiftSchema>;

// ── ShiftFormDialog ──────────────────────────────────────────────
function ShiftFormDialog({
  open,
  onOpenChange,
  shift,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shift?: Shift | null;
}) {
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const { t } = useTranslation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: shift?.name ?? "",
      start_time: shift?.start_time ?? "08:00",
      end_time: shift?.end_time ?? "16:00",
      grace_period_minutes: shift?.grace_period_minutes ?? 15,
      description: shift?.description ?? "",
    },
  });

  const onSubmit = async (data: ShiftForm) => {
    if (shift?.id) {
      await updateShift.mutateAsync({ id: shift.id, data });
    } else {
      await createShift.mutateAsync(data);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {shift ? t("edit_shift") : t("add_shift")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="shift-name">{t("shift_name")} *</Label>
            <Input id="shift-name" {...register("name")} placeholder={t("shift_name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as string)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="start-time">{t("start_time")} *</Label>
              <Input id="start-time" type="time" {...register("start_time")} />
              {errors.start_time && <p className="text-xs text-destructive">{t(errors.start_time.message as string)}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-time">{t("end_time")} *</Label>
              <Input id="end-time" type="time" {...register("end_time")} />
              {errors.end_time && <p className="text-xs text-destructive">{t(errors.end_time.message as string)}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="grace-period">{t("grace_period_minutes")}</Label>
            <Input id="grace-period" type="number" min={0} max={120} {...register("grace_period_minutes")} />
            {errors.grace_period_minutes && (
              <p className="text-xs text-destructive">{t(errors.grace_period_minutes.message as string)}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">{t("description")}</Label>
            <Input id="description" {...register("description")} placeholder={t("description")} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t("loading") : shift ? t("update_shift") : t("save_shift")}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Shifts() {
  const { data: shifts, isLoading } = useShifts();
  const deleteShift = useDeleteShift();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const handleEdit = (shift: Shift) => {
    setSelectedShift(shift);
    setFormOpen(true);
  };

  const handleDelete = (shift: Shift) => {
    setSelectedShift(shift);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedShift) return;
    await deleteShift.mutateAsync(selectedShift.id);
    setDeleteOpen(false);
  };

  const handleExportExcel = async () => {
    try {
      const res = await apiClient.get("/attendance/export_excel/", { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("export_failed"), variant: "destructive" });
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{t("shifts_schedules")}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-1 sm:line-clamp-none">
            {t("shifts_schedules_subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={handleExportExcel} size="sm" className="gap-2 h-9">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("export_excel")}</span>
          </Button>
          <Button onClick={() => { setSelectedShift(null); setFormOpen(true); }} size="sm" className="gap-2 h-9">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("add_shift")}</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("total_shifts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{shifts?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("morning_shifts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {shifts?.filter(s => parseInt(s.start_time) < 12).length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("evening_night_shifts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {shifts?.filter(s => parseInt(s.start_time) >= 12).length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("shift_name")}</TableHead>
                <TableHead>{t("shift_start")}</TableHead>
                <TableHead>{t("shift_end")}</TableHead>
                <TableHead>{t("grace_period")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead className="w-[100px] text-center">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts?.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{shift.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      {shift.start_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {shift.end_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{shift.grace_period_minutes ?? 0} {t("minutes")}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {shift.description || t("no_description", "—")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shift)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shift)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {shifts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {t("no_data")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ShiftFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        shift={selectedShift}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_shift_title")}
        description={t("delete_shift_desc")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

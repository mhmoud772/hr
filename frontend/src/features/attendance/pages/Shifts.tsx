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
  name_en: z.string().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "time_format_invalid"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "time_format_invalid"),
  grace_period_minutes: z.coerce.number().min(0).max(120),
  break_duration_minutes: z.coerce.number().min(0).max(120).default(0),
  is_overnight: z.boolean().default(false),
  working_sun: z.boolean().default(true),
  working_mon: z.boolean().default(true),
  working_tue: z.boolean().default(true),
  working_wed: z.boolean().default(true),
  working_thu: z.boolean().default(true),
  working_fri: z.boolean().default(false),
  working_sat: z.boolean().default(false),
  description: z.string().optional(),
  description_en: z.string().optional(),
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
      name_en: shift?.name_en ?? "",
      start_time: shift?.start_time ?? "08:00",
      end_time: shift?.end_time ?? "16:00",
      grace_period_minutes: shift?.grace_period_minutes ?? 15,
      break_duration_minutes: shift?.break_duration_minutes ?? 0,
      is_overnight: shift?.is_overnight ?? false,
      working_sun: shift?.working_sun ?? true,
      working_mon: shift?.working_mon ?? true,
      working_tue: shift?.working_tue ?? true,
      working_wed: shift?.working_wed ?? true,
      working_thu: shift?.working_thu ?? true,
      working_fri: shift?.working_fri ?? false,
      working_sat: shift?.working_sat ?? false,
      description: shift?.description ?? "",
      description_en: shift?.description_en ?? "",
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

          <div className="space-y-1">
            <Label htmlFor="shift-name-en">{t("shift_name_en", { defaultValue: "Shift Name (English)" })}</Label>
            <Input id="shift-name-en" {...register("name_en")} placeholder="Morning Shift" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="grace-period">{t("grace_period_minutes")}</Label>
              <Input id="grace-period" type="number" min={0} max={120} {...register("grace_period_minutes")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="break-duration">{t("break_duration_minutes", { defaultValue: "Break Duration (min)" })}</Label>
              <Input id="break-duration" type="number" min={0} max={120} {...register("break_duration_minutes")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="description">{t("description")}</Label>
              <Input id="description" {...register("description")} placeholder={t("description")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description-en">{t("description_en", { defaultValue: "Description (EN)" })}</Label>
              <Input id="description-en" {...register("description_en")} placeholder="Description" />
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse py-2">
            <input
              type="checkbox"
              id="is_overnight"
              {...register("is_overnight")}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="is_overnight" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t("is_overnight")}
              <p className="text-[10px] text-muted-foreground font-normal">{t("overnight_shift_hint")}</p>
            </Label>
          </div>

          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            <Label className="text-xs font-semibold text-primary uppercase tracking-wider">{t("workdays_config")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "working_sun", label: t("working_sun") },
                { id: "working_mon", label: t("working_mon") },
                { id: "working_tue", label: t("working_tue") },
                { id: "working_wed", label: t("working_wed") },
                { id: "working_thu", label: t("working_thu") },
                { id: "working_fri", label: t("working_fri") },
                { id: "working_sat", label: t("working_sat") },
              ].map((day) => (
                <div key={day.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={day.id}
                    {...register(day.id as any)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={day.id} className="text-xs cursor-pointer">{day.label}</Label>
                </div>
              ))}
            </div>
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
                <TableHead>{t("break_duration")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead className="w-[100px] text-center">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts?.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary/70" />
                        <span className="font-bold text-foreground">
                          {i18n.language === "ar" ? shift.name : (shift.name_en || shift.name)}
                        </span>
                      </div>
                      {i18n.language !== "ar" && shift.name !== shift.name_en && (
                        <span className="text-[10px] text-muted-foreground mr-6 rtl:ml-6">{shift.name}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                      {shift.start_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200">
                      {shift.end_time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{shift.grace_period_minutes ?? 0} {t("min")}</span>
                      <span className="text-[10px] text-muted-foreground">{t("grace_period")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{shift.break_duration_minutes ?? 0} {t("min")}</span>
                      <span className="text-[10px] text-muted-foreground">{t("break_duration")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-muted-foreground text-sm truncate" title={shift.description}>
                      {shift.description || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shift)} className="hover:bg-primary/10 hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shift)} className="hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
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

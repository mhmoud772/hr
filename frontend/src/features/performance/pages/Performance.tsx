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
import { usePerformanceQuery, useCreatePerformance, useUpdatePerformance, useDeletePerformance } from "@/features/performance/hooks/usePerformance";
import type { PerformanceReview } from "@/types/api";

export default function Performance() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const query = usePerformanceQuery();
  const employeesQuery = useEmployeesQuery();
  const createReview = useCreatePerformance();
  const updateReview = useUpdatePerformance();
  const deleteReview = useDeletePerformance();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PerformanceReview | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    period: "",
    rating: "3",
    notes: "",
  });

  const openAdd = () => {
    setSelected(null);
    setFormData({ employeeId: "", period: "", rating: "3", notes: "" });
    setFormOpen(true);
  };

  const openEdit = (review: PerformanceReview) => {
    setSelected(review);
    setFormData({
      employeeId: review.employeeId,
      period: review.period,
      rating: String(review.rating || 3),
      notes: review.notes || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.period.trim()) {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      return;
    }
    const payload = {
      employeeId: formData.employeeId,
      period: formData.period,
      rating: Number(formData.rating),
      notes: formData.notes,
    };
    try {
      if (selected?.id) {
        await updateReview.mutateAsync({ id: selected.id, data: payload });
      } else {
        await createReview.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReview.mutateAsync(id);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("performance_title")}</h1>
          <p className="text-muted-foreground">{t("performance_subtitle")}</p>
        </div>
        <Button onClick={openAdd}>{t("add")}</Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle>{t("performance_reviews")}</CardTitle>
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
                  <TableHead>{t("period")}</TableHead>
                  <TableHead>{t("rating")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{review.employeeId}</TableCell>
                    <TableCell>{review.period}</TableCell>
                    <TableCell>{review.rating}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(review)}>
                          {t("edit")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(String(review.id))}>
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
                <Label>{t("period")}</Label>
                <Input value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} placeholder="2025-Q4" />
              </div>
              <div className="space-y-2">
                <Label>{t("rating")}</Label>
                <Input type="number" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} />
              </div>
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

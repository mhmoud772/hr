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
import { usePayrollQuery, useCreatePayroll, useUpdatePayroll, useDeletePayroll } from "@/features/payroll/hooks/usePayroll";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import type { PayrollRecord } from "@/types/api";

export default function Payroll() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const payrollQuery = usePayrollQuery();
  const employeesQuery = useEmployeesQuery();
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const deletePayroll = useDeletePayroll();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PayrollRecord | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    period_start: "",
    period_end: "",
    base_salary: "",
    allowances: "",
    deductions: "",
    status: "draft",
  });

  const openAdd = () => {
    setSelected(null);
    setFormData({
      employeeId: "",
      period_start: "",
      period_end: "",
      base_salary: "",
      allowances: "",
      deductions: "",
      status: "draft",
    });
    setFormOpen(true);
  };

  const openEdit = (record: PayrollRecord) => {
    setSelected(record);
    setFormData({
      employeeId: record.employeeId,
      period_start: record.period_start,
      period_end: record.period_end,
      base_salary: String(record.base_salary || 0),
      allowances: String(record.allowances || 0),
      deductions: String(record.deductions || 0),
      status: record.status,
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.period_start || !formData.period_end) {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      return;
    }
    const payload = {
      employeeId: formData.employeeId,
      period_start: formData.period_start,
      period_end: formData.period_end,
      base_salary: Number(formData.base_salary || 0),
      allowances: Number(formData.allowances || 0),
      deductions: Number(formData.deductions || 0),
      status: formData.status,
    };
    try {
      if (selected?.id) {
        await updatePayroll.mutateAsync({ id: selected.id, data: payload });
      } else {
        await createPayroll.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayroll.mutateAsync(id);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("payroll_title")}</h1>
          <p className="text-muted-foreground">{t("payroll_subtitle")}</p>
        </div>
        <Button onClick={openAdd}>{t("add")}</Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle>{t("payroll_records")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollQuery.isLoading ? (
            <LoadingState label={t("loading")} />
          ) : payrollQuery.isError ? (
            <EmptyState icon={AlertTriangle} title={t("error_loading")} />
          ) : payrollQuery.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("employee_id")}</TableHead>
                  <TableHead>{t("from_date")}</TableHead>
                  <TableHead>{t("to_date")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollQuery.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employeeId}</TableCell>
                    <TableCell>{record.period_start}</TableCell>
                    <TableCell>{record.period_end}</TableCell>
                    <TableCell>{record.status}</TableCell>
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
                <Label>{t("from_date")}</Label>
                <Input type="date" value={formData.period_start} onChange={(e) => setFormData({ ...formData, period_start: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("to_date")}</Label>
                <Input type="date" value={formData.period_end} onChange={(e) => setFormData({ ...formData, period_end: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("base_salary")}</Label>
                <Input type="number" value={formData.base_salary} onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("allowances")}</Label>
                <Input type="number" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("deductions")}</Label>
                <Input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("status")}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("status_draft")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="paid">{t("status_paid")}</SelectItem>
                </SelectContent>
              </Select>
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

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { AlertTriangle, Wallet, CheckCircle2, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
import { Label } from "@/shared/ui/label";
import { HasPermission } from "@/shared/components/HasPermission";
import { PageHero } from "@/shared/components/PageHero";
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
import type { ApiPayrollRecordRequest } from "@/types/contracts";

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
    const payload: ApiPayrollRecordRequest = {
      employee: parseInt(formData.employeeId || "0", 10),
      period_start: formData.period_start,
      period_end: formData.period_end,
      base_salary: String(Number(formData.base_salary || 0)),
      allowances: String(Number(formData.allowances || 0)),
      deductions: String(Number(formData.deductions || 0)),
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

  const totalPayroll = payrollQuery.data?.length || 0;
  const approvedPayroll = payrollQuery.data?.filter(r => r.status === "approved" || r.status === "paid").length || 0;
  const draftPayroll = payrollQuery.data?.filter(r => r.status === "draft").length || 0;

  const spotlightMetrics = [
    {
      label: t("total_records"),
      value: totalPayroll,
      icon: Wallet,
      color: "text-primary",
    },
    {
      label: t("approved"),
      value: approvedPayroll,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: t("status_draft"),
      value: draftPayroll,
      icon: FileText,
      color: "text-warning",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("payroll")}
        subtitle={t("payroll_subtitle", "Manage employees basic salary, allowances and deductions.")}
        icon={Wallet}
        metrics={spotlightMetrics.map((item, index) => ({
          label: item.label,
          value: item.value,
          icon: item.icon,
          tone: index === 0 ? "primary" : index === 1 ? "success" : "warning",
        }))}
        actions={
          <HasPermission resource="payroll" action="write">
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("add_payroll_label")}
            </Button>
          </HasPermission>
        }
      />

      <Card className="bg-card/90 border border-border/60 shadow-sm">
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
                      <HasPermission resource="payroll" action="write" fallback="-">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(record)}>
                            {t("edit")}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(String(record.id))}>
                            {t("delete")}
                          </Button>
                        </div>
                      </HasPermission>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              icon={Wallet} 
              title={t("no_data")} 
              description={t("payroll_no_records_desc", "No payroll records found for the selected period.")}
              actionLabel={t("add_record")}
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
                <Label>{t("from_date")}</Label>
                <DatePicker value={formData.period_start} onChange={(date) => setFormData({ ...formData, period_start: date })} />
              </div>
              <div className="space-y-2">
                <Label>{t("to_date")}</Label>
                <DatePicker value={formData.period_end} onChange={(date) => setFormData({ ...formData, period_end: date })} />
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
                  <SelectItem value="draft">{t("status_draft", "مسودة")}</SelectItem>
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

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { useTranslation } from "react-i18next";
import type { Employee, Leave } from "@/types/api";

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: Leave | null;
  onSave: (request: Partial<Leave>, files: File[]) => void;
  employees: Employee[];
  isEmployeesLoading?: boolean;
}

const leaveTypes = ["annual", "sick", "emergency", "unpaid"] as const;

export function LeaveRequestDialog({
  open,
  onOpenChange,
  request,
  onSave,
  employees,
  isEmployeesLoading = false,
}: LeaveRequestDialogProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");
  const [attachments, setAttachments] = useState<File[]>([]);

  const employeeOptions = useMemo(
    () => employees.map((emp) => ({ id: emp.id, name: emp.name })),
    [employees],
  );

  const leaveSchema = z
    .object({
      employeeId: z.string().min(1, t("employee_required")),
      leaveType: z.string().min(1, t("leave_type_required")),
      startDate: z.string().min(1, t("start_date_required")),
      endDate: z.string().min(1, t("end_date_required")),
      reason: z.string().optional(),
    })
    .refine(
      (values) => new Date(values.endDate).getTime() >= new Date(values.startDate).getTime(),
      {
        message: t("end_after_start"),
        path: ["endDate"],
      },
    );

  type LeaveFormValues = z.infer<typeof leaveSchema>;
  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      employeeId: "",
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (request) {
      form.reset({
        employeeId: String(request.employeeId || ""),
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason || "",
      });
    } else {
      form.reset({
        employeeId: "",
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
    }
    setAttachments([]);
  }, [request, open, form]);

  const handleSubmit = (values: LeaveFormValues) => {
    const days =
      Math.ceil(
        (new Date(values.endDate).getTime() - new Date(values.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;
    onSave({ ...values, days }, attachments);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>
            {request ? t("leave_form_edit_title") : t("leave_form_add_title")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employee_name")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_employee")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isEmployeesLoading ? (
                        <SelectItem value="loading" disabled>
                          {t("loading")}
                        </SelectItem>
                      ) : (
                        employeeOptions.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leave_type_label")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_leave_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`leave_type_${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("from_date")}</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} disabled={field.disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("to_date")}</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} disabled={field.disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reason")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t("leave_reason_placeholder")} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t("attachments")}</FormLabel>
              <Input
                type="file"
                multiple
                onChange={(event) => setAttachments(Array.from(event.target.files || []))}
              />
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">
                {request ? t("save_changes") : t("send_request")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


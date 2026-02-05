import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import type { Attendance, Employee } from "@/types/api";

interface AttendanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Attendance | null;
  onSave: (data: Partial<Attendance>) => void;
  employees: Employee[];
  isEmployeesLoading?: boolean;
}

export function AttendanceFormDialog({
  open,
  onOpenChange,
  record,
  onSave,
  employees,
  isEmployeesLoading = false,
}: AttendanceFormDialogProps) {
  const { t } = useTranslation();
  const schema = z
    .object({
      employeeId: z.string().min(1, t("employee_required")),
      date: z.string().min(1, t("date_required")),
      status: z.enum(["present", "absent", "late"], { required_error: t("status_required") }),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
    })
    .refine(
      (values) => {
        if (values.status === "absent") {
          return !values.checkIn && !values.checkOut;
        }
        if (values.checkIn && values.checkOut) {
          return values.checkOut > values.checkIn;
        }
        return true;
      },
      {
        message: t("invalid_time_range"),
        path: ["checkOut"],
      },
    );

  type AttendanceFormValues = z.infer<typeof schema>;
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      date: "",
      status: "present",
      checkIn: "",
      checkOut: "",
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        employeeId: String(record.employeeId),
        date: record.date,
        status: record.status,
        checkIn: record.checkIn || "",
        checkOut: record.checkOut || "",
      });
    } else {
      form.reset({
        employeeId: "",
        date: "",
        status: "present",
        checkIn: "",
        checkOut: "",
      });
    }
  }, [record, open, form]);

  const handleSubmit = (values: AttendanceFormValues) => {
    onSave({
      employeeId: values.employeeId,
      date: values.date,
      status: values.status,
      checkIn: values.checkIn || undefined,
      checkOut: values.checkOut || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {record ? t("attendance_form_edit_title") : t("attendance_form_add_title")}
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
                        employees.map((employee) => (
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("status_filter")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="present">{t("status_present")}</SelectItem>
                      <SelectItem value="absent">{t("status_absent")}</SelectItem>
                      <SelectItem value="late">{t("status_late")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("check_in_time")}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("check_out_time")}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">
                {record ? t("save_changes") : t("add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

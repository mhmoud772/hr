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
import { Textarea } from "@/shared/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { ScrollArea } from "@/shared/ui/scroll-area";
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
import type { Employee } from "@/types/api";
import { useTranslation } from "react-i18next";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSave: (employee: Partial<Employee>, avatarFile?: File | null) => void;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSave,
}: EmployeeFormDialogProps) {
  const { t } = useTranslation();
  const departmentsQuery = useDepartmentsQuery();
  const jobTitlesQuery = useJobTitlesQuery({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const departmentOptions = useMemo(
    () => (departmentsQuery.data || []).map((dept) => ({ id: String(dept.id), name: dept.name })),
    [departmentsQuery.data],
  );
  const jobTitleOptions = useMemo(
    () => (jobTitlesQuery.data?.results || []).map((job) => ({ id: job.id, name: job.name })),
    [jobTitlesQuery.data],
  );

  const employeeSchema = z.object({
    employeeId: z.string().min(1, t("employee_id_required")),
    name: z.string().min(2, t("name_required")),
    email: z.string().email(t("email_invalid")),
    phone: z.string().min(8, t("phone_invalid")),
    department: z.string().min(1, t("department_required")),
    jobTitle: z.string().min(1, t("job_title_required")),
    hireDate: z.string().min(1, t("hire_date_required")),
    status: z.enum(["active", "leave", "inactive"]),
    nationality: z.string().optional(),
    birthDate: z.string().optional(),
    address: z.string().optional(),
    salary: z.string().optional(),
    contractStatus: z.enum(["permanent", "contract", "probation", "terminated"]),
  });

  type EmployeeFormValues = z.infer<typeof employeeSchema>;
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      jobTitle: "",
      hireDate: "",
      status: "active",
      nationality: "",
      birthDate: "",
      address: "",
      salary: "",
      contractStatus: "permanent",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        employeeId: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        department: employee.department || "",
        jobTitle: employee.jobTitle || "",
        hireDate: employee.hireDate || "",
        status: employee.status,
        nationality: employee.nationality || "",
        birthDate: employee.birthDate || "",
        address: employee.address || "",
        salary: employee.salary ? String(employee.salary) : "",
        contractStatus: employee.contractStatus || "permanent",
      });
      setAvatarPreview(employee.avatarUrl || null);
      setAvatarFile(null);
    } else {
      form.reset({
        employeeId: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        jobTitle: "",
        hireDate: new Date().toISOString().split("T")[0],
        status: "active",
        nationality: "",
        birthDate: "",
        address: "",
        salary: "",
        contractStatus: "permanent",
      });
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [employee, open, form]);

  const handleSubmit = (values: EmployeeFormValues) => {
    const { employeeId, ...rest } = values;
    onSave(
      {
        id: employeeId,
        ...rest,
        salary: rest.salary ? Number(rest.salary) : undefined,
      },
      avatarFile,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {employee ? t("employee_form_edit_title") : t("employee_form_add_title")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ScrollArea className="max-h-[65vh] pr-2">
              <div className="space-y-4 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employee_id")}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={Boolean(employee)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("full_name_label")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("phone")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("department")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_department")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departmentOptions.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("job_title")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_job_title")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobTitleOptions.map((title) => (
                              <SelectItem key={title.id} value={title.name}>
                                {title.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("hire_date")}</FormLabel>
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
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">{t("status_active")}</SelectItem>
                            <SelectItem value="leave">{t("status_on_leave")}</SelectItem>
                            <SelectItem value="inactive">{t("status_inactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contract_status")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="permanent">{t("contract_permanent")}</SelectItem>
                            <SelectItem value="contract">{t("contract_contract")}</SelectItem>
                            <SelectItem value="probation">{t("contract_probation")}</SelectItem>
                            <SelectItem value="terminated">{t("contract_terminated")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="additional-details">
                    <AccordionTrigger>{t("additional_details")}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="nationality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("nationality")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("birth_date")}</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("salary")}</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="space-y-2">
                            <FormLabel>{t("avatar")}</FormLabel>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setAvatarFile(file);
                                setAvatarPreview(file ? URL.createObjectURL(file) : employee?.avatarUrl || null);
                              }}
                            />
                            {avatarPreview ? (
                              <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
                            ) : null}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("address")}</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">
                {employee ? t("save_changes") : t("add_employee")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

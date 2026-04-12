import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DatePicker } from "@/shared/ui/date-picker";
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
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { checkEmployeeUnique } from "@/features/employees/api/employees";
import { HasPermission } from "@/shared/components/HasPermission";
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
import { useDraftStore } from "@/shared/store/draftStore";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: (employee: Partial<Employee>, avatarFile?: File | null) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmployeeForm({
  employee,
  onSave,
  onCancel,
  isLoading,
}: EmployeeFormProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");
  
  const employeeDraft = useDraftStore((state) => state.employeeDraft);
  const setEmployeeDraft = useDraftStore((state) => state.setEmployeeDraft);

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

  const toOptionValue = (id: string | number, name: string) => `${id}::${name}`;
  const extractId = (value: string) =>
    value?.includes("::") ? parseInt(value.split("::")[0], 10) : null;
  
  const findOptionValueByName = useCallback(
    (options: { id: string | number; name: string }[], name?: string | null) => {
      if (!name) return "";
      const match = options.find((opt) => opt.name === name);
      return match ? toOptionValue(match.id, match.name) : name;
    },
    [],
  );

  const employeeSchema = useMemo(() => z.object({
    employeeId: z.string().min(1, t("employee_id_required")),
    name: z.string().min(2, t("name_required")),
    email: z.string().email(t("email_invalid")),
    phone: z.string().min(8, t("phone_invalid")).refine((val) => !val || isValidPhoneNumber(val), { message: t("phone_invalid") }),
    department: z.string().min(1, t("department_required")),
    jobTitle: z.string().min(1, t("job_title_required")),
    hireDate: z.string().min(1, t("hire_date_required")),
    status: z.enum(["active", "leave", "inactive"]),
    nationality: z.string().optional(),
    birthDate: z.string().optional(),
    address: z.string().optional(),
    salary: z.string().optional(),
    contractStatus: z.enum(["permanent", "contract", "probation", "terminated"]),
  }).superRefine(async (data, ctx) => {
      if (data.employeeId) {
          try {
              const isTaken = await checkEmployeeUnique("employee_code", data.employeeId, employee?.id);
              if (isTaken) {
                  ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: t("employee_id_taken", "This Employee ID is already in use"),
                      path: ["employeeId"],
                  });
              }
          } catch (e) {
              // ignore
          }
      }
      if (data.email) {
          try {
              const isTaken = await checkEmployeeUnique("email", data.email, employee?.id);
              if (isTaken) {
                  ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: t("email_taken", "This email is already in use"),
                      path: ["email"],
                  });
              }
          } catch (e) {
              // ignore
          }
      }
  }), [t, employee?.id]);

  type EmployeeFormValues = z.infer<typeof employeeSchema>;
  const form = useForm<EmployeeFormValues>({
    mode: "onBlur",
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

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current && !employee) return;

    if (employee) {
      form.reset({
        employeeId: employee.employeeCode || employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        department: findOptionValueByName(departmentOptions, employee.department),
        jobTitle: findOptionValueByName(jobTitleOptions, employee.jobTitle),
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
      isInitialized.current = true;
    } else if (employeeDraft && !isInitialized.current) {
      form.reset({
        employeeId: employeeDraft?.employeeId || employeeDraft?.employeeCode || "",
        name: employeeDraft?.name || "",
        email: employeeDraft?.email || "",
        phone: employeeDraft?.phone || "",
        department: employeeDraft?.department || "",
        jobTitle: employeeDraft?.jobTitle || "",
        hireDate: employeeDraft?.hireDate || new Date().toISOString().split("T")[0],
        status: (employeeDraft?.status as any) || "active",
        nationality: employeeDraft?.nationality || "",
        birthDate: employeeDraft?.birthDate || "",
        address: employeeDraft?.address || "",
        salary: employeeDraft?.salary?.toString() || "",
        contractStatus: (employeeDraft?.contractStatus as any) || "permanent",
      });
      setAvatarPreview(null);
      setAvatarFile(null);
      isInitialized.current = true;
    }
  }, [departmentOptions, employee, findOptionValueByName, form, jobTitleOptions, employeeDraft]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!employee) {
         // Only update draft if values actually changed to avoid unnecessary store updates
         setEmployeeDraft(value as Partial<Employee>);
      }
    });
    return () => subscription.unsubscribe();
  }, [employee, form, setEmployeeDraft]);
  
  const handleSubmit = (values: EmployeeFormValues) => {
    const { employeeId, ...rest } = values;
    const normalizedEmployeeCode = employeeId.trim() || undefined;
    const normalizedDepartmentId = extractId(rest.department);
    const normalizedJobTitleId = extractId(rest.jobTitle);
    const normalizedHireDate = rest.hireDate?.trim() ? rest.hireDate : undefined;
    const normalizedBirthDate = rest.birthDate?.trim() ? rest.birthDate : undefined;
    
    onSave(
      {
        employeeCode: normalizedEmployeeCode,
        ...rest,
        departmentId: normalizedDepartmentId ? String(normalizedDepartmentId) : null,
        jobTitleId: normalizedJobTitleId ? String(normalizedJobTitleId) : null,
        hireDate: normalizedHireDate,
        birthDate: normalizedBirthDate,
        salary: rest.salary ? Number(rest.salary) : undefined,
      },
      avatarFile,
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 pb-6" dir={isRtl ? "rtl" : "ltr"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">{t("employee_id")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={Boolean(employee)} className="h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20" />
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
                    <FormLabel className="text-sm font-bold">{t("full_name_label")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">{t("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className="h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20" />
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
                    <FormLabel className="text-sm font-bold">{t("phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">{t("department")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                          <SelectValue placeholder={t("select_department")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept.id} value={toOptionValue(dept.id, dept.name)}>
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
                    <FormLabel className="text-sm font-bold">{t("job_title")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                          <SelectValue placeholder={t("select_job_title")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                        {jobTitleOptions.map((title) => (
                          <SelectItem key={title.id} value={toOptionValue(title.id, title.name)}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">{t("hire_date")}</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} disabled={field.disabled} className="h-11 rounded-xl bg-muted/30 border-none" />
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
                    <FormLabel className="text-sm font-bold">{t("status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl">
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
                    <FormLabel className="text-sm font-bold">{t("contract_status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl">
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

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="additional-details" className="border-none bg-muted/20 rounded-2xl px-4 py-1">
                <AccordionTrigger className="text-sm font-bold hover:no-underline">{t("additional_details")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold">{t("nationality")}</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11 rounded-xl bg-background border-border/50" />
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
                            <FormLabel className="text-sm font-bold">{t("birth_date")}</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} disabled={field.disabled} className="h-11 rounded-xl bg-background border-border/50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <HasPermission resource="payroll" action="read">
                        <FormField
                          control={form.control}
                          name="salary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-bold">{t("salary")}</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" {...field} className="h-11 rounded-xl bg-background border-border/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </HasPermission>
                      <div className="space-y-3">
                        <FormLabel className="text-sm font-bold">{t("avatar")}</FormLabel>
                        <div className="flex items-center gap-4">
                            <Input
                            type="file"
                            accept="image/*"
                            className="h-10 rounded-xl bg-background border-border/50 text-xs"
                            onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setAvatarFile(file);
                                setAvatarPreview(file ? URL.createObjectURL(file) : employee?.avatarUrl || null);
                            }}
                            />
                            {avatarPreview && (
                            <div className="relative group/avatar shrink-0">
                                <img src={avatarPreview} alt="avatar" className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/20 shadow-sm transition-all group-hover/avatar:ring-primary/40" />
                            </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold">{t("address")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} className="rounded-xl bg-background border-border/50 resize-none" />
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="rounded-xl px-6 h-11 font-semibold text-muted-foreground hover:bg-muted/50 transition-all"
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button 
            type="submit" 
            className="rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? t("saving") : employee ? t("save_changes") : t("add_employee")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

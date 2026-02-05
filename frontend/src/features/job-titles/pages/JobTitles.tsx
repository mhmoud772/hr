
import { useMemo, useState } from "react";
import { FileText, Plus, Edit, Trash2, Eye, Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { useToast } from "@/shared/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useJobTitlesQuery, useCreateJobTitle, useUpdateJobTitle, useDeleteJobTitle } from "@/features/job-titles/hooks/useJobTitles";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import type { JobTitle } from "@/types/api";

const levels = ["executive", "manager", "specialist", "junior"] as const;

export default function JobTitles() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { toast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobTitle | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    department: "",
    level: "",
    minSalary: "",
    maxSalary: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const canAdmin = ["system_admin", "admin", "hr_manager"].includes(String(user?.role || ""));

  const departmentsQuery = useDepartmentsQuery();
  const jobTitlesQuery = useJobTitlesQuery({
    page,
    search: search || undefined,
    level: levelFilter === "all" ? undefined : levelFilter,
    department__name: departmentFilter === "all" ? undefined : departmentFilter,
  });

  const createJobTitle = useCreateJobTitle();
  const updateJobTitle = useUpdateJobTitle();
  const deleteJobTitle = useDeleteJobTitle();

  const jobTitles = jobTitlesQuery.data?.results ?? [];
  const totalCount = jobTitlesQuery.data?.count ?? jobTitles.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const departmentOptions = useMemo(() => {
    const list = departmentsQuery.data || [];
    return list.map((dept) => dept.name).filter(Boolean);
  }, [departmentsQuery.data]);

  const handleAdd = () => {
    setSelectedJob(null);
    setFormData({
      name: "",
      nameEn: "",
      department: "",
      level: "",
      minSalary: "",
      maxSalary: "",
      description: "",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (job: JobTitle) => {
    setSelectedJob(job);
    setFormData({
      name: job.name || "",
      nameEn: job.nameEn || "",
      department: job.department || "",
      level: job.level || "",
      minSalary: job.minSalary ? String(job.minSalary) : "",
      maxSalary: job.maxSalary ? String(job.maxSalary) : "",
      description: job.description || "",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleDelete = (job: JobTitle) => {
    setSelectedJob(job);
    setDeleteOpen(true);
  };

  const handleView = (job: JobTitle) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("name_required");
    if (!formData.level) errors.level = t("level_required");
    if (!formData.department) errors.department = t("department_required");
    const minSalary = Number(formData.minSalary || 0);
    const maxSalary = Number(formData.maxSalary || 0);
    if (minSalary <= 0) errors.minSalary = t("min_salary_required");
    if (maxSalary <= 0) errors.maxSalary = t("max_salary_required");
    if (maxSalary && minSalary && maxSalary < minSalary) {
      errors.maxSalary = t("salary_range_invalid");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: Partial<JobTitle> = {
      name: formData.name,
      nameEn: formData.nameEn,
      department: formData.department,
      level: formData.level,
      minSalary: Number(formData.minSalary),
      maxSalary: Number(formData.maxSalary),
      description: formData.description,
    };

    try {
      if (selectedJob?.id) {
        await updateJobTitle.mutateAsync({ id: selectedJob.id, data: payload });
        toast({ title: t("job_updated"), description: t("job_updated_desc") });
      } else {
        await createJobTitle.mutateAsync(payload);
        toast({ title: t("job_added"), description: t("job_added_desc") });
      }
      setFormOpen(false);
    } catch (err) {
      toast({ title: t("generic_error"), description: String(err) });
    }
  };

  const confirmDelete = async () => {
    if (!selectedJob?.id) return;
    try {
      await deleteJobTitle.mutateAsync(selectedJob.id);
      toast({
        title: t("job_deleted"),
        description: t("job_deleted_desc", { name: selectedJob?.name || "" }),
      });
    } catch (err) {
      toast({ title: t("cannot_delete_job_title"), description: t("job_delete_has_employees") });
    }
    setDeleteOpen(false);
  };

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  if (jobTitlesQuery.isLoading) return <LoadingState label={t("loading")} />;
  if (jobTitlesQuery.isError) {
    return (
      <div className="p-6">
        <EmptyState title={t("error_loading")} icon={FileText} actionLabel={t("retry")} onAction={() => jobTitlesQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("job_titles_title")}</h1>
          <p className="text-muted-foreground">{t("job_titles_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className={`w-4 h-4 absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-muted-foreground`} />
            <Input
              className={`${isRtl ? "pr-9" : "pl-9"} w-56`}
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("department")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("level")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status_all")}</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>{t(`level_${level}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!canAdmin}>
            <Plus className="w-4 h-4 ml-2" />
            {t("add_job_title")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {levels.map((level) => {
          const count = jobTitles.filter((j) => j.level === level).length;
          return (
            <Card key={level} className="bg-card border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{t(`level_${level}`)}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t("job_titles_list")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobTitles.length === 0 ? (
            <EmptyState title={t("no_data")} icon={FileText} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("job_title")}</TableHead>
                  <TableHead>{t("department")}</TableHead>
                  <TableHead>{t("level")}</TableHead>
                  <TableHead>{t("salary_range")}</TableHead>
                  <TableHead>{t("employee_count")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobTitles.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.name}</p>
                        <p className="text-sm text-muted-foreground">{job.nameEn}</p>
                      </div>
                    </TableCell>
                    <TableCell>{job.department || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`level_${job.level}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatSalary(Number(job.minSalary || 0))} - {formatSalary(Number(job.maxSalary || 0))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {job.employee_count ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(job)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(job)} disabled={!canAdmin}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(job)} disabled={!canAdmin}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t("previous")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {t("next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedJob ? t("edit") : t("add_job_title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("job_title_ar")}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("job_title_en")}</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("department")}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_department")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.department && <p className="text-xs text-destructive">{formErrors.department}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("level")}</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_level")} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>{t(`level_${level}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.level && <p className="text-xs text-destructive">{formErrors.level}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("min_salary")}</Label>
                <Input
                  type="number"
                  value={formData.minSalary}
                  onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                  required
                />
                {formErrors.minSalary && <p className="text-xs text-destructive">{formErrors.minSalary}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("max_salary")}</Label>
                <Input
                  type="number"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                  required
                />
                {formErrors.maxSalary && <p className="text-xs text-destructive">{formErrors.maxSalary}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("job_description")}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!canAdmin}>
                {selectedJob ? t("save") : t("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selectedJob?.name || ""}
        subtitle={selectedJob?.nameEn}
        avatar={
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        }
        badge={{ text: selectedJob?.level || "", variant: "outline" }}
        details={[
          { label: t("department"), value: selectedJob?.department || "" },
          { label: t("min_salary"), value: formatSalary(Number(selectedJob?.minSalary || 0)) },
          { label: t("max_salary"), value: formatSalary(Number(selectedJob?.maxSalary || 0)) },
          { label: t("employee_count"), value: selectedJob?.employee_count || 0 },
        ]}
      >
        <div>
          <h4 className="font-medium mb-2">{t("job_description")}</h4>
          <p className="text-muted-foreground text-sm">{selectedJob?.description}</p>
        </div>
      </DetailsSheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_job_title")}
        description={t("delete_job_title_desc", { name: selectedJob?.name || "" })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

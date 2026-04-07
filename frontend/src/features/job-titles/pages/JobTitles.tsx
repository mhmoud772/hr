
import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Edit, Trash2, Eye, Users } from "lucide-react";
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
import { PageHero } from "@/shared/components/PageHero";
import { TableToolbar } from "@/shared/components/TableToolbar";
import { parseSortValue, sortRows } from "@/shared/lib/tableUtils";
import { IconActionButton } from "@/shared/components/IconActionButton";

const levels = ["executive", "manager", "specialist", "junior"] as const;

export default function JobTitles() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");
  const { toast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortValue, setSortValue] = useState("name:asc");
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
    department: departmentFilter === "all" ? undefined : departmentFilter,
  });

  const createJobTitle = useCreateJobTitle();
  const updateJobTitle = useUpdateJobTitle();
  const deleteJobTitle = useDeleteJobTitle();

  useEffect(() => {
    if (departmentFilter !== "all") {
      setShowAdvancedFilters(true);
    }
  }, [departmentFilter]);

  const jobTitles = useMemo(() => jobTitlesQuery.data?.results ?? [], [jobTitlesQuery.data]);
  const { key: sortKey, direction } = parseSortValue(sortValue);
  const sortedJobTitles = useMemo(
    () =>
      sortRows(
        jobTitles,
        sortKey,
        direction,
        {
          name: (job) => job.name,
          department: (job) => job.department,
          level: (job) => job.level,
        },
      ),
    [jobTitles, sortKey, direction],
  );
  const totalCount = jobTitlesQuery.data?.count ?? jobTitles.length;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const departmentOptions = useMemo(() => {
    const list = departmentsQuery.data || [];
    return list
      .map((dept) => ({ id: String(dept.id), name: dept.name }))
      .filter((dept) => Boolean(dept.name));
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
      department: job.departmentId || "",
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
      departmentId: formData.department,
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
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("job_titles_title")}
        subtitle={t("job_titles_subtitle")}
        icon={FileText}
        actions={
          <Button onClick={handleAdd} disabled={!canAdmin} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("add_job_title")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {levels.map((level) => {
          const count = jobTitles.filter((j) => j.level === level).length;
          return (
            <Card key={level} className="bg-card/90 border border-border/60 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{t(`level_${level}`)}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardContent className="p-4">
          <TableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search"),
            }}
            filters={
              <>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={t("level")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_levels")}</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>{t(`level_${level}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                >
                  {showAdvancedFilters ? t("hide_filters") : t("advanced_filters")}
                </Button>
                {showAdvancedFilters && (
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder={t("department")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_departments")}</SelectItem>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            }
            sort={{
              value: sortValue,
              onChange: setSortValue,
              options: [
                { value: "name:asc", label: t("sort_name_asc") },
                { value: "department:asc", label: t("sort_department") },
                { value: "level:asc", label: t("sort_level") },
              ],
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/90 border border-border/60 shadow-sm">
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
            <>
              <div className="md:hidden space-y-3">
                {sortedJobTitles.map((job) => (
                  <div key={job.id} className="rounded-lg border border-border/60 bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{job.name}</div>
                        <div className="text-xs text-muted-foreground">{job.nameEn || "-"}</div>
                      </div>
                      <Badge variant="outline">{t(`level_${job.level}`)}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>{t("department")}: <span className="text-foreground">{job.department || "-"}</span></div>
                      <div>{t("salary_range")}: <span className="text-foreground">{formatSalary(Number(job.minSalary || 0))} - {formatSalary(Number(job.maxSalary || 0))}</span></div>
                      <div>{t("employee_count")}: <span className="text-foreground">{job.employee_count ?? 0}</span></div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <IconActionButton label={t("view_details")} onClick={() => handleView(job)}>
                        <Eye className="w-4 h-4" />
                      </IconActionButton>
                      <IconActionButton
                        label={t("edit")}
                        onClick={() => handleEdit(job)}
                        disabled={!canAdmin}
                      >
                        <Edit className="w-4 h-4" />
                      </IconActionButton>
                      <IconActionButton
                        label={t("delete")}
                        className="text-destructive"
                        onClick={() => handleDelete(job)}
                        disabled={!canAdmin}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconActionButton>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
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
                    {sortedJobTitles.map((job) => (
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
                            <IconActionButton label={t("view_details")} onClick={() => handleView(job)}>
                              <Eye className="w-4 h-4" />
                            </IconActionButton>
                            <IconActionButton
                              label={t("edit")}
                              onClick={() => handleEdit(job)}
                              disabled={!canAdmin}
                            >
                              <Edit className="w-4 h-4" />
                            </IconActionButton>
                            <IconActionButton
                              label={t("delete")}
                              className="text-destructive"
                              onClick={() => handleDelete(job)}
                              disabled={!canAdmin}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconActionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4">
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
        <DialogContent className="max-w-lg" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{selectedJob ? t("edit") : t("add_job_title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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



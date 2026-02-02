import { useState } from "react";
import { FileText, Plus, Edit, Trash2, Eye, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailsSheet } from "@/components/shared/DetailsSheet";
import { useToast } from "@/hooks/use-toast";

interface JobTitle {
  id: string;
  name: string;
  nameEn: string;
  department: string;
  level: string;
  minSalary: number;
  maxSalary: number;
  employeeCount: number;
  description: string;
}

const initialJobTitles: JobTitle[] = [
  { id: "1", name: "مدير عام", nameEn: "General Manager", department: "الإدارة العليا", level: "تنفيذي", minSalary: 25000, maxSalary: 40000, employeeCount: 1, description: "مسؤول عن الإدارة العامة للمؤسسة" },
  { id: "2", name: "مدير موارد بشرية", nameEn: "HR Manager", department: "الموارد البشرية", level: "إداري", minSalary: 15000, maxSalary: 25000, employeeCount: 1, description: "إدارة شؤون الموظفين والتوظيف" },
  { id: "3", name: "أخصائي موارد بشرية", nameEn: "HR Specialist", department: "الموارد البشرية", level: "متخصص", minSalary: 8000, maxSalary: 12000, employeeCount: 5, description: "تنفيذ سياسات الموارد البشرية" },
  { id: "4", name: "مطور برمجيات أول", nameEn: "Senior Developer", department: "تقنية المعلومات", level: "متخصص", minSalary: 12000, maxSalary: 20000, employeeCount: 4, description: "تطوير وبرمجة التطبيقات" },
  { id: "5", name: "مطور برمجيات", nameEn: "Software Developer", department: "تقنية المعلومات", level: "مبتدئ", minSalary: 7000, maxSalary: 12000, employeeCount: 8, description: "المشاركة في تطوير البرمجيات" },
  { id: "6", name: "محاسب", nameEn: "Accountant", department: "المالية", level: "متخصص", minSalary: 8000, maxSalary: 14000, employeeCount: 6, description: "إدارة الحسابات والقيود المالية" },
];

const departments = ["الإدارة العليا", "الموارد البشرية", "تقنية المعلومات", "المالية", "المبيعات"];
const levels = ["تنفيذي", "إداري", "متخصص", "مبتدئ"];

export default function JobTitles() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>(initialJobTitles);
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
  const { toast } = useToast();

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
    setFormOpen(true);
  };

  const handleEdit = (job: JobTitle) => {
    setSelectedJob(job);
    setFormData({
      name: job.name,
      nameEn: job.nameEn,
      department: job.department,
      level: job.level,
      minSalary: String(job.minSalary),
      maxSalary: String(job.maxSalary),
      description: job.description,
    });
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

  const confirmDelete = () => {
    setJobTitles((prev) => prev.filter((j) => j.id !== selectedJob?.id));
    toast({
      title: "تم الحذف",
      description: `تم حذف المسمى الوظيفي "${selectedJob?.name}" بنجاح`,
    });
    setDeleteOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob) {
      setJobTitles((prev) =>
        prev.map((j) =>
          j.id === selectedJob.id
            ? {
                ...j,
                ...formData,
                minSalary: Number(formData.minSalary),
                maxSalary: Number(formData.maxSalary),
              }
            : j
        )
      );
      toast({ title: "تم التعديل", description: "تم تعديل المسمى الوظيفي بنجاح" });
    } else {
      const newJob: JobTitle = {
        id: String(Date.now()),
        ...formData,
        minSalary: Number(formData.minSalary),
        maxSalary: Number(formData.maxSalary),
        employeeCount: 0,
      };
      setJobTitles((prev) => [...prev, newJob]);
      toast({ title: "تمت الإضافة", description: "تم إضافة المسمى الوظيفي بنجاح" });
    }
    setFormOpen(false);
  };

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المسميات الوظيفية</h1>
          <p className="text-muted-foreground">إدارة المسميات والدرجات الوظيفية</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مسمى
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {levels.map((level) => {
          const count = jobTitles.filter((j) => j.level === level).length;
          return (
            <Card key={level} className="bg-card border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{level}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            قائمة المسميات الوظيفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المسمى الوظيفي</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>المستوى</TableHead>
                <TableHead>نطاق الراتب</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>الإجراءات</TableHead>
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
                  <TableCell>{job.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatSalary(job.minSalary)} - {formatSalary(job.maxSalary)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {job.employeeCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(job)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(job)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedJob ? "تعديل المسمى الوظيفي" : "إضافة مسمى وظيفي جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المسمى (عربي)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>المسمى (إنجليزي)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>القسم</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المستوى</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأدنى للراتب</Label>
                <Input
                  type="number"
                  value={formData.minSalary}
                  onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى للراتب</Label>
                <Input
                  type="number"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف الوظيفي</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">{selectedJob ? "حفظ" : "إضافة"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
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
          { label: "القسم", value: selectedJob?.department || "" },
          { label: "الحد الأدنى للراتب", value: formatSalary(selectedJob?.minSalary || 0) },
          { label: "الحد الأقصى للراتب", value: formatSalary(selectedJob?.maxSalary || 0) },
          { label: "عدد الموظفين", value: selectedJob?.employeeCount || 0 },
        ]}
      >
        <div>
          <h4 className="font-medium mb-2">الوصف الوظيفي</h4>
          <p className="text-muted-foreground text-sm">{selectedJob?.description}</p>
        </div>
      </DetailsSheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف المسمى الوظيفي"
        description={`هل أنت متأكد من حذف "${selectedJob?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

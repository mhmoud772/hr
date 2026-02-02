import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DepartmentFormDialog } from "@/components/structure/DepartmentFormDialog";
import { DepartmentTreeItem } from "@/components/structure/DepartmentTreeItem";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  manager: string;
  employeeCount: number;
  children?: Department[];
}

const initialDepartments: Department[] = [
  {
    id: "1",
    name: "الإدارة العليا",
    parentId: null,
    manager: "أحمد محمد",
    employeeCount: 5,
    children: [
      {
        id: "2",
        name: "الموارد البشرية",
        parentId: "1",
        manager: "سارة علي",
        employeeCount: 8,
        children: [
          { id: "5", name: "التوظيف", parentId: "2", manager: "خالد عمر", employeeCount: 3 },
          { id: "6", name: "التدريب والتطوير", parentId: "2", manager: "نورة سعد", employeeCount: 2 },
        ],
      },
      {
        id: "3",
        name: "تقنية المعلومات",
        parentId: "1",
        manager: "محمد خالد",
        employeeCount: 15,
        children: [
          { id: "7", name: "تطوير البرمجيات", parentId: "3", manager: "علي حسن", employeeCount: 8 },
          { id: "8", name: "الدعم الفني", parentId: "3", manager: "فهد أحمد", employeeCount: 4 },
        ],
      },
      {
        id: "4",
        name: "المالية والمحاسبة",
        parentId: "1",
        manager: "فاطمة عبدالله",
        employeeCount: 10,
      },
    ],
  },
];

export default function Structure() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [expandedIds, setExpandedIds] = useState<string[]>(["1", "2", "3"]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", manager: "", parentId: "" });
  const { toast } = useToast();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAdd = (parentId?: string) => {
    setSelectedDept(null);
    setFormData({ name: "", manager: "", parentId: parentId || "none" });
    setFormOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({ name: dept.name, manager: dept.manager, parentId: dept.parentId || "none" });
    setFormOpen(true);
  };

  const handleDelete = (dept: Department) => {
    setSelectedDept(dept);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    toast({
      title: "تم الحذف",
      description: `تم حذف القسم "${selectedDept?.name}" بنجاح`,
    });
    setDeleteOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: selectedDept ? "تم التعديل" : "تمت الإضافة",
      description: selectedDept
        ? `تم تعديل القسم "${formData.name}" بنجاح`
        : `تمت إضافة القسم "${formData.name}" بنجاح`,
    });
    setFormOpen(false);
  };

  const getAllDeptNames = (depts: Department[]): { id: string; name: string }[] => {
    const result: { id: string; name: string }[] = [];
    const traverse = (items: Department[]) => {
      items.forEach((d) => {
        result.push({ id: d.id, name: d.name });
        if (d.children) traverse(d.children);
      });
    };
    traverse(depts);
    return result;
  };

  const renderDepartmentTree = (dept: Department) => {
    const isExpanded = expandedIds.includes(dept.id);
    const hasChildren = dept.children && dept.children.length > 0;

    return (
      <div key={dept.id}>
        <DepartmentTreeItem
          department={dept}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        {hasChildren && isExpanded && (
          <div className="mr-6 mt-1 border-r-2 border-border pr-4">
            {dept.children!.map((child) => renderDepartmentTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الهيكل الإداري</h1>
          <p className="text-muted-foreground">إدارة الأقسام والإدارات</p>
        </div>
        <Button onClick={() => handleAdd()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            شجرة الأقسام
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <div className="space-y-1">
              {departments.map((dept) => renderDepartmentTree(dept))}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="لا توجد أقسام"
              description="ابدأ بإضافة أول قسم في الهيكل الإداري"
              actionLabel="إضافة قسم"
              onAction={() => handleAdd()}
            />
          )}
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        isEdit={!!selectedDept}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSave}
        departmentOptions={getAllDeptNames(departments)}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف القسم"
        description={`هل أنت متأكد من حذف القسم "${selectedDept?.name}"؟ سيتم حذف جميع الأقسام الفرعية أيضاً.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

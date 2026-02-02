import { Building2, Users, Plus, Edit, Trash2, ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  manager: string;
  employeeCount: number;
  children?: Department[];
}

interface DepartmentTreeItemProps {
  department: Department;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAdd: (parentId: string) => void;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

export function DepartmentTreeItem({
  department,
  isExpanded,
  onToggleExpand,
  onAdd,
  onEdit,
  onDelete,
}: DepartmentTreeItemProps) {
  const hasChildren = department.children && department.children.length > 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <button
        onClick={() => hasChildren && onToggleExpand(department.id)}
        className={`w-6 h-6 flex items-center justify-center rounded ${
          hasChildren ? "hover:bg-muted cursor-pointer" : "cursor-default opacity-0"
        }`}
      >
        {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
      </button>

      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{department.name}</h4>
        <p className="text-sm text-muted-foreground truncate">المدير: {department.manager}</p>
      </div>

      <Badge variant="secondary" className="gap-1 shrink-0">
        <Users className="w-3 h-3" />
        {department.employeeCount}
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onAdd(department.id)} title="إضافة قسم فرعي">
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(department)} title="تعديل">
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(department)} title="حذف">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

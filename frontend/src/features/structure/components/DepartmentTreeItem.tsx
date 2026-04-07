import {
  Building2,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useTranslation } from "react-i18next";

interface Department {
  id: string;
  name: string;
  parentId?: string | null;
  managerName?: string;
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
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onDragEnter: (id: string) => void;
  canManage: boolean;
  isDropTarget: boolean;
}

export function DepartmentTreeItem({
  department,
  isExpanded,
  onToggleExpand,
  onAdd,
  onEdit,
  onDelete,
  onDragStart,
  onDrop,
  onDragEnd,
  onDragEnter,
  canManage,
  isDropTarget,
}: DepartmentTreeItemProps) {
  const { t } = useTranslation();
  const hasChildren = department.children && department.children.length > 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isDropTarget ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50"
      }`}
      onDragOver={(event) => {
        if (!canManage) return;
        event.preventDefault();
      }}
      onDragEnter={() => {
        if (!canManage) return;
        onDragEnter(department.id);
      }}
      onDrop={(event) => {
        if (!canManage) return;
        event.preventDefault();
        onDrop(department.id);
      }}
    >
      <button
        className={`w-6 h-6 flex items-center justify-center rounded ${
          canManage ? "cursor-grab hover:bg-muted" : "cursor-default opacity-40"
        }`}
        draggable={canManage}
        onDragStart={(event) => {
          if (!canManage) return;
          event.dataTransfer.effectAllowed = "move";
          onDragStart(department.id);
        }}
        onDragEnd={onDragEnd}
        title={t("drag_to_reorder")}
      >
        <GripVertical className="w-4 h-4" />
      </button>

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
        <p className="text-sm text-muted-foreground truncate">
          {t("manager_label")}: {department.managerName || "-"}
        </p>
      </div>

      <Badge variant="secondary" className="gap-1 shrink-0">
        <Users className="w-3 h-3" />
        {department.employeeCount}
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAdd(department.id)}
          title={t("add_sub_department")}
          disabled={!canManage}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(department)}
          title={t("edit")}
          disabled={!canManage}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(department)}
          title={t("delete")}
          disabled={!canManage}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}


import { useMemo, useState } from "react";
import { Building2, Plus, Network, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DepartmentFormDialog } from "@/features/structure/components/DepartmentFormDialog";
import { DepartmentTreeItem } from "@/features/structure/components/DepartmentTreeItem";
import { OrgChart } from "@/features/structure/components/OrgChart";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useToast } from "@/shared/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Department, Employee } from "@/types/api";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartmentsQuery,
  useUpdateDepartment,
} from "@/features/structure/hooks/useDepartments";
import { useEmployeesQuery } from "@/features/employees/hooks/useEmployees";
import { useAuth } from "@/features/auth/components/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PageHero } from "@/shared/components/PageHero";
import { TableToolbar } from "@/shared/components/TableToolbar";

type TreeDepartment = Department & { children?: TreeDepartment[] };

const buildTree = (items: Department[]) => {
  const map = new Map<string, TreeDepartment>();
  items.forEach((item) => {
    map.set(String(item.id), {
      ...item,
      parentId: item.parentId ?? null,
      children: [],
    });
  });

  const roots: TreeDepartment[] = [];
  map.forEach((node) => {
    const parentId = node.parentId ? String(node.parentId) : null;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: TreeDepartment[]) => {
    nodes.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );
    nodes.forEach((node) => {
      if (node.children?.length) sortTree(node.children);
    });
  };

  sortTree(roots);
  return roots;
};

const filterTree = (
  nodes: TreeDepartment[],
  predicate: (node: TreeDepartment) => boolean,
) => {
  const expanded = new Set<string>();
  const walk = (items: TreeDepartment[]): TreeDepartment[] => {
    return items
      .map((node) => {
        const children = node.children ? walk(node.children) : [];
        const matches = predicate(node);
        if (children.length > 0) expanded.add(String(node.id));
        if (matches || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean) as TreeDepartment[];
  };
  return { nodes: walk(nodes), expandedIds: Array.from(expanded) };
};

const collectDescendantIds = (nodes: TreeDepartment[], targetId: string) => {
  const ids = new Set<string>();
  const collectChildren = (node: TreeDepartment, set: Set<string>) => {
    node.children?.forEach((child) => {
      set.add(String(child.id));
      collectChildren(child, set);
    });
  };
  const walk = (items: TreeDepartment[]) => {
    for (const node of items) {
      if (String(node.id) === targetId) {
        collectChildren(node, ids);
        return true;
      }
      if (node.children && walk(node.children)) return true;
    }
    return false;
  };
  walk(nodes);
  return ids;
};

const getChildrenForParent = (nodes: TreeDepartment[], parentId: string | null) => {
  if (!parentId) return nodes;
  const queue = [...nodes];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (String(node.id) === String(parentId)) {
      return node.children ?? [];
    }
    if (node.children?.length) queue.push(...node.children);
  }
  return [];
};

export default function Structure() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    managerId: "none",
    parentId: "none",
  });
  const [search, setSearch] = useState("");
  const [managerFilter, setManagerFilter] = useState("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const [selectedEmployee, setSelectedEmployee] = useState<null | Employee>(null);

  const canManage = ["system_admin", "admin", "hr_manager"].includes(
    String(user?.role || ""),
  );

  const departmentsQuery = useDepartmentsQuery();
  const employeesQuery = useEmployeesQuery();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const departments = useMemo(
    () => departmentsQuery.data ?? [],
    [departmentsQuery.data],
  );
  const tree = useMemo(() => buildTree(departments), [departments]);
  const normalizedSearch = search.trim().toLowerCase();
  const hasFilter = Boolean(normalizedSearch || (managerFilter && managerFilter !== "all"));

  const filtered = useMemo(() => {
    const predicate = (dept: TreeDepartment) => {
      const matchesSearch =
        !normalizedSearch ||
        dept.name.toLowerCase().includes(normalizedSearch) ||
        (dept.managerName || "").toLowerCase().includes(normalizedSearch);
      const matchesManager =
        managerFilter === "all" ||
        String(dept.managerId || "") === String(managerFilter);
      return matchesSearch && matchesManager;
    };
    return filterTree(tree, predicate);
  }, [tree, normalizedSearch, managerFilter]);

  const visibleTree = filtered.nodes;
  const effectiveExpandedIds = hasFilter ? filtered.expandedIds : expandedIds;

  const managerOptions = useMemo(
    () =>
      (employeesQuery.data?.results || []).map((emp) => ({
        id: String(emp.id),
        name: emp.name,
      })),
    [employeesQuery.data],
  );

  if (departmentsQuery.isLoading) {
    return <LoadingState label={t("loading")} />;
  }

  if (departmentsQuery.isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title={t("error_loading")}
          actionLabel={t("retry")}
          onAction={() => departmentsQuery.refetch()}
        />
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    if (hasFilter) return;
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAdd = (parentId?: string) => {
    setSelectedDept(null);
    setFormErrors({});
    setFormData({
      name: "",
      managerId: "none",
      parentId: parentId || "none",
    });
    setFormOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormErrors({});
    setFormData({
      name: dept.name,
      managerId: dept.managerId ? String(dept.managerId) : "none",
      parentId: dept.parentId ? String(dept.parentId) : "none",
    });
    setFormOpen(true);
  };

  const handleDelete = (dept: Department) => {
    setSelectedDept(dept);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const deleteTarget = selectedDept?.id;
    if (!deleteTarget) return;
    try {
      await deleteDepartment.mutateAsync(String(deleteTarget));
      toast({
        title: t("department_deleted"),
        description: t("department_deleted_desc", { name: selectedDept?.name || "" }),
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({
        title: t("generic_error"),
        description: message || t("error_loading"),
        variant: "destructive",
      });
    }
    setDeleteOpen(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("department_required");
    if (formData.parentId && formData.parentId === String(selectedDept?.id)) {
      errors.parentId = t("department_parent_invalid");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getAllDeptOptions = () => {
    const options: { id: string; name: string }[] = [];
    const excluded = selectedDept ? collectDescendantIds(tree, String(selectedDept.id)) : new Set<string>();
    if (selectedDept) excluded.add(String(selectedDept.id));
    const walk = (items: TreeDepartment[]) => {
      items.forEach((dept) => {
        if (!excluded.has(String(dept.id))) {
          options.push({ id: String(dept.id), name: dept.name });
        }
        if (dept.children?.length) walk(dept.children);
      });
    };
    walk(tree);
    return options;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !canManage) return;

    const parentId = formData.parentId === "none" ? null : formData.parentId;
    const managerId = formData.managerId === "none" ? null : formData.managerId || null;

    try {
      if (selectedDept) {
        const currentParentId = selectedDept.parentId ? String(selectedDept.parentId) : null;
        const nextParentId = parentId === String(selectedDept.id) ? currentParentId : parentId;
        const newOrder =
          nextParentId !== currentParentId
            ? getChildrenForParent(tree, nextParentId).length + 1
            : selectedDept.sortOrder ?? 0;
        await updateDepartment.mutateAsync({
          id: String(selectedDept.id),
          data: {
            name: formData.name.trim(),
            parentId: nextParentId,
            managerId,
            sortOrder: newOrder,
          },
        });
        toast({
          title: t("department_updated"),
          description: t("department_updated_desc", { name: formData.name }),
        });
      } else {
        const sortOrder = getChildrenForParent(tree, parentId).length + 1;
        await createDepartment.mutateAsync({
          name: formData.name.trim(),
          parentId,
          managerId,
          sortOrder,
        });
        toast({
          title: t("department_added"),
          description: t("department_added_desc", { name: formData.name }),
        });
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading") });
    }
  };

  const handleDragStart = (id: string) => {
    if (!canManage) return;
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDrop = async (targetId: string | null) => {
    if (!draggingId || !canManage) return;
    if (targetId === draggingId) return;
    const descendants = collectDescendantIds(tree, draggingId);
    if (targetId && descendants.has(targetId)) {
      toast({ title: t("cannot_move_into_child"), variant: "destructive" });
      return;
    }

    const dragged = departments.find((dept) => String(dept.id) === String(draggingId));
    if (!dragged) return;
    const target = targetId
      ? departments.find((dept) => String(dept.id) === String(targetId))
      : null;
    const nextParentId = target ? (target.parentId ? String(target.parentId) : null) : null;
    const siblings = getChildrenForParent(tree, nextParentId).filter(
      (dept) => String(dept.id) !== String(draggingId),
    );
    const insertIndex = target
      ? Math.max(0, siblings.findIndex((dept) => String(dept.id) === String(target.id)))
      : siblings.length;
    siblings.splice(insertIndex, 0, dragged);

    const updates = siblings.map((dept, index) => ({
      id: String(dept.id),
      data: {
        parentId: nextParentId,
        sortOrder: index + 1,
      },
    }));

    try {
      await Promise.all(updates.map((update) => updateDepartment.mutateAsync(update)));
      toast({ title: t("order_saved") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading") });
    } finally {
      handleDragEnd();
    }
  };

  const renderDepartmentTree = (dept: TreeDepartment) => {
    const isExpanded = effectiveExpandedIds.includes(String(dept.id));
    const hasChildren = dept.children && dept.children.length > 0;

    return (
      <div key={dept.id}>
        <DepartmentTreeItem
          department={{
            id: String(dept.id),
            name: dept.name,
            parentId: dept.parentId ?? null,
            managerName: dept.managerName,
            employeeCount: dept.employeeCount ?? 0,
            children: dept.children,
          }}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onDragEnter={(id) => setDropTargetId(id)}
          canManage={canManage}
          isDropTarget={dropTargetId === String(dept.id)}
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
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("structure_title")}
        subtitle={t("structure_subtitle")}
        icon={Building2}
        actions={
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5 bg-muted/40">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === "list"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
            {t("structure_list_view")}
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === "chart"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Network className="w-4 h-4" />
            {t("structure_chart_view")}
          </button>
        </div>
        <Button onClick={() => handleAdd()} disabled={!canManage} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("add_department")}
        </Button>
      </div>
        }
      />

      <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardContent className="p-4">
          <TableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search"),
            }}
            filters={
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("department_manager")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status_all")}</SelectItem>
                  {managerOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </CardContent>
      </Card>

      {/* ── Visual Org Chart ── */}
      {viewMode === "chart" && (
        <Card className="bg-card/90 border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              {t("structure_visual_chart")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-xl">
            <OrgChart
              departments={departments}
              employees={employeesQuery.data?.results ?? []}
              onDepartmentClick={(dept) => handleEdit(dept)}
              onEmployeeClick={(emp) => {
                /* navigate or open employee details */
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* ── List / Tree View ── */}
      {viewMode === "list" && (
        <Card className="bg-card/90 border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t("department_tree")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleTree.length > 0 ? (
            <div
              className="space-y-1"
              onDragOver={(event) => {
                if (!canManage) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (!canManage) return;
                event.preventDefault();
                handleDrop(null);
              }}
            >
              {visibleTree.map((dept) => renderDepartmentTree(dept))}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title={t("no_departments")}
              description={t("start_by_adding_department")}
              actionLabel={t("add_department")}
              onAction={() => handleAdd()}
            />
          )}
        </CardContent>
      </Card>
      )}

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        isEdit={!!selectedDept}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSave}
        departmentOptions={getAllDeptOptions()}
        managerOptions={managerOptions}
        isManagerLoading={employeesQuery.isLoading}
        formErrors={formErrors}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete_department_title")}
        description={t("delete_department_desc", { name: selectedDept?.name || "" })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}



/**
 * OrgChart.tsx — شجرة تنظيمية مرئية تفاعلية
 * تعتمد على @xyflow/react مع دعم Zoom / Pan / النقر على الأقسام والموظفين
 */
import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type OnInit,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Building2, Users, User, ChevronRight } from "lucide-react";
import type { Department, Employee } from "@/types/api";
import { Badge } from "@/shared/ui/badge";

/* ────────────────────────────── Types ────────────────────────────── */
interface OrgChartProps {
  departments: Department[];
  employees: Employee[];
  onDepartmentClick?: (dept: Department) => void;
  onEmployeeClick?: (emp: Employee) => void;
}

type DeptNodeData = {
  department: Department;
  employeeCount: number;
  managerName?: string;
  onDepartmentClick?: (dept: Department) => void;
};

type EmpNodeData = {
  employee: Employee;
  onEmployeeClick?: (emp: Employee) => void;
};

/* ─────────────────────── Dept Custom Node ─────────────────────── */
function DepartmentNode({ data }: NodeProps<DeptNodeData>) {
  const d = data;
  const dept = d.department;

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => d.onDepartmentClick?.(dept)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && d.onDepartmentClick?.(dept)}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/60 !w-2 !h-2" />

      {/* Card */}
      <div className="w-52 rounded-xl border border-border/70 bg-card shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-200 overflow-hidden">
        {/* Header stripe */}
        <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />

        <div className="p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate leading-tight">
                {dept.name}
              </p>
              {d.managerName && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {d.managerName}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {d.employeeCount} موظف
            </span>
            {dept.employeeCount !== undefined && dept.employeeCount > 0 && (
              <ChevronRight className="w-3 h-3 text-primary/50 mr-auto group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary/60 !w-2 !h-2" />
    </div>
  );
}

/* ─────────────────────── Employee Custom Node ─────────────────────── */
function EmployeeNode({ data }: NodeProps<EmpNodeData>) {
  const d = data;
  const emp = d.employee;

  const initials = emp.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const statusColor =
    emp.status === "active"
      ? "bg-emerald-500"
      : emp.status === "leave"
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <div
      className="cursor-pointer group"
      onClick={() => d.onEmployeeClick?.(emp)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && d.onEmployeeClick?.(emp)}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/40 !w-1.5 !h-1.5" />

      <div className="w-40 rounded-lg border border-border/50 bg-card/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 p-2.5">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {emp.avatarUrl ? (
              <img
                src={emp.avatarUrl}
                alt={emp.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                {initials}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${statusColor}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{emp.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {emp.jobTitle || emp.employeeCode || emp.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const NODE_TYPES = {
  department: DepartmentNode,
  employee: EmployeeNode,
};

/* ─────────────────────── Layout Builder ─────────────────────── */
const DEPT_W = 220;
const DEPT_H = 100;
const EMP_W = 168;
const EMP_H = 60;
const H_GAP = 40;
const V_GAP = 60;

type TreeDept = Department & { children: TreeDept[] };

function buildDeptTree(depts: Department[]): TreeDept[] {
  const map = new Map<string, TreeDept>();
  depts.forEach((d) => map.set(String(d.id), { ...d, children: [] }));
  const roots: TreeDept[] = [];
  map.forEach((node) => {
    const pid = node.parentId ? String(node.parentId) : null;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/** Returns the total width consumed by a subtree */
function subtreeWidth(node: TreeDept): number {
  if (!node.children.length) return DEPT_W;
  const childTotal = node.children.reduce(
    (acc, c) => acc + subtreeWidth(c) + H_GAP,
    -H_GAP
  );
  return Math.max(DEPT_W, childTotal);
}

function layoutTree(
  nodes: Node[],
  edges: Edge[],
  tree: TreeDept[],
  employees: Employee[],
  onDeptClick?: (d: Department) => void,
  onEmpClick?: (e: Employee) => void
) {
  const empByDept = new Map<string, Employee[]>();
  const deptIdByName = new Map<string, string>();
  const registerDept = (node: TreeDept) => {
    deptIdByName.set(node.name, String(node.id));
    node.children.forEach(registerDept);
  };
  tree.forEach(registerDept);

  employees.forEach((emp) => {
    const key =
      (emp.departmentId ? String(emp.departmentId) : undefined) ||
      (emp.department ? deptIdByName.get(emp.department) : undefined) ||
      "__none__";
    if (!empByDept.has(key)) empByDept.set(key, []);
    empByDept.get(key)!.push(emp);
  });

  function place(subtree: TreeDept, x: number, y: number) {
    const totalW = subtreeWidth(subtree);
    const cx = x + totalW / 2 - DEPT_W / 2;

    const deptId = `dept-${subtree.id}`;
    const deptEmps = empByDept.get(String(subtree.id)) ?? [];

    nodes.push({
      id: deptId,
      type: "department",
      position: { x: cx, y },
      data: {
        department: subtree,
        employeeCount: deptEmps.length,
        managerName: subtree.managerName ?? undefined,
        onDepartmentClick: onDeptClick,
      },
    });

    // Employee mini-nodes below this dept
    const empStartY = y + DEPT_H + 20;
    const empTotalW = deptEmps.length * (EMP_W + 12) - 12;
    const empStartX = cx + DEPT_W / 2 - empTotalW / 2;
    deptEmps.forEach((emp, ei) => {
      const empId = `emp-${emp.id}`;
      const ex = empStartX + ei * (EMP_W + 12);
      nodes.push({
        id: empId,
        type: "employee",
        position: { x: ex, y: empStartY },
        data: { employee: emp, onEmployeeClick: onEmpClick },
      });
      edges.push({
        id: `e-${deptId}-${empId}`,
        source: deptId,
        target: empId,
        animated: false,
        style: { stroke: "hsl(var(--primary)/0.25)", strokeDasharray: "4 3" },
      });
    });

    // Children below employee block
    const hasEmployees = deptEmps.length > 0;
    const childY = empStartY + (hasEmployees ? EMP_H + V_GAP : V_GAP);

    let childX = x;
    subtree.children.forEach((child) => {
      const cw = subtreeWidth(child);
      const childDeptId = `dept-${child.id}`;
      place(child, childX, childY);
      edges.push({
        id: `e-${deptId}-${childDeptId}`,
        source: deptId,
        target: childDeptId,
        style: { stroke: "hsl(var(--primary)/0.5)", strokeWidth: 1.5 },
        type: "smoothstep",
      });
      childX += cw + H_GAP;
    });
  }

  let rootX = 0;
  tree.forEach((root) => {
    place(root, rootX, 0);
    rootX += subtreeWidth(root) + H_GAP * 2;
  });
}

/* ─────────────────────── Main Component ─────────────────────── */
export function OrgChart({
  departments,
  employees,
  onDepartmentClick,
  onEmployeeClick,
}: OrgChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const tree = useMemo(() => buildDeptTree(departments), [departments]);

  useEffect(() => {
    const n: Node[] = [];
    const e: Edge[] = [];
    layoutTree(n, e, tree, employees, onDepartmentClick, onEmployeeClick);
    setNodes(n);
    setEdges(e);
  }, [employees, onDepartmentClick, onEmployeeClick, setEdges, setNodes, tree]);

  const onInit = useCallback<OnInit>((instance) => {
    // Fit view after layout is ready
    setTimeout(() => instance.fitView({ padding: 0.12, duration: 400 }), 100);
  }, []);

  if (departments.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center space-y-2">
          <Building2 className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-sm">لا توجد أقسام لعرض الهيكل التنظيمي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[680px] rounded-xl overflow-hidden border border-border/60 bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--border))"
        />
        <Controls
          showInteractive={false}
          style={{ bottom: 16, left: 16 }}
        />
        <MiniMap
          style={{ bottom: 16, right: 16 }}
          maskColor="hsl(var(--background)/0.85)"
          nodeColor={(n) =>
            n.type === "department"
              ? "hsl(var(--primary)/0.7)"
              : "hsl(var(--muted-foreground)/0.4)"
          }
        />
      </ReactFlow>
    </div>
  );
}

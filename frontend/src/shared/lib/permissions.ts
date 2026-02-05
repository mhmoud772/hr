import type { User } from "@/types/api";

const ROLE_RULES: Record<string, Record<string, Set<"read" | "write">>> = {
  system_admin: {
    default: new Set(["read", "write"]),
    users: new Set(["read", "write"]),
  },
  admin: {
    default: new Set(["read", "write"]),
    users: new Set(["read", "write"]),
  },
  hr_manager: {
    default: new Set(["read", "write"]),
    users: new Set(["read", "write"]),
  },
  supervisor: {
    default: new Set(["read"]),
    users: new Set(["read"]),
    leaves: new Set(["read", "write"]),
    attendance: new Set(["read"]),
  },
  employee: {
    default: new Set(["read"]),
    me: new Set(["read"]),
    notifications: new Set(["read", "write"]),
    employees: new Set(["read", "write"]),
  },
};

const RESOURCE_MAP: Record<string, string> = {
  dashboard: "reports",
  job_titles: "structure",
  audit_logs: "settings",
};

export const getResourceFromRoute = (pathname: string) => {
  if (pathname === "/") return "reports";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/employees")) return "employees";
  if (pathname.startsWith("/attendance")) return "attendance";
  if (pathname.startsWith("/leaves")) return "leaves";
  if (pathname.startsWith("/structure")) return "structure";
  if (pathname.startsWith("/devices")) return "devices";
  if (pathname.startsWith("/job-titles")) return "structure";
  if (pathname.startsWith("/users")) return "users";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/audit-logs")) return "settings";
  if (pathname.startsWith("/payroll")) return "payroll";
  if (pathname.startsWith("/recruitment")) return "recruitment";
  if (pathname.startsWith("/performance")) return "performance";
  if (pathname.startsWith("/training")) return "training";
  if (pathname.startsWith("/assets")) return "assets";
  if (pathname.startsWith("/self-service")) return "self_service";
  return null;
};

export const canAccessResource = (
  user: User | null | undefined,
  resource: string | null,
  action: "read" | "write" = "read",
) => {
  if (!resource) return true;
  if (!user) return false;
  if (resource === "self_service") return true;

  const mapped = RESOURCE_MAP[resource] || resource;
  const permissions = user.permissions ?? [];
  if (permissions.length > 0) {
    return mapped === "default" || permissions.includes(mapped);
  }

  const role = String(user.role || "employee");
  const rules = ROLE_RULES[role] || ROLE_RULES.employee;
  const allowed = rules[mapped] || rules.default || new Set(["read"]);
  return allowed.has(action);
};

import type { User } from "@/types/api";

const RESOURCE_MAP: Record<string, string> = {
  dashboard: "reports",
  job_titles: "structure",
  audit_logs: "settings",
};

const DEFAULT_RULES: Record<string, Set<"read" | "write">> = {
  reports: new Set(["read"]),
  self_service: new Set(["read", "write"]),
};

export const ADMIN_ROLES = new Set(["system_admin", "admin", "hr_manager"]);

const normalizeCodes = (codes?: string[]) =>
  (Array.isArray(codes) ? codes : [])
    .map((code) => String(code || "").trim().toLowerCase())
    .filter(Boolean);

const hasPermissionCode = (codes: string[], resource: string, action: "read" | "write") => {
  if (codes.includes("*") || codes.includes("all")) return true;
  const candidates = [resource, `${resource}.${action}`, `${resource}.*`];
  return candidates.some((code) => codes.includes(code));
};

export const getResourceFromRoute = (pathname: string) => {
  if (pathname === "/") return "reports";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/employees")) return "employees";
  if (pathname.startsWith("/attendance")) return "attendance";
  if (pathname.startsWith("/leaves")) return "leaves";
  if (pathname.startsWith("/structure")) return "structure";
  if (pathname.startsWith("/devices")) return "devices";
  if (pathname.startsWith("/device-command-center")) return "devices";
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

  // Use server-provided effective permissions first when available.
  const effectivePermissions = normalizeCodes(user.effective_permissions);
  if (effectivePermissions.length > 0) {
    return hasPermissionCode(effectivePermissions, mapped, action);
  }

  // Explicit permissions list has priority and should match backend behavior.
  const explicitPermissions = normalizeCodes(user.permissions);
  if (explicitPermissions.length > 0) {
    return hasPermissionCode(explicitPermissions, mapped, action);
  }

  const roleCode = String(user.role || "").trim().toLowerCase();
  if (ADMIN_ROLES.has(roleCode)) {
    return true;
  }

  // Role-based permissions from role details (if provided)
  const rolePermissions = normalizeCodes(
    (user as { rolePermissions?: string[] }).rolePermissions || user.role_permissions || [],
  );
  if (rolePermissions.length > 0) {
    return hasPermissionCode(rolePermissions, mapped, action);
  }

  // Fallback: minimum safe access (dashboard + self service only)
  const allowed = DEFAULT_RULES[mapped] || new Set<"read" | "write">();
  return allowed.has(action);
};

export const hasExactPermission = (
  user: User | null | undefined,
  permissionCode: string
) => {
  if (!user) return false;
  
  const roleCode = String(user.role || "").trim().toLowerCase();
  if (ADMIN_ROLES.has(roleCode)) return true;

  const codes = [
    ...normalizeCodes(user.effective_permissions),
    ...normalizeCodes(user.permissions),
    ...normalizeCodes(
      (user as { rolePermissions?: string[] }).rolePermissions || user.role_permissions || [],
    ),
  ];
  
  const normalizedReq = permissionCode.trim().toLowerCase();
  if (codes.includes("*") || codes.includes("all")) return true;
  return codes.includes(normalizedReq);
};

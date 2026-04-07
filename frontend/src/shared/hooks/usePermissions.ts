import { useAuth } from "@/features/auth/components/AuthProvider";
import { hasExactPermission, canAccessResource } from "@/shared/lib/permissions";

export function usePermissions() {
  const { user } = useAuth();

  return {
    canAccess: (resource: string, action: "read" | "write" = "read") =>
      canAccessResource(user, resource, action),
    hasPermission: (permissionCode: string) =>
      hasExactPermission(user, permissionCode),
    hasAnyPermission: (permissionCodes: string[]) =>
      permissionCodes.some((code) => hasExactPermission(user, code)),
    hasAllPermissions: (permissionCodes: string[]) =>
        permissionCodes.every((code) => hasExactPermission(user, code)),
  };
}

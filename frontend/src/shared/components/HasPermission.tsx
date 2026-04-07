import { ReactNode } from "react";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { hasExactPermission, canAccessResource } from "@/shared/lib/permissions";

interface HasPermissionProps {
  required?: string | string[];
  resource?: string;
  action?: "read" | "write";
  fallback?: ReactNode;
  children: ReactNode;
  requireAll?: boolean;
}

export function HasPermission({
  required,
  resource,
  action = "read",
  fallback = null,
  children,
  requireAll = false,
}: HasPermissionProps) {
  const { user } = useAuth();
  
  let hasAccess = false;
  
  if (resource) {
    hasAccess = canAccessResource(user, resource, action);
  } else if (required) {
    const requiredArray = Array.isArray(required) ? required : [required];
    if (requireAll) {
       hasAccess = requiredArray.every(code => hasExactPermission(user, code));
    } else {
       hasAccess = requiredArray.some(code => hasExactPermission(user, code));
    }
  } else {
    hasAccess = true;
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

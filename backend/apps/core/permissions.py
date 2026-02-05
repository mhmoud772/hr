from rest_framework.permissions import BasePermission, SAFE_METHODS


ROLE_RULES = {
    "system_admin": {
        "default": {"read", "write"},
        "users": {"read", "write"},
    },
    "admin": {
        "default": {"read", "write"},
        "users": {"read", "write"},
    },
    "hr_manager": {
        "default": {"read", "write"},
        "users": {"read", "write"},
    },
    "supervisor": {
        "default": {"read"},
        "users": {"read"},
        "leaves": {"read", "write"},
        "attendance": {"read"},
    },
    "employee": {
        "default": {"read"},
        "me": {"read"},
        "notifications": {"read", "write"},
        "employees": {"read", "write"},
    },
}

RESOURCE_MAP = {
    "employee": "employees",
    "attendance": "attendance",
    "leave": "leaves",
    "device": "devices",
    "department": "structure",
    "jobtitle": "structure",
    "settings": "settings",
    "notification": "notifications",
    "user": "users",
    "auditlog": "settings",
    "employeedocument": "employees",
    "payrollrecord": "payroll",
    "recruitmentcandidate": "recruitment",
    "performancereview": "performance",
    "trainingrecord": "training",
    "asset": "assets",
    "dashboard": "reports",
}


class RolePermission(BasePermission):
    """
    Map user role to allowed actions on a per-view basis.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", "employee")
        rules = ROLE_RULES.get(role, ROLE_RULES["employee"])
        resource = getattr(view, "basename", None) or getattr(view, "resource_name", "default")
        resource = RESOURCE_MAP.get(resource, resource)

        user_permissions = getattr(request.user, "permissions", None) or []
        if user_permissions:
            if resource not in user_permissions and resource != "default":
                return False
            return True

        allowed = rules.get(resource, rules.get("default", {"read"}))

        if request.method in SAFE_METHODS:
            return "read" in allowed
        return "write" in allowed

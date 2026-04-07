from __future__ import annotations

from typing import Iterable, Set

from rest_framework.permissions import BasePermission, SAFE_METHODS

ROLE_RULES = {
    "system_admin": {"default": {"read", "write"}},
    "admin": {"default": {"read", "write"}},
    "hr_manager": {"default": {"read", "write"}},
    "supervisor": {
        "default": {"read"},
        "leaves": {"read", "write"},
        "attendance": {"read"},
    },
    "employee": {
        "default": {"read"},
        "me": {"read", "write"},
        "notifications": {"read", "write"},
    },
}

RESOURCE_MAP = {
    "employee": "employees",
    "employees": "employees",
    "attendance": "attendance",
    "leave": "leaves",
    "leaves": "leaves",
    "device": "devices",
    "devices": "devices",
    "device-groups": "devices",
    "device-policies": "devices",
    "device-templates": "devices",
    "device-command-approvals": "devices",
    "device-firmware-rollouts": "devices",
    "device-backups": "devices",
    "device-command-center": "devices",
    "department": "structure",
    "departments": "structure",
    "jobtitle": "structure",
    "job-titles": "structure",
    "settings": "settings",
    "notification": "notifications",
    "notifications": "notifications",
    "notificationread": "notifications",
    "notification-read": "notifications",
    "auditlog": "settings",
    "audit-logs": "settings",
    "user": "users",
    "users": "users",
    "roles": "settings",
    "role": "settings",
    "permissions": "settings",
    "permission": "settings",
    "payrollrecord": "payroll",
    "payroll": "payroll",
    "recruitmentcandidate": "recruitment",
    "recruitment": "recruitment",
    "performancereview": "performance",
    "performance": "performance",
    "trainingrecord": "training",
    "training": "training",
    "asset": "assets",
    "assets": "assets",
    "dashboard": "reports",
    "analytics": "reports",
    "reports": "reports",
    "webauthncredential": "settings",
    "employeedocument": "employees",
    "employee-documents": "employees",
}


def is_admin_role(user) -> bool:
    role = str(getattr(user, "role", "") or "").strip().lower()
    return role in {"system_admin", "admin", "hr_manager"}


def normalize_resource(resource: str | None) -> str:
    key = str(resource or "default").strip().lower()
    return RESOURCE_MAP.get(key, key)


def _normalize_codes(codes: Iterable[str] | None) -> Set[str]:
    if not codes:
        return set()
    normalized = set()
    for code in codes:
        value = str(code or "").strip().lower()
        if value:
            normalized.add(value)
    return normalized


def get_explicit_permission_codes(user) -> Set[str]:
    explicit = (
        getattr(user, "permissions_list", None)
        or getattr(user, "permissions", None)
        or []
    )
    return _normalize_codes(explicit)


def get_role_permission_codes(user) -> Set[str]:
    roles_manager = getattr(user, "roles_list", None) or getattr(user, "roles", None)
    if roles_manager is None:
        return set()
    return _normalize_codes(roles_manager.values_list("permissions__code", flat=True))


def get_effective_permission_codes(user) -> Set[str]:
    explicit_codes = get_explicit_permission_codes(user)
    if explicit_codes:
        return explicit_codes
    return get_role_permission_codes(user)


def permission_mode_for_user(user) -> str:
    if get_explicit_permission_codes(user):
        return "explicit"
    if get_role_permission_codes(user):
        return "role"
    return "legacy"


def _matches_permission(codes: Set[str], resource: str, action: str) -> bool:
    if {"*", "all"} & codes:
        return True
    candidates = {
        resource,
        f"{resource}.{action}",
        f"{resource}.*",
    }
    return bool(candidates & codes)


def has_any_permission_code(user, required_codes: Iterable[str]) -> bool:
    codes = get_effective_permission_codes(user)
    needed = _normalize_codes(required_codes)
    if codes:
        if {"*", "all"} & codes:
            return True
        return bool(codes & needed)
    return is_admin_role(user)


class RolePermission(BasePermission):
    """
    Central access control layer for modular apps.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        resource = getattr(view, "basename", None) or getattr(view, "resource_name", "default")
        resource = normalize_resource(resource)
        action = "read" if request.method in SAFE_METHODS else "write"

        effective_codes = get_effective_permission_codes(request.user)
        if effective_codes:
            return _matches_permission(effective_codes, resource, action)

        role = str(getattr(request.user, "role", "employee") or "employee").strip().lower()
        rules = ROLE_RULES.get(role, ROLE_RULES["employee"])
        allowed = rules.get(resource, rules.get("default", {"read"}))
        return action in allowed

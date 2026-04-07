from django.core.cache import cache

from apps.system.models import Settings
from apps.employees.services.employee_service import EmployeeService


_SECURITY_POLICY_CACHE_KEY = "settings:security-policy"


def _get_security_policy():
    cached = cache.get(_SECURITY_POLICY_CACHE_KEY)
    if cached is not None:
        return cached

    settings_obj = Settings.objects.first()
    policy = (settings_obj.general_settings or {}).get("security", {}) if settings_obj else {}
    cache.set(_SECURITY_POLICY_CACHE_KEY, policy, timeout=300)
    return policy


def _validate_security_policy(password: str):
    policy = _get_security_policy()
    min_len = int(policy.get("passwordMinLength") or 0)
    if min_len and len(password) < min_len:
        raise ValueError(f"Password must be at least {min_len} characters.")
    if policy.get("passwordRequireUpper") and not any(c.isupper() for c in password):
        raise ValueError("Password must include an uppercase letter.")
    if policy.get("passwordRequireNumber") and not any(c.isdigit() for c in password):
        raise ValueError("Password must include a number.")
    if policy.get("passwordRequireSymbol") and not any(not c.isalnum() for c in password):
        raise ValueError("Password must include a symbol.")


def get_department_scope_for_user(user):
    return EmployeeService.get_department_scope_for_user(user)

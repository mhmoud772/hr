"""
Biometric processing utilities - migrated to apps.attendance.utils.
"""
from __future__ import annotations

from datetime import date, time

from django.utils import timezone

from apps.attendance.models import Attendance, BiometricLog
from apps.employees.models import Employee


def _to_local_time(value):
    if value is None:
        return None
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    return value.time()


def refresh_attendance_window(*, employee: Employee, attendance_date: date, threshold: time | None = None) -> Attendance:
    """
    Recalculate attendance for an employee/day using first and last biometric punch.
    """
    logs = BiometricLog.objects.filter(
        employee_code=employee.employee_code,
        timestamp__date=attendance_date,
    )
    first_ts = logs.order_by("timestamp").values_list("timestamp", flat=True).first()
    last_ts = logs.order_by("-timestamp").values_list("timestamp", flat=True).first()

    attendance, _ = Attendance.objects.get_or_create(
        employee=employee,
        date=attendance_date,
        defaults={"status": "present"},
    )

    attendance.check_in = _to_local_time(first_ts)
    if first_ts and last_ts and last_ts > first_ts:
        attendance.check_out = _to_local_time(last_ts)
    else:
        attendance.check_out = None

    if attendance.check_in:
        if threshold and attendance.check_in > threshold:
            attendance.status = "late"
        else:
            attendance.status = "present"

    attendance.save(update_fields=["check_in", "check_out", "status"])
    return attendance

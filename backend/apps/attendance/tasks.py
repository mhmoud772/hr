from __future__ import annotations

import logging
from datetime import date, datetime, time

from celery import shared_task
from django.db import IntegrityError
from django.utils import timezone

from apps.attendance.models import BiometricLog
from apps.attendance.utils.biometric_processing import refresh_attendance_window
from apps.devices.models import Device, DeviceUserMapping
from apps.employees.models import Employee
from shared.system import get_settings

logger = logging.getLogger(__name__)


def _attendance_threshold():
    settings_obj = get_settings()
    attendance_settings = settings_obj.attendance_settings if settings_obj else {}
    work_start = attendance_settings.get("workStartTime") if attendance_settings else None
    late_threshold = attendance_settings.get("lateThreshold") if attendance_settings else None
    if not work_start:
        return None
    try:
        start = datetime.strptime(work_start, "%H:%M").time()
        threshold = datetime.strptime(late_threshold, "%H:%M").time() if late_threshold else start
        return threshold
    except Exception:
        return None


def _json_safe(value):
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, (date, time)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def _apply_biometric_log(device: Device, log_item: dict) -> bool:
    employee_code = (
        log_item.get("employee_code")
        or log_item.get("employeeId")
        or log_item.get("employee")
    )
    if not employee_code:
        return False

    device_user_id = str(employee_code).strip()
    if not device_user_id:
        return False

    mapping = DeviceUserMapping.objects.select_related("employee").filter(
        device=device,
        device_user_id=device_user_id,
    ).first()
    if mapping:
        employee = mapping.employee
    else:
        employee = Employee.objects.filter(employee_code=device_user_id).first()
        if not employee:
            return False

    resolved_employee_code = employee.employee_code
    timestamp = log_item.get("timestamp") or log_item.get("time")
    if not timestamp:
        return False

    if isinstance(timestamp, datetime):
        ts = timestamp
    else:
        try:
            ts = datetime.fromisoformat(str(timestamp))
        except Exception:
            return False

    if timezone.is_naive(ts):
        ts = timezone.make_aware(ts, timezone.get_current_timezone())

    action = log_item.get("action")
    if not action:
        if log_item.get("check_in"):
            action = "check_in"
        elif log_item.get("check_out"):
            action = "check_out"
    if action not in ["check_in", "check_out"]:
        return False

    try:
        raw_payload = _json_safe(log_item)
        if isinstance(raw_payload, dict):
            raw_payload.setdefault("device_user_id", device_user_id)
            raw_payload.setdefault("resolved_employee_code", resolved_employee_code)
        _, created = BiometricLog.objects.get_or_create(
            device=device,
            employee_code=resolved_employee_code,
            timestamp=ts,
            action=action,
            defaults={"raw_data": raw_payload},
        )
    except IntegrityError:
        created = False

    if not created:
        return False

    refresh_attendance_window(
        employee=employee,
        attendance_date=ts.date(),
        threshold=_attendance_threshold(),
    )
    return True


@shared_task(bind=True, max_retries=3)
def process_biometric_ingest_task(self, device_id: int, logs: list[dict]):
    device = Device.objects.get(id=device_id)
    created = 0
    for item in logs:
        if _apply_biometric_log(device, item):
            created += 1
    return {"status": "ok", "created": created}

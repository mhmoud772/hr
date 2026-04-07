"""
Celery tasks for the devices app - device sync, command execution, etc.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from celery import shared_task
from django.utils import timezone

from apps.devices.services import zk_service

logger = logging.getLogger(__name__)


def _get_device(device_id: int):
    from apps.devices.models import Device
    return Device.objects.select_related("policy").get(pk=device_id)


def _get_sync_log(log_id: int):
    from apps.devices.models import DeviceSyncLog
    return DeviceSyncLog.objects.get(pk=log_id)


def _finish_log(log, status: str, message: str):
    log.status = status
    log.message = message
    log.finished_at = timezone.now()
    log.save(update_fields=["status", "message", "finished_at"])


def _json_safe(value):
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (datetime,)):
        return value.isoformat()
    return value


@shared_task(bind=True, max_retries=3)
def run_device_sync_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        limit = kwargs.get("limit")
        records = zk_service.pull_logs(device, limit=int(limit) if limit else None)
        from apps.attendance.models import BiometricLog
        from apps.devices.models import DeviceUserMapping
        from apps.employees.models import Employee
        from apps.attendance.services.biometric_processing import refresh_attendance_window

        created = 0
        for rec in records:
            emp_code = str(rec.get("employee_code") or "").strip()
            ts = rec.get("timestamp")
            action = rec.get("action", "check_in")
            if not emp_code or not ts:
                continue
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts)
                except Exception:
                    continue
            if timezone.is_naive(ts):
                ts = timezone.make_aware(ts, timezone.get_current_timezone())

            employee = Employee.objects.filter(employee_code=emp_code).first()
            if not employee:
                continue

            _, c = BiometricLog.objects.get_or_create(
                device=device,
                employee_code=emp_code,
                timestamp=ts,
                action=action,
                defaults={"raw_data": _json_safe(rec)},
            )
            if c:
                created += 1
                refresh_attendance_window(employee=employee, attendance_date=ts.date())

        device.last_sync = timezone.now()
        device.save(update_fields=["last_sync"])
        _finish_log(log, "success", f"Synced {len(records)} records, {created} new.")
        return {"status": "success", "total": len(records), "created": created}
    except Exception as exc:
        logger.exception(f"Device sync failed for device {device_id}: {exc}")
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_sync_time_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        zk_service.sync_time(device)
        _finish_log(log, "success", "Device time synchronized.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_reboot_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        zk_service.reboot(device)
        _finish_log(log, "success", "Device rebooted.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def run_device_pull_logs_task(self, device_id: int, log_id: int, **kwargs):
    return run_device_sync_task(device_id, log_id, **kwargs)


@shared_task(bind=True, max_retries=3)
def run_device_pull_template_task(self, device_id: int, log_id: int, **kwargs):
    from apps.devices.models import BiometricTemplate, BiometricTemplateDistribution, Device
    from apps.employees.models import Employee
    import hashlib
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        employee_code = kwargs.get("employee_code", "")
        template_type = kwargs.get("template_type", "fingerprint")
        template_index = int(kwargs.get("template_index", 0))
        employee = Employee.objects.filter(employee_code=employee_code).first()
        if not employee:
            _finish_log(log, "failed", f"Employee {employee_code} not found.")
            return {"status": "failed"}

        templates = zk_service.pull_templates(
            device,
            employee_code=employee_code,
            template_type=template_type,
            template_index=template_index,
        )
        captured_templates = []
        for tmpl in templates:
            data = str(tmpl.get("template_data", ""))
            if not data:
                continue
            t_hash = hashlib.sha256(data.encode()).hexdigest()
            template_obj, _created = BiometricTemplate.objects.update_or_create(
                employee=employee,
                template_type=template_type,
                template_index=template_index,
                source_device=device,
                defaults={"template_data": data, "template_hash": t_hash, "is_active": True},
            )
            captured_templates.append(template_obj)

        distributed = 0
        target_device_ids = kwargs.get("target_device_ids") or []
        auto_distribute = bool(kwargs.get("auto_distribute", True))
        if auto_distribute and captured_templates and target_device_ids:
            target_devices = Device.objects.filter(id__in=target_device_ids).exclude(id=device.id)
            for template_obj in captured_templates:
                for target_device in target_devices:
                    dist, _created = BiometricTemplateDistribution.objects.get_or_create(
                        template=template_obj,
                        device=target_device,
                        defaults={"requested_by": log.requested_by, "status": "queued"},
                    )
                    success = zk_service.push_template(
                        target_device,
                        employee_code=employee.employee_code,
                        template_type=template_obj.template_type,
                        template_data=template_obj.template_data,
                        template_index=template_obj.template_index,
                    )
                    dist.requested_by = dist.requested_by or log.requested_by
                    dist.status = "success" if success else "failed"
                    dist.message = "Template distributed." if success else "SDK does not support template push."
                    dist.finished_at = timezone.now()
                    dist.save(update_fields=["requested_by", "status", "message", "finished_at"])
                    if success:
                        distributed += 1
                        template_obj.last_distributed_at = timezone.now()
                        template_obj.save(update_fields=["last_distributed_at"])

        _finish_log(
            log,
            "success",
            f"Pulled {len(templates)} template(s) for {employee_code}. Distributed {distributed}.",
        )
        return {"status": "success", "count": len(templates), "distributed": distributed}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_push_employee_task(self, device_id: int, log_id: int, **kwargs):
    from apps.employees.models import Employee
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        employee_id = kwargs.get("employee_id")
        employee = Employee.objects.get(pk=employee_id)
        zk_service.push_employee(device, employee)
        _finish_log(log, "success", f"Employee {employee.employee_code} pushed to device.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_disable_employee_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        emp_code = kwargs.get("employee_code", "")
        zk_service.set_employee_enabled(device, emp_code, enabled=False)
        _finish_log(log, "success", f"Employee {emp_code} disabled on device.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_enable_employee_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        emp_code = kwargs.get("employee_code", "")
        zk_service.set_employee_enabled(device, emp_code, enabled=True)
        _finish_log(log, "success", f"Employee {emp_code} enabled on device.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_delete_employee_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        emp_code = kwargs.get("employee_code", "")
        zk_service.delete_employee(device, emp_code)
        _finish_log(log, "success", f"Employee {emp_code} deleted from device.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_clear_logs_task(self, device_id: int, log_id: int, **kwargs):
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        zk_service.clear_attendance_logs(device)
        _finish_log(log, "success", "Device attendance logs cleared.")
        return {"status": "success"}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_apply_policy_task(self, device_id: int, log_id: int, **kwargs):
    from apps.devices.models import DevicePolicy
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        policy_id = kwargs.get("policy_id")
        policy = DevicePolicy.objects.get(pk=policy_id)
        report = zk_service.apply_policy(device, policy)
        _finish_log(log, "success", f"Policy applied: {report}")
        return {"status": "success", "report": report}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_distribute_template_task(self, device_id: int, log_id: int, **kwargs):
    from apps.devices.models import BiometricTemplate, BiometricTemplateDistribution
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        template_id = kwargs.get("template_id")
        template = BiometricTemplate.objects.select_related("employee").get(pk=template_id)
        dist, _ = BiometricTemplateDistribution.objects.get_or_create(
            template=template, device=device,
            defaults={"status": "in_progress", "started_at": timezone.now()},
        )
        success = zk_service.push_template(
            device,
            employee_code=template.employee.employee_code,
            template_type=template.template_type,
            template_data=template.template_data,
            template_index=template.template_index,
        )
        dist.status = "success" if success else "failed"
        dist.message = "Template distributed." if success else "SDK does not support template push."
        dist.finished_at = timezone.now()
        dist.save(update_fields=["status", "message", "finished_at"])
        _finish_log(log, "success" if success else "failed", dist.message)
        return {"status": dist.status}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def run_device_firmware_rollout_task(self, device_id: int, log_id: int, **kwargs):
    from apps.devices.models import DeviceFirmwareRollout
    try:
        device = _get_device(device_id)
        log = _get_sync_log(log_id)
        rollout_id = kwargs.get("rollout_id")
        rollout = DeviceFirmwareRollout.objects.get(pk=rollout_id)
        result = zk_service.stage_firmware_rollout(device, rollout.target_version)
        _finish_log(log, "success", f"Firmware rollout: {result}")
        return {"status": "success", "result": result}
    except Exception as exc:
        try:
            log = _get_sync_log(log_id)
            _finish_log(log, "failed", str(exc))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60)


@shared_task
def task_monitor_device_health():
    """
    Check last_heartbeat for all 'online' devices and mark as 'offline' if timed out.
    """
    from django.conf import settings
    from django.utils import timezone
    from apps.devices.models import Device

    timeout = int(getattr(settings, "DEVICE_HEARTBEAT_TIMEOUT_SECONDS", 180) or 180)
    cutoff = timezone.now() - timedelta(seconds=timeout)

    # 1. Bulk offline transition
    stale_devices = Device.objects.filter(
        status="online",
        last_heartbeat__lt=cutoff
    )
    count = stale_devices.count()
    if count > 0:
        logger.info(f"Monitor: Marking {count} devices as offline (stale heartbeats).")
        stale_devices.update(status="offline")

    # 2. Daily cleanup of very old devices (Optional: move to 'inactive' if no heartbeat for 7 days)
    # This is a useful secondary maintenance step mentioned in settings.py
    inactive_days = int(getattr(settings, "DEVICE_INACTIVE_DAYS", 7) or 7)
    inactive_cutoff = timezone.now() - timedelta(days=inactive_days)
    inactive_devices = Device.objects.filter(
        status="offline",
        last_heartbeat__lt=inactive_cutoff
    ).exclude(status="inactive")

    inactive_count = inactive_devices.count()
    if inactive_count > 0:
        logger.info(f"Monitor: Marking {inactive_count} devices as inactive (no pulse for {inactive_days} days).")
        inactive_devices.update(status="inactive")

    return {"offline_marked": count, "inactive_marked": inactive_count}

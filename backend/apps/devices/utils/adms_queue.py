from __future__ import annotations

from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone


def _queue_key(device_id: int | str) -> str:
    return f"adms:queue:{device_id}"


def _queue_ttl_seconds() -> int:
    try:
        value = int(getattr(settings, "ADMS_COMMAND_QUEUE_TTL_SECONDS", 3600))
    except (TypeError, ValueError):
        value = 3600
    return max(60, value)


def _next_command_id() -> int:
    key = "adms:queue:seq"
    try:
        return int(cache.incr(key))
    except Exception:
        cache.set(key, 1, timeout=None)
        return 1


def _resolve_timezone_name(payload: dict[str, Any] | None = None) -> str:
    payload = payload or {}
    timezone_name = (
        str(payload.get("timezone") or payload.get("time_zone") or "").strip()
        or str(getattr(settings, "DEVICE_SYNC_TIME_ZONE", "") or "").strip()
        or str(getattr(settings, "TIME_ZONE", "") or "").strip()
    )
    return timezone_name


def _device_local_time(timezone_name: str = "") -> str:
    now = timezone.now()
    if timezone_name:
        try:
            now = now.astimezone(ZoneInfo(timezone_name))
        except ZoneInfoNotFoundError:
            now = timezone.localtime(now)
    else:
        now = timezone.localtime(now)
    return now.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")


def build_adms_command_text(command: str, payload: dict[str, Any] | None = None) -> str:
    normalized = str(command or "").strip().lower()
    payload = payload or {}
    cid = _next_command_id()

    if normalized in {"sync", "pull_logs"}:
        # Ask device to upload attendance logs through ADMS push.
        return f"C:{cid}:DATA QUERY ATTLOG"

    if normalized == "sync_time":
        timezone_name = _resolve_timezone_name(payload)
        return f"C:{cid}:SET OPTION DATETIME={_device_local_time(timezone_name)}"

    if normalized == "reboot":
        return f"C:{cid}:REBOOT"

    if normalized == "clear_logs":
        return f"C:{cid}:CLEAR LOG"

    if normalized == "push_employee":
        employee_code = str(payload.get("employee_code") or payload.get("employeeCode") or "").strip()
        if not employee_code:
            raise ValueError("employeeCode is required for push_employee.")
        # ADMS firmware variants differ for user update format; keep minimal safe payload.
        return f"C:{cid}:DATA UPDATE USERINFO PIN={employee_code}"

    raise ValueError(f"Command '{normalized}' is not supported through ADMS pull channel.")


def enqueue_adms_command(
    *,
    device_id: int | str,
    command: str,
    payload: dict[str, Any] | None = None,
    log_id: int | str | None = None,
) -> dict[str, Any]:
    command_text = build_adms_command_text(command, payload=payload)
    key = _queue_key(device_id)
    queue: list[dict[str, Any]] = cache.get(key, []) or []
    item = {
        "command": str(command or "").strip(),
        "commandText": command_text,
        "payload": payload or {},
        "queuedAt": timezone.now().isoformat(),
        "logId": int(log_id) if log_id not in [None, ""] else None,
    }
    queue.append(item)
    cache.set(key, queue, timeout=_queue_ttl_seconds())
    return item


def pop_adms_command(*, device_id: int | str) -> dict[str, Any] | None:
    key = _queue_key(device_id)
    queue: list[dict[str, Any]] = cache.get(key, []) or []
    if not queue:
        return None
    item = queue.pop(0)
    if queue:
        cache.set(key, queue, timeout=_queue_ttl_seconds())
    else:
        cache.delete(key)
    return item


def pop_device_command(device_serial: str) -> str | None:
    # helper for ADMS GetRequestView
    from apps.devices.models import Device
    device = Device.objects.filter(serial_number=device_serial).first()
    if not device:
        return None
    item = pop_adms_command(device_id=device.id)
    if not item:
        return None
    return item.get("commandText")


def queue_size(*, device_id: int | str) -> int:
    queue: list[dict[str, Any]] = cache.get(_queue_key(device_id), []) or []
    return len(queue)


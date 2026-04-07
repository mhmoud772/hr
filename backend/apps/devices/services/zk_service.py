"""
Device service for ZKTeco biometric devices.

- Tries pyzkaccess (requires native zkaccess.dll) first.
- Falls back to pure-Python pyzk (zklib) when the DLL is not available, so we
  can still connect/pull logs on Windows/Linux without native dependencies.
"""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from django.conf import settings

from ..utils.security import decrypt_comm_key

logger = logging.getLogger(__name__)

ZKAccess = None  # pyzkaccess class (uses zkaccess.dll)
PyZK = None  # pure Python ZK (zklib)


class DeviceSDKUnavailable(Exception):
    """Raised when no compatible SDK (pyzkaccess or pyzk) is available."""


class DeviceConnectionError(Exception):
    """Raised when the SDK cannot reach the device."""


# -----------------------------
# SDK loaders
# -----------------------------
def _ensure_pyzkaccess():
    """Load pyzkaccess and make sure zkaccess.dll is reachable."""
    global ZKAccess
    if ZKAccess is not None:
        return

    lib_path = os.getenv("ZK_LIB_PATH")
    if lib_path:
        lib_path = Path(lib_path).expanduser().resolve()
        if lib_path.exists():
            try:
                os.add_dll_directory(str(lib_path.parent))
            except (AttributeError, FileNotFoundError):
                os.environ["PATH"] = str(lib_path.parent) + os.pathsep + os.environ.get("PATH", "")
        else:
            logger.warning("ZK_LIB_PATH set but file not found: %s", lib_path)

    try:
        from pyzkaccess import ZKAccess as _ZKAccess  # type: ignore

        ZKAccess = _ZKAccess
    except Exception as exc:
        raise DeviceSDKUnavailable(
            "pyzkaccess غير مثبت أو لم يتم العثور على ملف zkaccess.dll. "
            "ثبّت zkaccess.dll واضبط ZK_LIB_PATH أو استخدم البديل pyzk."
        ) from exc


def _ensure_pyzk():
    """Load pure-Python pyzk (zklib) which does NOT require the DLL."""
    global PyZK
    if PyZK is not None:
        return
    try:
        from zk import ZK as _PyZK  # type: ignore

        PyZK = _PyZK
    except Exception as exc:
        raise DeviceSDKUnavailable("لم يتم العثور على مكتبة pyzk (zklib). ثبّت الحزمة pyzk.") from exc


def _connection_string(device) -> str:
    port = getattr(device, "port", None) or 4370
    comm_key = decrypt_comm_key(getattr(device, "comm_key", "") or "")
    return f"protocol=TCP,ipaddress={device.ip_address},port={port},timeout=4000,passwd={comm_key}"


# -----------------------------
# Connection helper
# -----------------------------
@contextmanager
def _connect(device) -> Tuple[str, object]:
    """
    Yields (driver, conn) using the first available SDK:
    - driver = "pyzkaccess" (native DLL)
    - driver = "pyzk" (pure Python fallback)
    """
    conn = None
    driver = ""
    try:
        try:
            _ensure_pyzkaccess()
            conn = ZKAccess(connstr=_connection_string(device))
            driver = "pyzkaccess"
            yield driver, conn
            return
        except (DeviceSDKUnavailable, FileNotFoundError, OSError):
            # DLL مفقود أو pyzkaccess غير متاح → جرّب pyzk الخالص
            _ensure_pyzk()
            password = decrypt_comm_key(getattr(device, "comm_key", "") or "") or 0
            try:
                password = int(str(password))
            except Exception:
                password = 0
            conn = PyZK(device.ip_address, port=getattr(device, "port", 4370) or 4370, timeout=5, password=password)
            conn = conn.connect()
            driver = "pyzk"
            yield driver, conn
    except DeviceSDKUnavailable:
        raise
    except Exception as exc:
        raise DeviceConnectionError(str(exc)) from exc
    finally:
        try:
            if conn:
                conn.disconnect()
        except Exception:
            pass


# -----------------------------
# Public operations
# -----------------------------
def sync_time(device) -> None:
    """Set device clock to backend system local datetime."""
    current_system_time = datetime.now().replace(microsecond=0)
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            zk.parameters.datetime = current_system_time
        else:
            zk.set_time(current_system_time)


def reboot(device) -> None:
    """Reboot the device."""
    with _connect(device) as (driver, zk):
        # pyzk exposes restart; same call
        zk.restart()


def push_employee(device, employee, card_number: Optional[str] = None) -> None:
    """
    Create/update a user on the device.
    - Uses employee_code as pin/user_id.
    - Uses employee code as device display name by default to avoid
      firmware encoding issues.
    - Truncates display name to 24 chars (device limit on many models).
    - Card number is optional.
    """
    with _connect(device) as (driver, zk):
        mode = str(getattr(settings, "DEVICE_USER_DISPLAY_NAME_MODE", "employee_code") or "employee_code").strip().lower()
        if mode == "employee_name":
            display_name = employee.name or employee.employee_code
        else:
            display_name = employee.employee_code
        name = str(display_name or employee.employee_code)[:24]
        if driver == "pyzkaccess":
            kwargs: Dict[str, object] = {"pin": employee.employee_code, "name": name}
            if card_number:
                kwargs["card"] = card_number
            zk.users.set(**kwargs)
        else:
            zk.set_user(
                uid=None,
                name=name,
                privilege=0,
                password="",
                group_id="",
                user_id=str(employee.employee_code),
                card=card_number if card_number else None,
            )


def set_employee_enabled(device, employee_code: str, enabled: bool) -> None:
    """
    Enable/disable a user profile on the device.
    Not all SDK/device combinations support this directly.
    """
    employee_code = str(employee_code or "").strip()
    if not employee_code:
        raise ValueError("employee_code is required.")
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            kwargs = {"pin": employee_code}
            # Common conventions across ZK SDK wrappers.
            kwargs["disabled"] = 0 if enabled else 1
            kwargs["enabled"] = bool(enabled)
            zk.users.set(**kwargs)
            return

        # pyzk fallback: try dedicated methods first, then set_user fallback.
        method_names = ("enable_user", "disable_user")
        method_name = method_names[0] if enabled else method_names[1]
        method = getattr(zk, method_name, None)
        if callable(method):
            # pyzk may accept uid (numeric internal id) or user_id.
            try:
                method(user_id=employee_code)
                return
            except TypeError:
                pass
            try:
                method(uid=employee_code)
                return
            except TypeError:
                pass
            method(employee_code)
            return

        # Last resort: update user with set_user (best effort).
        set_user = getattr(zk, "set_user", None)
        if callable(set_user):
            kwargs = {
                "uid": None,
                "name": employee_code[:24],
                "privilege": 0,
                "password": "",
                "group_id": "",
                "user_id": employee_code,
            }
            # Common optional flags used in wrappers.
            kwargs["enabled"] = bool(enabled)
            kwargs["disabled"] = 0 if enabled else 1
            set_user(**kwargs)
            return

    raise DeviceSDKUnavailable("Current SDK does not support enable/disable user operation on this device.")


def delete_employee(device, employee_code: str) -> None:
    """
    Remove a user profile from the device.
    """
    employee_code = str(employee_code or "").strip()
    if not employee_code:
        raise ValueError("employee_code is required.")
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            # pyzkaccess collection helper.
            zk.users.delete(pin=employee_code)
            return

        delete_method = (
            getattr(zk, "delete_user", None)
            or getattr(zk, "remove_user", None)
            or getattr(zk, "del_user", None)
        )
        if callable(delete_method):
            try:
                delete_method(user_id=employee_code)
                return
            except TypeError:
                pass
            try:
                delete_method(uid=employee_code)
                return
            except TypeError:
                pass
            delete_method(employee_code)
            return
    raise DeviceSDKUnavailable("Current SDK does not support deleting users on this device.")


def clear_attendance_logs(device) -> None:
    """
    Clear attendance records from device memory.
    """
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            clear_method = (
                getattr(zk.records, "clear", None)
                or getattr(zk.records, "delete_all", None)
            )
        else:
            clear_method = (
                getattr(zk, "clear_attendance", None)
                or getattr(zk, "clear_data", None)
                or getattr(zk, "clear_att_log", None)
            )
        if callable(clear_method):
            clear_method()
            return
    raise DeviceSDKUnavailable("Current SDK does not support clearing attendance logs for this device.")


def apply_policy(device, policy) -> Dict[str, object]:
    """
    Apply supported policy fields to device.
    For unsupported settings, keep a detailed report instead of hard-failing.
    """
    report: Dict[str, object] = {"applied": [], "skipped": []}
    with _connect(device) as (driver, zk):
        # Sync device time when policy requires automatic synchronization.
        if bool(getattr(policy, "auto_sync_time", False)):
            try:
                current_system_time = datetime.now().replace(microsecond=0)
                if driver == "pyzkaccess":
                    zk.parameters.datetime = current_system_time
                else:
                    zk.set_time(current_system_time)
                report["applied"].append("time_sync")
            except Exception as exc:
                report["skipped"].append(f"time_sync:{exc}")

        # Best-effort timezone configuration.
        timezone_name = str(getattr(policy, "timezone", "") or "").strip()
        if timezone_name:
            if driver == "pyzkaccess":
                param_obj = getattr(zk, "parameters", None)
                if param_obj is not None and hasattr(param_obj, "timezone"):
                    setattr(param_obj, "timezone", timezone_name)
                    report["applied"].append("timezone")
                else:
                    report["skipped"].append("timezone:not_supported")
            else:
                set_tz = getattr(zk, "set_timezone", None) or getattr(zk, "set_tz", None)
                if callable(set_tz):
                    set_tz(timezone_name)
                    report["applied"].append("timezone")
                else:
                    report["skipped"].append("timezone:not_supported")

        verification_mode = str(getattr(policy, "verification_mode", "") or "").strip()
        if verification_mode:
            # Verification mode mapping is firmware-specific; keep as best effort note.
            report["skipped"].append(f"verification_mode:{verification_mode}:firmware_specific")

        extra_config = getattr(policy, "config", None) or {}
        if isinstance(extra_config, dict):
            for key, value in extra_config.items():
                report["skipped"].append(f"config:{key}:manual_mapping_required")

    return report


def push_template(
    device,
    *,
    employee_code: str,
    template_type: str,
    template_data: str,
    template_index: int = 0,
) -> bool:
    """
    Push a biometric template to a device.
    Not all SDKs expose template APIs; returns False when unsupported.
    """
    employee_code = str(employee_code or "").strip()
    template_data = str(template_data or "")
    if not employee_code or not template_data:
        raise ValueError("employee_code and template_data are required.")
    with _connect(device) as (driver, zk):
        # pyzkaccess possible paths.
        if driver == "pyzkaccess":
            templates_obj = getattr(zk, "templates", None)
            if templates_obj is not None and hasattr(templates_obj, "set"):
                templates_obj.set(
                    pin=employee_code,
                    template=template_data,
                    finger_index=int(template_index),
                    template_type=str(template_type or "fingerprint"),
                )
                return True
            users_obj = getattr(zk, "users", None)
            if users_obj is not None and hasattr(users_obj, "set"):
                # Some firmwares accept template payload in user update.
                users_obj.set(
                    pin=employee_code,
                    template=template_data,
                    finger_index=int(template_index),
                )
                return True
            return False

        # pyzk fallback method candidates.
        set_template = getattr(zk, "set_user_template", None) or getattr(zk, "set_template", None)
        if callable(set_template):
            try:
                set_template(
                    user_id=employee_code,
                    template=template_data,
                    finger_index=int(template_index),
                )
            except TypeError:
                set_template(employee_code, template_data, int(template_index))
            return True

    return False


def pull_templates(
    device,
    *,
    employee_code: str,
    template_type: str = "fingerprint",
    template_index: Optional[int] = None,
) -> List[Dict]:
    """
    Pull biometric template(s) for an employee from a device.
    Returns normalized rows:
      { employee_code, template_type, template_index, template_data, raw }
    """
    employee_code = str(employee_code or "").strip()
    if not employee_code:
        raise ValueError("employee_code is required.")

    def _call_template_method(target, method_names, kwargs_variants, args_variants):
        for method_name in method_names:
            method = getattr(target, method_name, None)
            if not callable(method):
                continue
            for kwargs in kwargs_variants:
                if kwargs is None:
                    continue
                try:
                    return method(**kwargs)
                except TypeError:
                    continue
                except Exception as exc:
                    raise DeviceConnectionError(str(exc)) from exc
            for args in args_variants:
                try:
                    return method(*args)
                except TypeError:
                    continue
                except Exception as exc:
                    raise DeviceConnectionError(str(exc)) from exc
        return None

    def _normalize_result(result) -> List[Dict]:
        if result is None:
            return []
        if isinstance(result, (str, bytes)):
            rows = [result]
        elif isinstance(result, dict):
            rows = [result]
        else:
            try:
                rows = list(result)
            except Exception:
                rows = [result]

        normalized = []
        for item in rows:
            if isinstance(item, bytes):
                item = item.decode("utf-8", errors="replace")
            if isinstance(item, str):
                row = {"template_data": item}
            elif isinstance(item, dict):
                row = dict(item)
            else:
                row = {
                    "template_data": (
                        getattr(item, "template", None)
                        or getattr(item, "template_data", None)
                        or getattr(item, "data", None)
                        or ""
                    ),
                    "template_index": (
                        getattr(item, "finger_index", None)
                        or getattr(item, "template_index", None)
                        or getattr(item, "fid", None)
                        or template_index
                    ),
                    "template_type": (
                        getattr(item, "template_type", None)
                        or getattr(item, "type", None)
                        or template_type
                    ),
                    "employee_code": (
                        getattr(item, "pin", None)
                        or getattr(item, "user_id", None)
                        or getattr(item, "employee_code", None)
                        or employee_code
                    ),
                }

            raw_data = (
                row.get("template_data")
                or row.get("template")
                or row.get("data")
                or ""
            )
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode("utf-8", errors="replace")
            raw_data = str(raw_data or "")
            if not raw_data:
                continue

            raw_index = row.get("template_index", template_index if template_index is not None else 0)
            try:
                normalized_index = max(0, int(raw_index))
            except Exception:
                normalized_index = max(0, int(template_index or 0))

            normalized.append(
                {
                    "employee_code": str(row.get("employee_code") or row.get("pin") or employee_code).strip(),
                    "template_type": str(row.get("template_type") or template_type or "fingerprint").strip().lower(),
                    "template_index": normalized_index,
                    "template_data": raw_data,
                    "raw": row,
                }
            )

        return normalized

    with _connect(device) as (driver, zk):
        kwargs_variants = [
            {
                "pin": employee_code,
                "employee_code": employee_code,
                "user_id": employee_code,
                "template_type": str(template_type or "fingerprint"),
                "finger_index": int(template_index or 0),
            },
            {
                "pin": employee_code,
                "template_type": str(template_type or "fingerprint"),
            },
            {"pin": employee_code},
            {"employee_code": employee_code},
            {"user_id": employee_code},
        ]
        args_variants = [
            (employee_code,),
            (employee_code, int(template_index or 0)),
            (employee_code, str(template_type or "fingerprint"), int(template_index or 0)),
        ]

        if driver == "pyzkaccess":
            templates_obj = getattr(zk, "templates", None)
            if templates_obj is not None:
                result = _call_template_method(
                    templates_obj,
                    ("get", "read", "fetch", "list"),
                    kwargs_variants,
                    args_variants,
                )
                normalized = _normalize_result(result)
                if normalized:
                    return normalized

            users_obj = getattr(zk, "users", None)
            if users_obj is not None:
                result = _call_template_method(
                    users_obj,
                    ("get", "read", "fetch"),
                    kwargs_variants,
                    args_variants,
                )
                normalized = _normalize_result(result)
                if normalized:
                    return normalized

            return []

        result = _call_template_method(
            zk,
            (
                "get_user_template",
                "get_template",
                "get_user_templates",
                "get_templates",
            ),
            kwargs_variants,
            args_variants,
        )
        return _normalize_result(result)


def stage_firmware_rollout(device, target_version: str) -> Dict[str, str]:
    """
    Best-effort staging for firmware rollout.
    Actual firmware upload depends on vendor-specific tools and is often blocked in public SDKs.
    """
    target_version = str(target_version or "").strip()
    if not target_version:
        raise ValueError("target_version is required.")
    with _connect(device) as (driver, zk):
        update_method = (
            getattr(zk, "update_firmware", None)
            or getattr(zk, "set_firmware", None)
            or getattr(zk, "upgrade_firmware", None)
        )
        if callable(update_method):
            try:
                update_method(target_version)
            except TypeError:
                # Some SDKs require a file path, not a version; keep graceful note.
                return {"status": "skipped", "detail": "SDK expects firmware file path, not semantic version."}
            return {"status": "ok", "detail": f"Firmware rollout requested to {target_version} via {driver}."}
    return {"status": "skipped", "detail": "Firmware rollout is not exposed by the active SDK."}


def pull_logs(device, limit: Optional[int] = None) -> List[Dict]:
    """
    Retrieve attendance logs from the device.
    Returns normalized dicts: { employee_code, timestamp, action, raw }
    """
    raw_records: List[Dict] = []
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            for idx, rec in enumerate(zk.records):
                raw_records.append(rec)
                if limit and idx + 1 >= limit:
                    break
        else:
            try:
                records = zk.get_attendance() or []
            except Exception as exc:
                raise DeviceConnectionError(str(exc)) from exc
            for idx, rec in enumerate(records):
                rec_dict = {
                    "user_pin": getattr(rec, "user_id", None) or getattr(rec, "uid", None),
                    "record_time": getattr(rec, "timestamp", None),
                    "status": getattr(rec, "status", None),
                }
                raw_records.append(rec_dict)
                if limit and idx + 1 >= limit:
                    break
    return _normalize_records(raw_records)


def discover_device_identity(device) -> Dict[str, str]:
    """
    Read basic identity fields from a connected device.
    Returns best-effort values:
      - serial_number
      - model_name
      - device_name
    """
    serial_number = ""
    model_name = ""
    device_name = ""
    firmware_version = ""
    platform = ""

    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            params = getattr(zk, "parameters", None)
            serial_number = _first_non_empty(
                _read_identity_value(params, "serial_number", "serialnumber", "serial", "sn"),
                _read_identity_value(zk, "serial_number", "serialnumber", "serial", "sn"),
            )
            device_name = _first_non_empty(
                _read_identity_value(params, "device_name", "name"),
                _read_identity_value(zk, "device_name", "name"),
            )
            model_name = _first_non_empty(
                _read_identity_value(params, "platform", "firmware_version", "firmware"),
                _read_identity_value(zk, "platform", "firmware_version"),
                device_name,
            )
            firmware_version = _first_non_empty(
                _read_identity_value(params, "firmware_version", "firmware"),
                _read_identity_value(zk, "firmware_version", "firmware"),
            )
            platform = _first_non_empty(
                _read_identity_value(params, "platform"),
                _read_identity_value(zk, "platform"),
            )
        else:
            serial_number = _first_non_empty(
                _read_identity_value(zk, "get_serialnumber", "get_serial_number", "serial_number", "serialnumber"),
                _read_identity_value(zk, "serial", "sn"),
            )
            device_name = _first_non_empty(
                _read_identity_value(zk, "get_device_name", "device_name", "name"),
            )
            model_name = _first_non_empty(
                _read_identity_value(zk, "get_platform", "platform"),
                _read_identity_value(zk, "get_firmware_version", "firmware_version"),
                device_name,
            )
            firmware_version = _first_non_empty(
                _read_identity_value(zk, "get_firmware_version", "firmware_version"),
            )
            platform = _first_non_empty(
                _read_identity_value(zk, "get_platform", "platform"),
            )

    return {
        "serial_number": serial_number,
        "model_name": model_name,
        "device_name": device_name,
        "firmware_version": firmware_version,
        "platform": platform,
    }


# -----------------------------
# Normalization
# -----------------------------
def _normalize_records(records: Iterable[Dict]) -> List[Dict]:
    """
    Map pyzkaccess/pyzk record fields into the app's attendance schema.
    Many ZKTeco firmwares use:
      user_pin, record_time, status (0/1/2...), verified, workcode
    We'll map status 0/1 -> check_in, others -> check_out as a sensible default.
    """
    normalized: List[Dict] = []
    for rec in records:
        employee_code = str(
            rec.get("user_pin")
            or rec.get("pin")
            or rec.get("user_id")
            or rec.get("employee")
            or ""
        ).strip()
        ts = rec.get("record_time") or rec.get("punch_time") or rec.get("timestamp")
        punch_type = rec.get("status") if "status" in rec else rec.get("record_type") or rec.get("punch_type")
        try:
            punch_val = int(punch_type)
        except Exception:
            # Some pyzk returns strings like "IN"/"OUT"
            if isinstance(punch_type, str) and punch_type.lower() == "out":
                punch_val = 2
            else:
                punch_val = None
        if punch_val is None:
            action = "check_in"
        else:
            action = "check_in" if punch_val in (0, 1, 4) else "check_out"
        normalized.append(
            {
                "employee_code": employee_code,
                "timestamp": ts,
                "action": action,
                "raw": rec,
            }
        )
    return normalized


def _first_non_empty(*values: object) -> str:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text and text.lower() not in {"none", "null"}:
            return text
    return ""


def _read_identity_value(obj: object, *names: str):
    if obj is None:
        return None
    for name in names:
        try:
            value = getattr(obj, name)
        except Exception:
            continue
        try:
            value = value() if callable(value) else value
        except TypeError:
            continue
        except Exception:
            continue
        if isinstance(value, dict):
            continue
        if value is not None and str(value).strip():
            return value
    return None

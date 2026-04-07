"""
Device service for ZKTeco biometric devices - migrated to apps.devices.utils.
"""
from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from django.conf import settings

from .security import decrypt_comm_key

logger = logging.getLogger(__name__)

ZKAccess = None
PyZK = None


class DeviceSDKUnavailable(Exception):
    """Raised when no compatible SDK is available."""


class DeviceConnectionError(Exception):
    """Raised when the SDK cannot reach the device."""


def _ensure_pyzkaccess():
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
    try:
        from pyzkaccess import ZKAccess as _ZKAccess  # type: ignore
        ZKAccess = _ZKAccess
    except Exception as exc:
        raise DeviceSDKUnavailable("pyzkaccess not installed or zkaccess.dll not found.") from exc


def _ensure_pyzk():
    global PyZK
    if PyZK is not None:
        return
    try:
        from zk import ZK as _PyZK  # type: ignore
        PyZK = _PyZK
    except Exception as exc:
        raise DeviceSDKUnavailable("pyzk (zklib) not found. Install the pyzk package.") from exc


def _connection_string(device) -> str:
    port = getattr(device, "port", None) or 4370
    comm_key = decrypt_comm_key(getattr(device, "comm_key", "") or "")
    return f"protocol=TCP,ipaddress={device.ip_address},port={port},timeout=4000,passwd={comm_key}"


@contextmanager
def _connect(device) -> Tuple[str, object]:
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


def sync_time(device) -> None:
    current_system_time = datetime.now().replace(microsecond=0)
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            zk.parameters.datetime = current_system_time
        else:
            zk.set_time(current_system_time)


def reboot(device) -> None:
    with _connect(device) as (driver, zk):
        zk.restart()


def push_employee(device, employee, card_number: Optional[str] = None) -> None:
    with _connect(device) as (driver, zk):
        mode = str(getattr(settings, "DEVICE_USER_DISPLAY_NAME_MODE", "employee_code") or "employee_code").strip().lower()
        display_name = employee.name if mode == "employee_name" else employee.employee_code
        name = str(display_name or employee.employee_code)[:24]
        if driver == "pyzkaccess":
            kwargs: Dict[str, object] = {"pin": employee.employee_code, "name": name}
            if card_number:
                kwargs["card"] = card_number
            zk.users.set(**kwargs)
        else:
            zk.set_user(uid=None, name=name, privilege=0, password="", group_id="",
                        user_id=str(employee.employee_code), card=card_number if card_number else None)


def set_employee_enabled(device, employee_code: str, enabled: bool) -> None:
    employee_code = str(employee_code or "").strip()
    if not employee_code:
        raise ValueError("employee_code is required.")
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            zk.users.set(pin=employee_code, disabled=0 if enabled else 1, enabled=bool(enabled))
            return
        method_name = "enable_user" if enabled else "disable_user"
        method = getattr(zk, method_name, None)
        if callable(method):
            try:
                method(user_id=employee_code)
                return
            except TypeError:
                pass
        set_user = getattr(zk, "set_user", None)
        if callable(set_user):
            set_user(uid=None, name=employee_code[:24], privilege=0, password="",
                     group_id="", user_id=employee_code, enabled=bool(enabled))
            return
    raise DeviceSDKUnavailable("SDK does not support enable/disable user operation.")


def delete_employee(device, employee_code: str) -> None:
    employee_code = str(employee_code or "").strip()
    if not employee_code:
        raise ValueError("employee_code is required.")
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            zk.users.delete(pin=employee_code)
            return
        delete_method = (getattr(zk, "delete_user", None) or getattr(zk, "remove_user", None)
                         or getattr(zk, "del_user", None))
        if callable(delete_method):
            try:
                delete_method(user_id=employee_code)
                return
            except TypeError:
                delete_method(employee_code)
                return
    raise DeviceSDKUnavailable("SDK does not support deleting users.")


def clear_attendance_logs(device) -> None:
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            clear_method = getattr(zk.records, "clear", None) or getattr(zk.records, "delete_all", None)
        else:
            clear_method = (getattr(zk, "clear_attendance", None) or getattr(zk, "clear_data", None)
                            or getattr(zk, "clear_att_log", None))
        if callable(clear_method):
            clear_method()
            return
    raise DeviceSDKUnavailable("SDK does not support clearing attendance logs.")


def apply_policy(device, policy) -> Dict[str, object]:
    report: Dict[str, object] = {"applied": [], "skipped": []}
    with _connect(device) as (driver, zk):
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
    return report


def pull_logs(device, limit: Optional[int] = None) -> List[Dict]:
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
                raw_records.append({
                    "user_pin": getattr(rec, "user_id", None) or getattr(rec, "uid", None),
                    "record_time": getattr(rec, "timestamp", None),
                    "status": getattr(rec, "status", None),
                })
                if limit and idx + 1 >= limit:
                    break
    return _normalize_records(raw_records)


def discover_device_identity(device) -> Dict[str, str]:
    serial_number = ""
    model_name = ""
    device_name = ""
    with _connect(device) as (driver, zk):
        if driver == "pyzkaccess":
            params = getattr(zk, "parameters", None)
            serial_number = _first_non_empty(_read_identity_value(params, "serial_number", "sn"))
            device_name = _first_non_empty(_read_identity_value(params, "device_name", "name"))
            model_name = _first_non_empty(_read_identity_value(params, "platform", "firmware_version"), device_name)
        else:
            serial_number = _first_non_empty(_read_identity_value(zk, "get_serialnumber", "serial_number"))
            device_name = _first_non_empty(_read_identity_value(zk, "get_device_name", "device_name"))
            model_name = _first_non_empty(_read_identity_value(zk, "get_platform", "platform"), device_name)
    return {"serial_number": serial_number, "model_name": model_name, "device_name": device_name}


def _normalize_records(records: Iterable[Dict]) -> List[Dict]:
    normalized: List[Dict] = []
    for rec in records:
        employee_code = str(rec.get("user_pin") or rec.get("pin") or rec.get("user_id") or "").strip()
        ts = rec.get("record_time") or rec.get("punch_time") or rec.get("timestamp")
        punch_type = rec.get("status") if "status" in rec else rec.get("record_type")
        try:
            punch_val = int(punch_type)
        except Exception:
            punch_val = 2 if isinstance(punch_type, str) and punch_type.lower() == "out" else None
        action = "check_in" if (punch_val is None or punch_val in (0, 1, 4)) else "check_out"
        normalized.append({"employee_code": employee_code, "timestamp": ts, "action": action, "raw": rec})
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
            value = value() if callable(value) else value
            if value is not None and str(value).strip():
                return value
        except Exception:
            continue
    return None

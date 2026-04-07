import secrets

from django.conf import settings
from django.utils import timezone

from apps.attendance.models import Attendance, BiometricLog
from apps.devices.models import Device, DeviceSyncLog
from apps.devices.utils.adms_queue import pop_adms_command
from apps.devices.utils.security import encrypt_comm_key
from apps.employees.models import Employee
from shared.logging import get_service_logger
from shared.system import get_settings

logger = get_service_logger("device")


class DeviceService:
    @staticmethod
    def get_attendance_threshold():
        settings_obj = get_settings()
        attendance_settings = settings_obj.attendance_settings if settings_obj else {}
        work_start = attendance_settings.get("workStartTime")
        late_threshold = attendance_settings.get("lateThreshold")
        if not work_start:
            return None
        try:
            from datetime import datetime

            start = datetime.strptime(work_start, "%H:%M").time()
            threshold = datetime.strptime(late_threshold, "%H:%M").time() if late_threshold else start
            return threshold
        except Exception:
            return None

    @staticmethod
    def apply_biometric_log(device, log_item):
        employee_code = (
            log_item.get("employee_code")
            or log_item.get("pin")
            or log_item.get("employeeId")
        )
        if not employee_code:
            return False

        employee = Employee.objects.filter(employee_code=employee_code).first()
        if not employee:
            return False

        timestamp = log_item.get("timestamp") or log_item.get("time")
        if not timestamp:
            return False

        try:
            from datetime import datetime

            ts = datetime.fromisoformat(str(timestamp)) if isinstance(timestamp, str) else timestamp
        except Exception:
            return False

        action = log_item.get("action", "check_in")

        BiometricLog.objects.create(
            device=device,
            employee_code=employee_code,
            timestamp=ts,
            action=action,
            raw_data=log_item,
        )

        attendance, _ = Attendance.objects.get_or_create(
            employee=employee,
            date=ts.date(),
            defaults={"status": "present"},
        )

        if action == "check_in":
            attendance.check_in = ts.time()
            threshold = DeviceService.get_attendance_threshold()
            attendance.status = (
                "late"
                if threshold and attendance.check_in > threshold
                else "present"
            )
        elif action == "check_out":
            attendance.check_out = ts.time()

        attendance.save()
        logger.info(
            "Processed biometric log",
            device=device.name,
            employee=employee.employee_code,
            action=action,
        )
        return True

    @staticmethod
    def sync_device(device):
        log = DeviceSyncLog.objects.create(device=device, status="running")
        device.status = "online"
        device.last_sync = timezone.now()
        device.last_seen = timezone.now()
        device.employee_count = Employee.objects.count()
        device.save(update_fields=["status", "last_sync", "last_seen", "employee_count"])

        log.status = "success"
        log.message = "Sync completed"
        log.finished_at = timezone.now()
        log.save(update_fields=["status", "message", "finished_at"])
        return log

    @staticmethod
    def authorize_adms(request):
        shared_secret = str(getattr(settings, "ADMS_SHARED_SECRET", "") or "").strip()
        if not shared_secret:
            return True

        token = request.query_params.get("token") or request.headers.get("X-ADMS-Token")
        if not token or not secrets.compare_digest(token, shared_secret):
            return False
        return True

    @staticmethod
    def resolve_adms_device(request, serial):
        norm = str(serial or "").strip().upper()
        if not norm:
            return None, False

        device = Device.objects.filter(serial_number__iexact=norm).first()
        if device:
            return device, False

        if not getattr(settings, "ADMS_AUTO_REGISTER", True):
            return None, False

        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = (
            x_forwarded.split(",")[0].strip()
            if x_forwarded
            else request.META.get("REMOTE_ADDR", "0.0.0.0")
        )

        device = Device.objects.create(
            name=f"Device {norm}",
            serial_number=norm,
            ip_address=ip,
            port=4370,
            comm_key=encrypt_comm_key(""),
            location="ADMS auto-discovered",
            connection_mode="adms",
            status="online",
            last_seen=timezone.now(),
        )
        return device, True

    @staticmethod
    def pop_device_command(serial):
        return pop_adms_command(serial)

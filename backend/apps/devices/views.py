from __future__ import annotations

import logging
import socket
from datetime import date, datetime, time, timedelta
from types import SimpleNamespace

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter, OpenApiResponse

from apps.attendance.models import BiometricLog
from apps.attendance.services.biometric_processing import refresh_attendance_window
from apps.authentication.permissions import RolePermission
from apps.devices.services import zk_service
from apps.devices.services.device_service import DeviceService
from apps.employees.models import Employee

from .models import Device, DeviceSyncLog, DeviceUserMapping
from .serializers import (
    DeviceSerializer,
    DeviceSyncLogSerializer,
    DeviceUserMappingSerializer,
    DeviceCommandResponseSerializer,
    HeartbeatRequestSerializer,
    HeartbeatResponseSerializer,
    DiscoverRequestSerializer,
    DiscoverResponseSerializer,
    TestConnectionResponseSerializer,
    HealthReportResponseSerializer,
)
from .tasks import run_device_sync_task, run_device_sync_time_task  # noqa: F401
from .utils.adms_queue import pop_adms_command
from .utils.security import decrypt_comm_key, encrypt_comm_key
from .views_control import _enqueue_command_for_device

logger = logging.getLogger(__name__)


def _is_truthy(value) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _json_safe(value):
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    return value


def _parse_timestamp(value):
    if not value:
        return None
    if isinstance(value, datetime):
        ts = value
    else:
        text = str(value).strip().replace("Z", "+00:00")
        text = text.replace(" ", "T", 1) if " " in text and "T" not in text else text
        try:
            ts = datetime.fromisoformat(text)
        except ValueError:
            return None
    if timezone.is_naive(ts):
        ts = timezone.make_aware(ts, timezone.get_current_timezone())
    return ts


def _infer_action(raw_item):
    explicit = str(raw_item.get("action") or "").strip().lower()
    if explicit in {"check_in", "check_out"}:
        return explicit

    raw_status = raw_item.get("status")
    if raw_status is None:
        raw_status = raw_item.get("Status")
    try:
        status_value = int(raw_status)
    except Exception:
        if str(raw_status or "").strip().lower() == "out":
            status_value = 2
        else:
            status_value = 0
    return "check_in" if status_value in {0, 1, 4} else "check_out"


def _resolve_employee_for_log(device: Device, raw_employee_code: str):
    employee_code = str(raw_employee_code or "").strip()
    if not employee_code:
        return None, "", None

    employee = Employee.objects.filter(employee_code=employee_code).first()
    if employee:
        return employee, employee.employee_code, None

    mapping = DeviceUserMapping.objects.select_related("employee").filter(
        device=device,
        device_user_id=employee_code,
    ).first()
    if mapping:
        return mapping.employee, mapping.employee.employee_code, mapping
    return None, employee_code, None


def _attendance_threshold():
    return DeviceService.get_attendance_threshold()


def _process_biometric_logs(device: Device, logs: list[dict]) -> int:
    created = 0
    threshold = _attendance_threshold()
    for item in logs:
        raw_employee_code = (
            item.get("employee_code")
            or item.get("pin")
            or item.get("employeeId")
            or item.get("employee_id")
        )
        timestamp = _parse_timestamp(item.get("timestamp") or item.get("time"))
        if not raw_employee_code or not timestamp:
            continue

        employee, resolved_code, mapping = _resolve_employee_for_log(device, str(raw_employee_code))
        if not employee:
            continue

        action = _infer_action(item)
        raw_data = _json_safe(dict(item))
        if mapping:
            raw_data["device_user_id"] = str(raw_employee_code)
            raw_data["resolved_employee_code"] = resolved_code

        _, was_created = BiometricLog.objects.get_or_create(
            device=device,
            employee_code=resolved_code,
            timestamp=timestamp,
            action=action,
            defaults={"raw_data": raw_data},
        )
        if was_created:
            created += 1
            refresh_attendance_window(
                employee=employee,
                attendance_date=timestamp.date(),
                threshold=threshold,
            )
    return created


def _mark_device_seen(device: Device, *, status_value: str = "online"):
    now = timezone.now()
    device.status = status_value
    device.last_seen = now
    device.last_heartbeat = now
    device.save(update_fields=["status", "last_seen", "last_heartbeat"])


def _is_sensitive_device_operator(user) -> bool:
    role = str(getattr(user, "role", "") or "").strip().lower()
    if role in {"system_admin", "admin"}:
        return True
    try:
        from apps.authentication.permissions import get_effective_permission_codes

        codes = set(get_effective_permission_codes(user))
    except Exception:
        codes = set()
    return bool({"devices.manage_sensitive", "devices.sync_time", "devices.*", "*", "all"} & codes)


def _device_command_auth_error(exc: Exception) -> bool:
    message = str(exc or "").lower()
    return any(token in message for token in {"unauth", "auth", "comm key", "password"})


def _connection_candidate(data) -> SimpleNamespace:
    comm_key = data.get("commKey", data.get("comm_key", ""))
    return SimpleNamespace(
        ip_address=data.get("ipAddress", data.get("ip_address", "")),
        port=int(data.get("port") or 4370),
        comm_key=comm_key,
    )


def _run_auto_sync(device: Device, *, reason: str):
    try:
        zk_service.sync_time(device)
    except Exception as exc:
        device.status = "offline"
        device.save(update_fields=["status"])
        message = f"Unable to reach device: {exc}"
        DeviceSyncLog.objects.create(
            device=device,
            command="sync_time",
            status="failed",
            message=message,
            finished_at=timezone.now(),
            reason=reason,
        )
        return False

    now = timezone.now()
    device.status = "online"
    device.last_sync = now
    device.last_seen = now
    device.save(update_fields=["status", "last_sync", "last_seen"])
    DeviceSyncLog.objects.create(
        device=device,
        command="sync_time",
        status="success",
        message=reason,
        finished_at=now,
        reason=reason,
    )
    return True


def _serialize_device_health_summary():
    total_devices = Device.objects.count()
    total_logs = DeviceSyncLog.objects.count()
    failed_logs = DeviceSyncLog.objects.filter(status="failed").count()
    return {
        "totalDevices": total_devices,
        "onlineDevices": Device.objects.filter(status="online").count(),
        "offlineDevices": Device.objects.filter(status="offline").count(),
        "totalCommands": total_logs,
        "failedCommands": failed_logs,
        "averageFailureRatePercent": round((failed_logs / total_logs) * 100, 2) if total_logs else 0.0,
    }


def _connection_signature(device_or_mapping):
    if isinstance(device_or_mapping, dict):
        serial = str(device_or_mapping.get("serial_number") or "").strip().upper()
        ip_address = str(device_or_mapping.get("ip_address") or "").strip()
        port = int(device_or_mapping.get("port") or 4370)
        comm_key = decrypt_comm_key(device_or_mapping.get("comm_key"))
        mode = str(device_or_mapping.get("connection_mode") or "sdk").strip().lower()
    else:
        serial = str(getattr(device_or_mapping, "serial_number", "") or "").strip().upper()
        ip_address = str(getattr(device_or_mapping, "ip_address", "") or "").strip()
        port = int(getattr(device_or_mapping, "port", 4370) or 4370)
        comm_key = decrypt_comm_key(getattr(device_or_mapping, "comm_key", ""))
        mode = str(getattr(device_or_mapping, "connection_mode", "sdk") or "sdk").strip().lower()
    return (serial, ip_address, port, comm_key, mode)


def _parse_adms_attlog_payload(text: str) -> list[dict]:
    rows = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if "=" in line:
            parsed = {}
            for chunk in line.split("\t"):
                if "=" not in chunk:
                    continue
                key, value = chunk.split("=", 1)
                parsed[key.strip()] = value.strip()
            timestamp = parsed.get("DateTime") or parsed.get("datetime")
            rows.append(
                {
                    "employee_code": parsed.get("PIN") or parsed.get("pin"),
                    "timestamp": timestamp,
                    "status": parsed.get("Status") or parsed.get("status"),
                    "raw": parsed,
                }
            )
            continue

        parts = [part.strip() for part in line.split("\t") if part.strip()]
        if len(parts) >= 3:
            parsed = {
                "PIN": parts[0],
                "DateTime": parts[1],
                "Status": parts[2],
            }
            rows.append(
                {
                    "employee_code": parts[0],
                    "timestamp": parts[1],
                    "status": parts[2],
                    "raw": parsed,
                }
            )
    return rows


class DeviceViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = Device.objects.all().order_by("name")
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["status", "connection_mode", "group"]
    search_fields = ["name", "serial_number", "ip_address"]
    ordering_fields = ["name", "last_sync"]

    @extend_schema(
        parameters=[OpenApiParameter(name="live", type=bool, description="Check actual device connectivity live", default=False)],
    )
    def list(self, request, *args, **kwargs):
        if _is_truthy(request.query_params.get("live")):
            timeout_seconds = int(getattr(settings, "DEVICE_HEARTBEAT_TIMEOUT_SECONDS", 180) or 180)
            stale_cutoff = timezone.now() - timedelta(seconds=timeout_seconds)
            for device in self.get_queryset():
                if device.last_heartbeat and device.last_heartbeat < stale_cutoff:
                    if device.status != "offline":
                        device.status = "offline"
                        device.save(update_fields=["status"])
                    continue
                try:
                    conn = socket.create_connection((device.ip_address, int(device.port or 4370)), timeout=1)
                    try:
                        conn.close()
                    except Exception:
                        pass
                    device.status = "online"
                    device.last_seen = timezone.now()
                    device.save(update_fields=["status", "last_seen"])
                except Exception:
                    if device.status != "offline":
                        device.status = "offline"
                        device.save(update_fields=["status"])
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        device = serializer.save()
        if str(device.connection_mode or "sdk").lower() == "sdk":
            _run_auto_sync(device, reason="Auto sync completed after device creation.")

    def perform_update(self, serializer):
        previous_signature = _connection_signature(serializer.instance)
        device = serializer.save()
        connection_changed = previous_signature != _connection_signature(device)
        if connection_changed and str(device.connection_mode or "sdk").lower() == "sdk":
            _run_auto_sync(device, reason="Auto sync completed after settings update.")

    @action(detail=True, methods=["post"])
    @extend_schema(
        responses={
            200: DeviceCommandResponseSerializer,
            202: OpenApiResponse(description="Command queued", response=DeviceCommandResponseSerializer),
            400: OpenApiResponse(description="Invalid request"),
            401: OpenApiResponse(description="Device auth failed")
        }
    )
    def sync(self, request, pk=None):
        device = self.get_object()
        result = _enqueue_command_for_device(
            user=request.user,
            device=device,
            command="sync",
            payload={"limit": None},
            reason="Manual sync requested",
        )
        return Response(result["data"], status=result["status_code"])

    @action(detail=True, methods=["post"], url_path="sync-time")
    @extend_schema(
        responses={
            200: DeviceCommandResponseSerializer,
            202: OpenApiResponse(description="Command queued", response=DeviceCommandResponseSerializer),
            403: OpenApiResponse(description="Not authorized")
        }
    )
    def sync_time(self, request, pk=None):
        if not _is_sensitive_device_operator(request.user):
            return Response({"detail": "Not authorized to synchronize device time."}, status=status.HTTP_403_FORBIDDEN)
        device = self.get_object()
        result = _enqueue_command_for_device(
            user=request.user,
            device=device,
            command="sync_time",
            payload={},
            reason="Manual time sync requested",
        )
        return Response(result["data"], status=result["status_code"])

    @action(detail=True, methods=["post"])
    @extend_schema(
        responses={
            200: DeviceCommandResponseSerializer,
            202: OpenApiResponse(description="Command queued", response=DeviceCommandResponseSerializer),
            400: OpenApiResponse(description="Invalid request")
        }
    )
    def reboot(self, request, pk=None):
        device = self.get_object()
        result = _enqueue_command_for_device(
            user=request.user,
            device=device,
            command="reboot",
            payload={},
            reason="Manual reboot requested",
        )
        return Response(result["data"], status=result["status_code"])

    @action(detail=True, methods=["post"])
    @extend_schema(
        request=inline_serializer("DeviceIngestRequest", fields={"logs": serializers.ListField(child=serializers.DictField())}),
        responses={200: inline_serializer("DeviceIngestResponse", fields={"status": serializers.CharField(), "created": serializers.IntegerField()})},
    )
    def ingest(self, request, pk=None):
        device = self.get_object()
        logs = request.data.get("logs") or []
        if not isinstance(logs, list):
            return Response({"detail": "logs must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        created = _process_biometric_logs(device, logs)
        _mark_device_seen(device)
        return Response({"status": "ok", "created": created})

    @action(detail=False, methods=["post"], url_path="bulk-command")
    @extend_schema(
        request=inline_serializer("BulkCommandRequest", fields={"deviceIds": serializers.ListField(child=serializers.CharField()), "command": serializers.CharField()}),
        responses={200: inline_serializer("BulkCommandResponse", fields={"status": serializers.CharField(), "command": serializers.CharField(), "queued": serializers.IntegerField(), "results": serializers.ListField(child=serializers.DictField())})},
    )
    def bulk_command(self, request):
        device_ids = request.data.get("deviceIds") or []
        command = str(request.data.get("command") or "").strip().lower()
        if not isinstance(device_ids, list) or not device_ids:
            return Response({"detail": "deviceIds must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        if not command:
            return Response({"detail": "command is required."}, status=status.HTTP_400_BAD_REQUEST)

        devices = {str(item.id): item for item in Device.objects.filter(id__in=device_ids)}
        queued = 0
        results = []
        for raw_device_id in device_ids:
            device = devices.get(str(raw_device_id))
            if not device:
                results.append({"deviceId": str(raw_device_id), "queued": False, "detail": "Device not found."})
                continue
            result = _enqueue_command_for_device(
                user=request.user,
                device=device,
                command=command,
                payload={"limit": None} if command == "sync" else {},
                reason="Bulk command requested",
            )
            queued += 1 if result["ok"] else 0
            results.append({"deviceId": str(device.id), "queued": bool(result["ok"]), **result["data"]})
        return Response({"status": "ok", "command": command, "queued": queued, "results": results})

    @action(detail=False, methods=["post"])
    @extend_schema(request=HeartbeatRequestSerializer, responses={200: HeartbeatResponseSerializer})
    def heartbeat(self, request):
        serial = str(request.data.get("serialNumber") or request.data.get("serial_number") or "").strip().upper()
        if not serial:
            return Response({"detail": "serialNumber is required."}, status=status.HTTP_400_BAD_REQUEST)

        defaults = {
            "name": request.data.get("name") or f"Device {serial}",
            "ip_address": request.data.get("ipAddress") or request.data.get("ip_address") or "0.0.0.0",
            "port": int(request.data.get("port") or 4370),
            "comm_key": encrypt_comm_key(request.data.get("commKey") or request.data.get("comm_key") or ""),
            "model": request.data.get("modelName") or request.data.get("model_name") or "",
            "location": request.data.get("location") or "",
        }
        device, created = Device.objects.get_or_create(serial_number=serial, defaults=defaults)
        if not created:
            for field, value in defaults.items():
                if value not in [None, ""]:
                    setattr(device, field, value)
        device.status = str(request.data.get("status") or "online").strip().lower() or "online"
        now = timezone.now()
        device.last_seen = now
        device.last_heartbeat = now
        device.save()
        return Response({"status": "ok", "created": created, "deviceId": str(device.id)})

    @action(detail=False, methods=["post"], url_path="discover")
    @extend_schema(request=DiscoverRequestSerializer, responses={200: DiscoverResponseSerializer})
    def discover(self, request):
        candidate = _connection_candidate(request.data)
        if not candidate.ip_address:
            return Response({"detail": "ipAddress is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            data = zk_service.discover_device_identity(candidate)
        except Exception as exc:
            if _device_command_auth_error(exc):
                return Response(
                    {"detail": "Comm Key rejected by device.", "code": "DEVICE_AUTH_FAILED"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(
            {
                "status": "ok",
                "serialNumber": str(data.get("serial_number") or "").strip().upper(),
                "modelName": data.get("model_name") or "",
                "deviceName": data.get("device_name") or "",
            }
        )

    @action(detail=False, methods=["post"], url_path="test-connection")
    @extend_schema(request=DiscoverRequestSerializer, responses={200: TestConnectionResponseSerializer})
    def test_connection(self, request):
        candidate = _connection_candidate(request.data)
        if not candidate.ip_address:
            return Response({"detail": "ipAddress is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            data = zk_service.discover_device_identity(candidate)
        except Exception as exc:
            if _device_command_auth_error(exc):
                return Response(
                    {
                        "reachable": False,
                        "detail": "Comm Key rejected by device.",
                        "code": "DEVICE_AUTH_FAILED",
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            return Response({"reachable": False, "detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(
            {
                "reachable": True,
                "serialNumber": str(data.get("serial_number") or "").strip().upper(),
                "modelName": data.get("model_name") or "",
                "deviceName": data.get("device_name") or "",
            }
        )

    @action(detail=False, methods=["get"], url_path="health-report")
    @extend_schema(responses={200: HealthReportResponseSerializer})
    def health_report(self, request):
        return Response({"summary": _serialize_device_health_summary()})


class DeviceUserMappingViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = DeviceUserMapping.objects.all()
    serializer_class = DeviceUserMappingSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filterset_fields = ["device", "employee__employee_code"]


class DeviceSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    resource_name = "devices"
    queryset = DeviceSyncLog.objects.all().order_by("-id")
    serializer_class = DeviceSyncLogSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]


class ADMSCDataView(APIView):
    permission_classes = [permissions.AllowAny]

    def _resolve_device(self, request):
        if not DeviceService.authorize_adms(request):
            return None, Response("Forbidden", status=status.HTTP_403_FORBIDDEN)

        serial = request.query_params.get("SN") or request.GET.get("SN")
        device, _created = DeviceService.resolve_adms_device(request, serial)
        if not device:
            return None, Response("Not Found", status=status.HTTP_404_NOT_FOUND)

        _mark_device_seen(device)
        return device, None

    @extend_schema(
        parameters=[OpenApiParameter(name="SN", type=str, description="Device serial number"), OpenApiParameter(name="table", type=str, required=False)],
        responses={200: OpenApiResponse(description="OK or protocol message")},
        summary="ADMS Data Collection Point",
        description="Receives biometric logs and status updates from ADMS-compatible devices."
    )
    def post(self, request):
        device, failure = self._resolve_device(request)
        if failure is not None:
            return failure

        table = str(request.query_params.get("table") or "").strip().upper()
        if table == "ATTLOG":
            body = request.body.decode("utf-8", errors="ignore")
            rows = _parse_adms_attlog_payload(body)
            _process_biometric_logs(device, rows)
        return HttpResponse("OK")

    @extend_schema(
        parameters=[OpenApiParameter(name="SN", type=str, description="Device serial number")],
        responses={200: OpenApiResponse(description="OK")},
        summary="ADMS Device Polling",
        description="Used by devices to poll for connection status or keep-alive."
    )
    def get(self, request):
        _device, failure = self._resolve_device(request)
        if failure is not None:
            return failure
        return HttpResponse("OK")


class ADMSGetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        parameters=[OpenApiParameter(name="SN", type=str, description="Device serial number")],
        responses={200: OpenApiResponse(description="ADMS protocol command or empty response")},
        summary="ADMS Get Command Request",
        description="Devices call this endpoint to fetch the next pending command from the server."
    )
    def get(self, request):
        if not DeviceService.authorize_adms(request):
            return HttpResponse("Forbidden", status=status.HTTP_403_FORBIDDEN)

        serial = request.query_params.get("SN") or request.GET.get("SN")
        device, _created = DeviceService.resolve_adms_device(request, serial)
        if not device:
            return HttpResponse("Not Found", status=status.HTTP_404_NOT_FOUND)

        _mark_device_seen(device)
        item = pop_adms_command(device_id=device.id)
        if not item:
            return HttpResponse("OK")

        log_id = item.get("logId")
        if log_id:
            log = DeviceSyncLog.objects.filter(id=log_id, device=device).first()
            if log:
                log.status = "success"
                log.message = "Delivered to ADMS device."
                log.finished_at = timezone.now()
                log.save(update_fields=["status", "message", "finished_at"])
        return HttpResponse(item.get("commandText") or "OK")

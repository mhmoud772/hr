from __future__ import annotations

import hashlib
import logging
from datetime import timedelta

from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .utils.adms_queue import enqueue_adms_command, queue_size
from .models import (
    BiometricTemplate,
    BiometricTemplateDistribution,
    Device,
    DeviceBackupSnapshot,
    DeviceCommandApproval,
    DeviceFirmwareRollout,
    DeviceGroup,
    DevicePolicy,
    DeviceSyncLog,
)
from apps.employees.models import Employee
from apps.authentication.models import AuditLog
from apps.authentication.permissions import (
    RolePermission,
    has_any_permission_code,
)
from apps.devices.services import zk_service  # noqa: F401
from .serializers import (
    DeviceSyncLogSerializer,
    BiometricTemplateDistributionSerializer,
    BiometricTemplateSerializer,
    DeviceBackupSnapshotSerializer,
    DeviceCommandApprovalSerializer,
    DeviceFirmwareRolloutSerializer,
    DevicePolicySerializer,
    DeviceCommandResponseSerializer,
)
from .serializers import DeviceGroupSerializer
from drf_spectacular.utils import extend_schema, inline_serializer

try:
    from .tasks import (
        run_device_apply_policy_task,
        run_device_clear_logs_task,
        run_device_delete_employee_task,
        run_device_disable_employee_task,
        run_device_distribute_template_task,
        run_device_enable_employee_task,
        run_device_firmware_rollout_task,
        run_device_pull_logs_task,
        run_device_pull_template_task,
        run_device_push_employee_task,
        run_device_reboot_task,
        run_device_sync_task,
        run_device_sync_time_task,
    )
except Exception:  # pragma: no cover
    run_device_sync_task = None
    run_device_sync_time_task = None
    run_device_reboot_task = None
    run_device_pull_logs_task = None
    run_device_pull_template_task = None
    run_device_push_employee_task = None
    run_device_disable_employee_task = None
    run_device_enable_employee_task = None
    run_device_delete_employee_task = None
    run_device_clear_logs_task = None
    run_device_apply_policy_task = None
    run_device_distribute_template_task = None
    run_device_firmware_rollout_task = None


logger = logging.getLogger(__name__)

SENSITIVE_COMMANDS = {
    "sync_time",
    "reboot",
    "clear_logs",
    "delete_employee",
    "disable_employee",
    "enable_employee",
    "firmware_rollout",
}


def _normalize_command(command: str) -> str:
    normalized = str(command or "").strip().lower()
    aliases = {
        "sync-time": "sync_time",
        "pull-logs": "pull_logs",
        "pull-template": "pull_template",
        "push-employee": "push_employee",
        "disable-employee": "disable_employee",
        "enable-employee": "enable_employee",
        "delete-employee": "delete_employee",
        "clear-logs": "clear_logs",
        "apply-policy": "apply_policy",
        "distribute-template": "distribute_template",
        "firmware-rollout": "firmware_rollout",
    }
    return aliases.get(normalized, normalized)


def _as_bool(value, default: bool = True) -> bool:
    if value in [None, ""]:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"false", "0", "no", "off"}:
            return False
        if normalized in {"true", "1", "yes", "on"}:
            return True
    return bool(value)


def _can_approve_commands(user) -> bool:
    role = str(getattr(user, "role", "") or "").strip().lower()
    if role in {"system_admin", "admin"}:
        return True
    return has_any_permission_code(
        user,
        {"devices.approve_commands", "devices.manage_sensitive", "settings"},
    )


def _resolve_task(command: str):
    command_map = {
        "sync": run_device_sync_task,
        "sync_time": run_device_sync_time_task,
        "reboot": run_device_reboot_task,
        "pull_logs": run_device_pull_logs_task,
        "pull_template": run_device_pull_template_task,
        "push_employee": run_device_push_employee_task,
        "disable_employee": run_device_disable_employee_task,
        "enable_employee": run_device_enable_employee_task,
        "delete_employee": run_device_delete_employee_task,
        "clear_logs": run_device_clear_logs_task,
        "apply_policy": run_device_apply_policy_task,
        "distribute_template": run_device_distribute_template_task,
        "firmware_rollout": run_device_firmware_rollout_task,
    }
    return command_map.get(command)


def _command_message(command: str, payload: dict):
    if command == "sync":
        return "Sync started"
    if command == "sync_time":
        return "Sync time started"
    if command == "reboot":
        return "Reboot started"
    if command == "pull_logs":
        return "Pull logs started"
    if command == "pull_template":
        return f"Pull template for employee {payload.get('employee_code', '')} started".strip()
    if command == "push_employee":
        return f"Push employee {payload.get('employee_code', '')} started".strip()
    if command == "disable_employee":
        return f"Disable employee {payload.get('employee_code', '')} started".strip()
    if command == "enable_employee":
        return f"Enable employee {payload.get('employee_code', '')} started".strip()
    if command == "delete_employee":
        return f"Delete employee {payload.get('employee_code', '')} started".strip()
    if command == "clear_logs":
        return "Clear logs started"
    if command == "apply_policy":
        return f"Apply policy {payload.get('policy_id', '')} started".strip()
    if command == "distribute_template":
        return f"Distribute template {payload.get('template_id', '')} started".strip()
    if command == "firmware_rollout":
        return f"Firmware rollout {payload.get('rollout_id', '')} started".strip()
    return f"{command} started"


def _prepare_task_payload(command: str, payload: dict):
    if command in {"sync", "pull_logs"}:
        return {"limit": payload.get("limit")}
    if command == "pull_template":
        code = str(payload.get("employeeCode") or payload.get("employee_code") or "").strip()
        if not code:
            raise ValueError("employeeCode is required.")
        employee = Employee.objects.filter(employee_code=code).only("id").first()
        if not employee:
            raise ValueError("Employee not found.")
        template_type = str(payload.get("templateType") or payload.get("template_type") or "fingerprint").strip().lower()
        if template_type not in {"fingerprint", "face", "card"}:
            raise ValueError("templateType must be fingerprint, face, or card.")

        raw_index = payload.get("templateIndex", payload.get("template_index", 0))
        try:
            template_index = max(0, int(raw_index))
        except Exception:
            raise ValueError("templateIndex must be a non-negative integer.")

        raw_targets = payload.get("targetDeviceIds") or payload.get("target_device_ids") or []
        target_device_ids = []
        if raw_targets not in [None, ""]:
            if not isinstance(raw_targets, list):
                raise ValueError("targetDeviceIds must be a list.")
            for item in raw_targets:
                try:
                    target_device_ids.append(int(item))
                except Exception:
                    raise ValueError("targetDeviceIds must contain numeric device ids.")

        auto_distribute = _as_bool(payload.get("autoDistribute", payload.get("auto_distribute", True)), default=True)
        return {
            "employee_code": code,
            "template_type": template_type,
            "template_index": template_index,
            "target_device_ids": list(dict.fromkeys(target_device_ids)),
            "auto_distribute": auto_distribute,
        }
    if command in {"push_employee", "disable_employee", "enable_employee", "delete_employee"}:
        code = str(payload.get("employeeCode") or payload.get("employee_code") or "").strip()
        if not code:
            raise ValueError("employeeCode is required.")
        if command == "push_employee":
            employee = Employee.objects.filter(employee_code=code).first()
            if not employee:
                raise ValueError("Employee not found.")
            return {"employee_id": employee.id, "employee_code": code}
        return {"employee_code": code}
    if command == "apply_policy":
        policy_id = payload.get("policyId") or payload.get("policy_id")
        if not policy_id:
            raise ValueError("policyId is required.")
        policy = DevicePolicy.objects.filter(id=policy_id).first()
        if not policy:
            raise ValueError("Policy not found.")
        return {"policy_id": policy.id}
    if command == "distribute_template":
        template_id = payload.get("templateId") or payload.get("template_id")
        if not template_id:
            raise ValueError("templateId is required.")
        template = BiometricTemplate.objects.filter(id=template_id).first()
        if not template:
            raise ValueError("Template not found.")
        return {"template_id": template.id}
    if command == "firmware_rollout":
        rollout_id = payload.get("rolloutId") or payload.get("rollout_id")
        if not rollout_id:
            raise ValueError("rolloutId is required.")
        rollout = DeviceFirmwareRollout.objects.filter(id=rollout_id).first()
        if not rollout:
            raise ValueError("Rollout not found.")
        return {"rollout_id": rollout.id}
    return {}


def _enqueue_command_for_device(*, user, device, command: str, payload: dict, reason: str, request=None):
    task = _resolve_task(command)
    message = _command_message(command, payload)
    serializer_context = {"request": request} if request else {}
    log = DeviceSyncLog.objects.create(
        device=device,
        command=command,
        requested_by=user if user and user.is_authenticated else None,
        reason=str(reason or "")[:255],
        status="running",
        message=message,
    )
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action="create",
        model_name="DeviceCommand",
        object_id=str(log.id),
        changes={
            "deviceId": str(device.id),
            "command": command,
            "status": "queued",
            "reason": str(reason or ""),
            "payload": payload,
        },
    )
    if str(getattr(device, "connection_mode", "sdk") or "").strip().lower() == "adms":
        adms_payload = dict(payload or {})
        if command == "sync_time" and not adms_payload.get("timezone"):
            policy_timezone = str(getattr(getattr(device, "policy", None), "timezone", "") or "").strip()
            if policy_timezone:
                adms_payload["timezone"] = policy_timezone
        try:
            queued_item = enqueue_adms_command(
                device_id=device.id,
                command=command,
                payload=adms_payload,
                log_id=log.id,
            )
            pending_count = queue_size(device_id=device.id)
        except ValueError as exc:
            log.status = "failed"
            log.message = str(exc)
            log.finished_at = timezone.now()
            log.save(update_fields=["status", "message", "finished_at"])
            AuditLog.objects.create(
                user=user if user and user.is_authenticated else None,
                action="update",
                model_name="DeviceCommand",
                object_id=str(log.id),
                changes={"status": "failed", "message": log.message},
            )
            return {
                "ok": False,
                "status_code": status.HTTP_400_BAD_REQUEST,
                "data": {"detail": str(exc), "code": "ADMS_COMMAND_UNSUPPORTED", "log": DeviceSyncLogSerializer(log, context=serializer_context).data},
            }
        except Exception as exc:
            log.status = "failed"
            log.message = f"Failed to queue ADMS command: {exc}"
            log.finished_at = timezone.now()
            log.save(update_fields=["status", "message", "finished_at"])
            AuditLog.objects.create(
                user=user if user and user.is_authenticated else None,
                action="update",
                model_name="DeviceCommand",
                object_id=str(log.id),
                changes={"status": "failed", "message": log.message},
            )
            return {
                "ok": False,
                "status_code": status.HTTP_503_SERVICE_UNAVAILABLE,
                "data": {
                    "detail": "Failed to queue ADMS command",
                    "error": str(exc),
                    "log": DeviceSyncLogSerializer(log, context=serializer_context).data,
                },
            }

        log.message = f"Queued for ADMS delivery ({pending_count} pending)"
        log.save(update_fields=["message"])
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action="update",
            model_name="DeviceCommand",
            object_id=str(log.id),
            changes={"status": "queued_adms", "message": log.message},
        )
        return {
            "ok": True,
            "status_code": status.HTTP_202_ACCEPTED,
            "data": {
                "status": "queued_adms",
                "taskId": "",
                "channel": "adms",
                "queueSize": pending_count,
                "commandText": queued_item.get("commandText", ""),
                "log": DeviceSyncLogSerializer(log, context=serializer_context).data,
            },
        }

    if task is None:
        log.status = "failed"
        log.message = "Task worker is not configured."
        log.finished_at = timezone.now()
        log.save(update_fields=["status", "message", "finished_at"])
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action="update",
            model_name="DeviceCommand",
            object_id=str(log.id),
            changes={"status": "failed", "message": log.message},
        )
        return {
            "ok": False,
            "status_code": status.HTTP_503_SERVICE_UNAVAILABLE,
            "data": {"detail": "Task worker is not configured.", "log": DeviceSyncLogSerializer(log, context=serializer_context).data},
        }

    try:
        async_result = task.delay(device.id, log.id, **payload)
    except Exception as exc:
        fallback_enabled = bool(getattr(settings, "DEVICE_INLINE_TASK_FALLBACK_ON_QUEUE_ERROR", True))
        if fallback_enabled:
            try:
                inline_result = task.apply(
                    args=[device.id, log.id],
                    kwargs=payload,
                    throw=False,
                )
                failed = bool(getattr(inline_result, "failed", lambda: False)())
                if failed:
                    result_error = getattr(inline_result, "result", None)
                    raise RuntimeError(str(result_error or "inline execution failed"))

                log.refresh_from_db()
                return {
                    "ok": True,
                    "status_code": status.HTTP_200_OK,
                    "data": {
                        "status": "executed_inline",
                        "inline": True,
                        "taskId": str(getattr(inline_result, "id", "") or ""),
                        "log": DeviceSyncLogSerializer(log, context=serializer_context).data,
                    },
                }
            except Exception as inline_exc:
                exc = inline_exc

        log.status = "failed"
        log.message = f"Failed to queue command: {exc}"
        log.finished_at = timezone.now()
        log.save(update_fields=["status", "message", "finished_at"])
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action="update",
            model_name="DeviceCommand",
            object_id=str(log.id),
            changes={"status": "failed", "message": log.message},
        )
        return {
            "ok": False,
            "status_code": status.HTTP_503_SERVICE_UNAVAILABLE,
            "data": {"detail": "Failed to queue command", "error": str(exc), "log": DeviceSyncLogSerializer(log, context=serializer_context).data},
        }
    return {
            "ok": True,
            "status_code": status.HTTP_202_ACCEPTED,
            "data": {
                "status": "queued",
                "taskId": str(getattr(async_result, "id", "") or ""),
                "log": DeviceSyncLogSerializer(log, context=serializer_context).data,
            },
        }


class DeviceGroupViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = DeviceGroup.objects.all().annotate(device_total=Count("devices")).order_by("name", "id")
    serializer_class = DeviceGroupSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    search_fields = ["name", "name_en", "description", "description_en"]
    ordering_fields = ["name", "created_at"]

    @action(detail=True, methods=["get"], url_path="devices")
    @extend_schema(
        responses={
            200: inline_serializer(
                "GroupDevicesResponse",
                fields={
                    "groupId": serializers.CharField(),
                    "count": serializers.IntegerField(),
                    "devices": serializers.ListField(child=serializers.DictField()),
                },
            )
        }
    )
    def devices(self, request, pk=None):
        group = self.get_object()
        devices = group.devices.all().order_by("name").values(
            "id",
            "name",
            "serial_number",
            "status",
            "location",
            "last_sync",
            "last_heartbeat",
            "connection_mode",
        )
        return Response({"groupId": group.id, "count": len(devices), "devices": list(devices)})


class DevicePolicyViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = DevicePolicy.objects.all().annotate(device_total=Count("devices")).order_by("name", "id")
    serializer_class = DevicePolicySerializer
    permission_classes = [IsAuthenticated, RolePermission]
    search_fields = ["name", "name_en", "description", "description_en", "timezone", "verification_mode"]
    ordering_fields = ["name", "created_at", "updated_at"]

    @action(detail=True, methods=["post"], url_path="apply")
    @extend_schema(
        request=inline_serializer("ApplyPolicyRequest", fields={"groupId": serializers.IntegerField(required=False), "deviceIds": serializers.ListField(child=serializers.IntegerField(), required=False), "reason": serializers.CharField(required=False)}),
        responses={200: inline_serializer("ApplyPolicyResponse", fields={"status": serializers.CharField(), "policyId": serializers.CharField(), "requested": serializers.IntegerField(), "queued": serializers.IntegerField(), "results": serializers.ListField(child=serializers.DictField())})},
    )
    def apply_to_devices(self, request, pk=None):
        policy = self.get_object()
        group_id = request.data.get("groupId") or request.data.get("group_id")
        device_ids = request.data.get("deviceIds") or request.data.get("device_ids") or []
        if group_id and not device_ids:
            device_ids = list(Device.objects.filter(group_id=group_id).values_list("id", flat=True))
        if not isinstance(device_ids, list) or not device_ids:
            return Response({"detail": "deviceIds must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)

        reason = str(request.data.get("reason") or "").strip()
        task_payload = {"policy_id": policy.id}
        results = []
        queued = 0
        devices_map = {str(item.id): item for item in Device.objects.filter(id__in=device_ids)}
        for raw in device_ids:
            device = devices_map.get(str(raw))
            if not device:
                results.append({"deviceId": str(raw), "queued": False, "detail": "Device not found."})
                continue
            result = _enqueue_command_for_device(
                user=request.user,
                device=device,
                command="apply_policy",
                payload=task_payload,
                reason=reason,
                request=request,
            )
            queued += 1 if result["ok"] else 0
            results.append(
                {
                    "deviceId": str(device.id),
                    "deviceName": device.name,
                    "queued": bool(result["ok"]),
                    **result["data"],
                }
            )
        return Response(
            {
                "status": "ok",
                "policyId": str(policy.id),
                "requested": len(device_ids),
                "queued": queued,
                "results": results,
            }
        )


class DeviceTemplateViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = BiometricTemplate.objects.select_related(
        "employee",
        "source_device",
    ).order_by("-updated_at", "-id")
    serializer_class = BiometricTemplateSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["employee__employee_code", "template_type", "is_active"]
    search_fields = ["employee__employee_code", "employee__name", "template_hash"]
    ordering_fields = ["updated_at", "created_at", "version"]

    def perform_create(self, serializer):
        template_data = str(serializer.validated_data.get("template_data") or "")
        employee = serializer.validated_data.get("employee")
        template_type = serializer.validated_data.get("template_type", "fingerprint")
        template_index = serializer.validated_data.get("template_index", 0)
        conflict_strategy = serializer.validated_data.get("conflict_strategy", "last_write_wins")
        template_hash = hashlib.sha256(template_data.encode("utf-8")).hexdigest()
        latest = (
            BiometricTemplate.objects.filter(
                employee=employee,
                template_type=template_type,
                template_index=template_index,
            )
            .order_by("-version")
            .first()
        )
        if latest and latest.template_hash == template_hash:
            serializer.save(template_hash=template_hash, version=latest.version, is_active=latest.is_active)
            return
        next_version = (latest.version + 1) if latest else 1
        if latest and conflict_strategy == "manual_review":
            latest.is_active = False
            latest.save(update_fields=["is_active"])
        serializer.save(template_hash=template_hash, version=next_version)

    @action(detail=False, methods=["post"], url_path="capture-from-device")
    @extend_schema(
        request=inline_serializer("CaptureFromDeviceRequest", fields={
            "sourceDeviceId": serializers.IntegerField(),
            "employeeCode": serializers.CharField(),
            "templateType": serializers.CharField(required=False),
            "templateIndex": serializers.IntegerField(required=False),
            "groupId": serializers.IntegerField(required=False),
            "targetDeviceIds": serializers.ListField(child=serializers.IntegerField(), required=False),
            "autoDistribute": serializers.BooleanField(required=False),
            "reason": serializers.CharField(required=False),
        }),
        responses={200: inline_serializer("CaptureFromDeviceResponse", fields={
            "status": serializers.CharField(),
            "sourceDeviceId": serializers.CharField(),
            "employeeCode": serializers.CharField(),
            "targetDeviceIds": serializers.ListField(child=serializers.IntegerField()),
            "taskId": serializers.CharField(required=False),
            "log": DeviceSyncLogSerializer(),
        })},
    )
    def capture_from_device(self, request):
        source_device_id = (
            request.data.get("sourceDeviceId")
            or request.data.get("source_device_id")
            or request.data.get("deviceId")
            or request.data.get("device_id")
        )
        if not source_device_id:
            return Response({"detail": "sourceDeviceId is required."}, status=status.HTTP_400_BAD_REQUEST)

        source_device = Device.objects.filter(id=source_device_id).first()
        if not source_device:
            return Response({"detail": "Source device not found."}, status=status.HTTP_404_NOT_FOUND)

        employee_code = str(
            request.data.get("employeeCode")
            or request.data.get("employee_code")
            or ""
        ).strip()
        if not employee_code:
            return Response({"detail": "employeeCode is required."}, status=status.HTTP_400_BAD_REQUEST)

        template_type = str(
            request.data.get("templateType")
            or request.data.get("template_type")
            or "fingerprint"
        ).strip().lower()
        if template_type not in {"fingerprint", "face", "card"}:
            return Response({"detail": "templateType must be fingerprint, face, or card."}, status=status.HTTP_400_BAD_REQUEST)

        raw_index = request.data.get("templateIndex", request.data.get("template_index", 0))
        try:
            template_index = max(0, int(raw_index))
        except Exception:
            return Response({"detail": "templateIndex must be a non-negative integer."}, status=status.HTTP_400_BAD_REQUEST)

        group_id = request.data.get("groupId") or request.data.get("group_id")
        target_device_ids = request.data.get("targetDeviceIds") or request.data.get("target_device_ids") or []
        if group_id and not target_device_ids:
            target_device_ids = list(Device.objects.filter(group_id=group_id).values_list("id", flat=True))
        if not isinstance(target_device_ids, list):
            return Response({"detail": "targetDeviceIds must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        normalized_targets = []
        for value in target_device_ids:
            try:
                normalized_targets.append(int(value))
            except Exception:
                return Response({"detail": "targetDeviceIds must contain numeric ids."}, status=status.HTTP_400_BAD_REQUEST)
        normalized_targets = [item for item in list(dict.fromkeys(normalized_targets)) if item != source_device.id]

        auto_distribute = _as_bool(
            request.data.get("autoDistribute", request.data.get("auto_distribute", True)),
            default=True,
        )
        reason = str(request.data.get("reason") or "template capture from enrollment device").strip()
        payload = {
            "employee_code": employee_code,
            "template_type": template_type,
            "template_index": template_index,
            "target_device_ids": normalized_targets,
            "auto_distribute": auto_distribute,
        }
        result = _enqueue_command_for_device(
            user=request.user,
            device=source_device,
            command="pull_template",
            payload=payload,
            reason=reason,
            request=request,
        )
        if not result["ok"]:
            return Response(result["data"], status=result["status_code"])
        return Response(
            {
                "status": "ok",
                "sourceDeviceId": str(source_device.id),
                "employeeCode": employee_code,
                "targetDeviceIds": normalized_targets,
                **result["data"],
            },
            status=result["status_code"],
        )

    @action(detail=True, methods=["post"], url_path="distribute")
    @extend_schema(
        request=inline_serializer("DistributeTemplateRequest", fields={"groupId": serializers.IntegerField(required=False), "deviceIds": serializers.ListField(child=serializers.IntegerField(), required=False), "reason": serializers.CharField(required=False)}),
        responses={200: inline_serializer("DistributeTemplateResponse", fields={"status": serializers.CharField(), "templateId": serializers.CharField(), "requested": serializers.IntegerField(), "queued": serializers.IntegerField(), "failed": serializers.IntegerField(), "results": serializers.ListField(child=serializers.DictField())})},
    )
    def distribute(self, request, pk=None):
        template = self.get_object()
        group_id = request.data.get("groupId") or request.data.get("group_id")
        device_ids = request.data.get("deviceIds") or request.data.get("device_ids") or []
        if group_id and not device_ids:
            device_ids = list(Device.objects.filter(group_id=group_id).values_list("id", flat=True))
        if not isinstance(device_ids, list) or not device_ids:
            return Response({"detail": "deviceIds must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)

        reason = str(request.data.get("reason") or "template distribution").strip()
        results = []
        queued = 0
        devices_map = {str(item.id): item for item in Device.objects.filter(id__in=device_ids)}
        for raw in device_ids:
            device = devices_map.get(str(raw))
            if not device:
                results.append({"deviceId": str(raw), "queued": False, "detail": "Device not found."})
                continue
            result = _enqueue_command_for_device(
                user=request.user,
                device=device,
                command="distribute_template",
                payload={"template_id": template.id},
                reason=reason,
                request=request,
            )
            queued += 1 if result["ok"] else 0
            results.append(
                {
                    "deviceId": str(device.id),
                    "deviceName": device.name,
                    "queued": bool(result["ok"]),
                    **result["data"],
                }
            )
        return Response(
            {
                "status": "ok",
                "templateId": str(template.id),
                "requested": len(device_ids),
                "queued": queued,
                "failed": len(device_ids) - queued,
                "results": results,
            }
        )

    @action(detail=True, methods=["get"], url_path="distribution-report")
    @extend_schema(
        responses={
            200: inline_serializer(
                "TemplateDistributionReportResponse",
                fields={
                    "templateId": serializers.CharField(),
                    "count": serializers.IntegerField(),
                    "rows": BiometricTemplateDistributionSerializer(many=True),
                },
            )
        }
    )
    def distribution_report(self, request, pk=None):
        template = self.get_object()
        rows = template.distributions.select_related("device", "requested_by")[:100]
        serializer = BiometricTemplateDistributionSerializer(rows, many=True, context={"request": request})
        return Response({"templateId": str(template.id), "count": len(serializer.data), "rows": serializer.data})


class DeviceCommandApprovalViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = DeviceCommandApproval.objects.prefetch_related(
        "target_devices",
    ).order_by("-requested_at", "-id")
    serializer_class = DeviceCommandApprovalSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "command"]
    search_fields = ["command", "reason", "reason_en", "target_devices__name", "target_devices__name_en", "target_devices__serial_number"]
    ordering_fields = ["requested_at", "expires_at", "decided_at", "executed_at"]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user if self.request.user.is_authenticated else None)

    def _execute_approval(self, approval: DeviceCommandApproval, user):
        command = _normalize_command(approval.command)
        payload = dict(approval.payload or {})
        try:
            task_payload = _prepare_task_payload(command, payload)
        except ValueError as exc:
            return {"ok": False, "detail": str(exc), "results": []}

        reason = approval.reason or payload.get("reason") or "approved command"
        results = []
        queued = 0
        for device in approval.target_devices.all():
            result = _enqueue_command_for_device(
                user=user,
                device=device,
                command=command,
                payload=task_payload,
                reason=reason,
                request=request,
            )
            queued += 1 if result["ok"] else 0
            results.append(
                {
                    "deviceId": str(device.id),
                    "deviceName": device.name,
                    "queued": bool(result["ok"]),
                    **result["data"],
                }
            )

        if queued:
            approval.status = "executed"
            approval.executed_at = timezone.now()
            approval.save(update_fields=["status", "executed_at"])
        return {"ok": True, "queued": queued, "results": results}

    @action(detail=True, methods=["post"], url_path="approve")
    @extend_schema(
        request=inline_serializer("ApproveCommandRequest", fields={"executeNow": serializers.BooleanField(required=False)}),
        responses={200: inline_serializer("ApproveCommandResponse", fields={"status": serializers.CharField(), "approval": DeviceCommandApprovalSerializer(), "execution": serializers.DictField()})},
    )
    def approve(self, request, pk=None):
        if not _can_approve_commands(request.user):
            return Response({"detail": "Not authorized to approve commands."}, status=status.HTTP_403_FORBIDDEN)
        approval = self.get_object()
        if approval.status != "pending":
            return Response({"detail": "Approval is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        if approval.expires_at and approval.expires_at < timezone.now():
            approval.status = "expired"
            approval.decided_at = timezone.now()
            approval.save(update_fields=["status", "decided_at"])
            return Response({"detail": "Approval expired."}, status=status.HTTP_400_BAD_REQUEST)

        approval.status = "approved"
        approval.approved_by = request.user
        approval.decided_at = timezone.now()
        approval.save(update_fields=["status", "approved_by", "decided_at"])
        AuditLog.objects.create(
            user=request.user,
            action="update",
            model_name="DeviceCommandApproval",
            object_id=str(approval.id),
            changes={"status": "approved", "command": approval.command},
        )

        execute_now = str(request.data.get("executeNow", "true")).strip().lower() not in {"0", "false", "no"}
        execution = {"ok": True, "queued": 0, "results": []}
        if execute_now:
            execution = self._execute_approval(approval, request.user)
        serializer = self.get_serializer(approval)
        return Response({"status": "approved", "approval": serializer.data, "execution": execution})

    @action(detail=True, methods=["post"], url_path="reject")
    @extend_schema(responses={200: inline_serializer("RejectCommandResponse", fields={"status": serializers.CharField(), "approval": DeviceCommandApprovalSerializer()})})
    def reject(self, request, pk=None):
        if not _can_approve_commands(request.user):
            return Response({"detail": "Not authorized to reject commands."}, status=status.HTTP_403_FORBIDDEN)
        approval = self.get_object()
        if approval.status != "pending":
            return Response({"detail": "Approval is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        approval.status = "rejected"
        approval.rejected_by = request.user
        approval.decided_at = timezone.now()
        approval.save(update_fields=["status", "rejected_by", "decided_at"])
        AuditLog.objects.create(
            user=request.user,
            action="update",
            model_name="DeviceCommandApproval",
            object_id=str(approval.id),
            changes={"status": "rejected", "command": approval.command},
        )
        serializer = self.get_serializer(approval)
        return Response({"status": "rejected", "approval": serializer.data})


class DeviceFirmwareRolloutViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = DeviceFirmwareRollout.objects.select_related("device_group", "requested_by")
    serializer_class = DeviceFirmwareRolloutSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "device_group"]
    search_fields = ["target_version", "notes", "notes_en", "device_group__name", "device_group__name_en"]
    ordering_fields = ["created_at", "started_at", "finished_at", "target_version"]

    @action(detail=True, methods=["post"], url_path="start")
    @extend_schema(responses={200: inline_serializer("FirmwareRolloutStartResponse", fields={"status": serializers.CharField(), "rolloutId": serializers.CharField(), "targetVersion": serializers.CharField(), "requested": serializers.IntegerField(), "queued": serializers.IntegerField(), "failed": serializers.IntegerField(), "results": serializers.ListField(child=serializers.DictField())})})
    def start(self, request, pk=None):
        rollout = self.get_object()
        if rollout.status not in {"draft", "failed"}:
            return Response({"detail": "Rollout can only start from draft/failed status."}, status=status.HTTP_400_BAD_REQUEST)

        plan = rollout.rollout_plan or {}
        device_ids = plan.get("deviceIds") or plan.get("device_ids") or []
        if rollout.device_group and not device_ids:
            device_ids = list(rollout.device_group.devices.values_list("id", flat=True))
        if not device_ids:
            return Response({"detail": "No target devices for rollout."}, status=status.HTTP_400_BAD_REQUEST)

        rollout.status = "running"
        rollout.started_at = timezone.now()
        rollout.finished_at = None
        rollout.save(update_fields=["status", "started_at", "finished_at"])

        results = []
        queued = 0
        devices_map = {str(item.id): item for item in Device.objects.filter(id__in=device_ids)}
        for raw in device_ids:
            device = devices_map.get(str(raw))
            if not device:
                results.append({"deviceId": str(raw), "queued": False, "detail": "Device not found."})
                continue
            result = _enqueue_command_for_device(
                user=request.user,
                device=device,
                command="firmware_rollout",
                payload={"rollout_id": rollout.id},
                reason=f"Firmware rollout to {rollout.target_version}",
                request=request,
            )
            queued += 1 if result["ok"] else 0
            results.append(
                {
                    "deviceId": str(device.id),
                    "deviceName": device.name,
                    "queued": bool(result["ok"]),
                    **result["data"],
                }
            )
        return Response(
            {
                "status": "running",
                "rolloutId": str(rollout.id),
                "targetVersion": rollout.target_version,
                "requested": len(device_ids),
                "queued": queued,
                "failed": len(device_ids) - queued,
                "results": results,
            }
        )

    @action(detail=True, methods=["get"], url_path="report")
    @extend_schema(responses={200: inline_serializer("FirmwareRolloutReportResponse", fields={"rolloutId": serializers.CharField(), "status": serializers.CharField(), "targetVersion": serializers.CharField(), "summary": serializers.DictField()})})
    def report(self, request, pk=None):
        rollout = self.get_object()
        logs = DeviceSyncLog.objects.filter(
            command="firmware_rollout",
            reason__icontains=str(rollout.target_version),
        )
        if rollout.device_group_id:
            logs = logs.filter(device__group_id=rollout.device_group_id)
        success = logs.filter(status="success").count()
        failed = logs.filter(status="failed").count()
        running = logs.filter(status="running").count()
        total = logs.count()
        status_value = rollout.status
        if total and running == 0:
            status_value = "completed" if failed == 0 else "failed"
            if rollout.status != status_value:
                rollout.status = status_value
                rollout.finished_at = timezone.now()
                rollout.save(update_fields=["status", "finished_at"])
        return Response(
            {
                "rolloutId": str(rollout.id),
                "status": rollout.status,
                "targetVersion": rollout.target_version,
                "summary": {
                    "totalCommands": total,
                    "success": success,
                    "failed": failed,
                    "running": running,
                },
            }
        )


class DeviceBackupSnapshotViewSet(viewsets.ModelViewSet):
    resource_name = "devices"
    queryset = DeviceBackupSnapshot.objects.select_related(
        "device",
        "device_group",
        "created_by",
    ).order_by("-created_at", "-id")
    serializer_class = DeviceBackupSnapshotSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["scope", "device", "device_group"]
    search_fields = ["name", "name_en", "device__name", "device__name_en", "device_group__name", "device_group__name_en"]
    ordering_fields = ["created_at", "restored_at", "name"]

    def perform_create(self, serializer):
        scope = serializer.validated_data.get("scope", "single")
        device = serializer.validated_data.get("device")
        group = serializer.validated_data.get("device_group")
        devices_qs = Device.objects.none()
        if scope == "single" and device:
            devices_qs = Device.objects.filter(id=device.id)
        elif scope == "group" and group:
            devices_qs = group.devices.all()
        elif scope == "global":
            devices_qs = Device.objects.all()

        devices_payload = []
        for item in devices_qs:
            devices_payload.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "name_en": item.name_en,
                    "serial_number": item.serial_number,
                    "ip_address": item.ip_address,
                    "port": item.port,
                    "model": item.model,
                    "firmware_version": item.firmware_version,
                    "platform": item.platform,
                    "location": item.location,
                    "location_en": item.location_en,
                    "status": item.status,
                    "group_id": item.group_id,
                    "policy_id": item.policy_id,
                    "connection_mode": item.connection_mode,
                    "is_primary_enrollment": item.is_primary_enrollment,
                }
            )

        payload = {
            "createdAt": timezone.now().isoformat(),
            "scope": scope,
            "deviceCount": len(devices_payload),
            "devices": devices_payload,
        }
        serializer.save(
            payload=payload,
            created_by=self.request.user if self.request.user.is_authenticated else None,
        )

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        snapshot = self.get_object()
        payload = snapshot.payload or {}
        rows = payload.get("devices") or []
        if not isinstance(rows, list) or not rows:
            return Response({"detail": "Snapshot has no devices payload."}, status=status.HTTP_400_BAD_REQUEST)

        restored = 0
        for row in rows:
            serial = str(row.get("serial_number") or "").strip()
            if not serial:
                continue
            device = Device.objects.filter(serial_number__iexact=serial).first()
            if not device:
                continue
            device.name = row.get("name") or device.name
            device.name_en = row.get("name_en") or device.name_en
            device.ip_address = row.get("ip_address") or device.ip_address
            device.port = int(row.get("port") or device.port)
            device.model = row.get("model") or device.model
            device.firmware_version = row.get("firmware_version") or device.firmware_version
            device.platform = row.get("platform") or device.platform
            device.location = row.get("location") or device.location
            device.location_en = row.get("location_en") or device.location_en
            device.connection_mode = row.get("connection_mode") or device.connection_mode
            device.is_primary_enrollment = bool(row.get("is_primary_enrollment"))
            device.group_id = row.get("group_id") if row.get("group_id") else None
            device.policy_id = row.get("policy_id") if row.get("policy_id") else None
            device.save()
            restored += 1
        snapshot.restored_at = timezone.now()
        snapshot.save(update_fields=["restored_at"])
        return Response({"status": "ok", "snapshotId": str(snapshot.id), "restoredDevices": restored})


class DeviceCommandCenterViewSet(viewsets.ViewSet):
    resource_name = "devices"
    permission_classes = [IsAuthenticated, RolePermission]

    @action(detail=False, methods=["get"], url_path="catalog")
    @extend_schema(
        responses={200: inline_serializer("CommandCatalogResponse", fields={"commands": serializers.ListField(child=serializers.DictField())})},
        summary="Device Command Catalog",
        description="Returns a list of available device management commands and whether they are sensitive (require approval)."
    )
    def catalog(self, request):
        return Response(
            {
                "commands": [
                    {"code": "sync", "sensitive": False},
                    {"code": "sync_time", "sensitive": True},
                    {"code": "reboot", "sensitive": True},
                    {"code": "pull_logs", "sensitive": False},
                    {"code": "pull_template", "sensitive": False},
                    {"code": "push_employee", "sensitive": False},
                    {"code": "disable_employee", "sensitive": True},
                    {"code": "enable_employee", "sensitive": True},
                    {"code": "delete_employee", "sensitive": True},
                    {"code": "clear_logs", "sensitive": True},
                    {"code": "apply_policy", "sensitive": False},
                    {"code": "distribute_template", "sensitive": False},
                    {"code": "firmware_rollout", "sensitive": True},
                ]
            }
        )

    @action(detail=False, methods=["post"], url_path="queue")
    @extend_schema(
        request=inline_serializer("QueueCommandRequest", fields={"command": serializers.CharField(), "deviceIds": serializers.ListField(child=serializers.CharField(), required=False), "groupId": serializers.IntegerField(required=False), "reason": serializers.CharField(required=False), "payload": serializers.DictField(required=False)}),
        responses={200: inline_serializer("QueueCommandResponse", fields={"status": serializers.CharField(), "queued": serializers.IntegerField(), "approvalId": serializers.CharField(required=False)})},
        summary="Queue Device Command",
        description="Queues a command for one or more devices. Sensitive commands may trigger an approval workflow."
    )
    def queue_command(self, request):
        command = _normalize_command(request.data.get("command"))
        if not command:
            return Response({"detail": "command is required."}, status=status.HTTP_400_BAD_REQUEST)

        device_ids = request.data.get("deviceIds") or request.data.get("device_ids") or []
        group_id = request.data.get("groupId") or request.data.get("group_id")
        reason = str(request.data.get("reason") or "").strip()
        payload = request.data.get("payload") or {}
        if group_id and not device_ids:
            device_ids = list(Device.objects.filter(group_id=group_id).values_list("id", flat=True))
        if not isinstance(device_ids, list) or not device_ids:
            return Response({"detail": "deviceIds must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)

        if command not in {
            "sync",
            "sync_time",
            "reboot",
            "pull_logs",
            "pull_template",
            "push_employee",
            "disable_employee",
            "enable_employee",
            "delete_employee",
            "clear_logs",
            "apply_policy",
            "distribute_template",
            "firmware_rollout",
        }:
            return Response({"detail": "Unsupported command."}, status=status.HTTP_400_BAD_REQUEST)

        require_approval = bool(getattr(settings, "DEVICE_COMMAND_REQUIRES_APPROVAL", True))
        if require_approval and command in SENSITIVE_COMMANDS and not _can_approve_commands(request.user):
            approval = DeviceCommandApproval.objects.create(
                command=command,
                payload=payload,
                reason=reason,
                status="pending",
                requested_by=request.user if request.user.is_authenticated else None,
                expires_at=timezone.now()
                + timedelta(
                    minutes=max(
                        5,
                        int(getattr(settings, "DEVICE_COMMAND_APPROVAL_TTL_MINUTES", 30)),
                    )
                ),
            )
            approval.target_devices.set(Device.objects.filter(id__in=device_ids))
            serializer = DeviceCommandApprovalSerializer(approval, context={"request": request})
            return Response(
                {
                    "status": "pending_approval",
                    "detail": "Command requires approval before execution.",
                    "approval": serializer.data,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        try:
            task_payload = _prepare_task_payload(command, payload)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        devices_map = {str(item.id): item for item in Device.objects.filter(id__in=device_ids)}
        results = []
        queued = 0
        for raw in device_ids:
            device = devices_map.get(str(raw))
            if not device:
                results.append({"deviceId": str(raw), "queued": False, "detail": "Device not found."})
                continue
            result = _enqueue_command_for_device(
                user=request.user,
                device=device,
                command=command,
                payload=task_payload,
                reason=reason,
                request=request,
            )
            queued += 1 if result["ok"] else 0
            results.append(
                {
                    "deviceId": str(device.id),
                    "deviceName": device.name,
                    "queued": bool(result["ok"]),
                    **result["data"],
                }
            )

        return Response(
            {
                "status": "ok",
                "command": command,
                "requested": len(device_ids),
                "queued": queued,
                "failed": len(device_ids) - queued,
                "results": results,
            }
        )

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        now = timezone.now()
        recent_cutoff = now - timedelta(days=7)
        commands_qs = DeviceSyncLog.objects.filter(started_at__gte=recent_cutoff)
        summary = {
            "totalDevices": Device.objects.count(),
            "onlineDevices": Device.objects.filter(status="online").count(),
            "offlineDevices": Device.objects.filter(status="offline").count(),
            "primaryEnrollmentDevices": Device.objects.filter(is_primary_enrollment=True).count(),
            "groups": DeviceGroup.objects.count(),
            "policies": DevicePolicy.objects.count(),
            "pendingApprovals": DeviceCommandApproval.objects.filter(status="pending").count(),
            "runningRollouts": DeviceFirmwareRollout.objects.filter(status="running").count(),
            "activeTemplates": BiometricTemplate.objects.filter(is_active=True).count(),
            "templateDistributionsLast7Days": BiometricTemplateDistribution.objects.filter(
                started_at__gte=recent_cutoff
            ).count(),
            "commandsLast7Days": commands_qs.count(),
            "failedCommandsLast7Days": commands_qs.filter(status="failed").count(),
        }
        recent_commands = DeviceSyncLogSerializer(
            DeviceSyncLog.objects.select_related("device", "requested_by")[:20],
            many=True,
        ).data
        pending_approvals = DeviceCommandApprovalSerializer(
            DeviceCommandApproval.objects.filter(status="pending").prefetch_related("target_devices")[:20],
            many=True,
            context={"request": request},
        ).data
        high_risk_devices = (
            Device.objects.annotate(
                failed_30=Count(
                    "sync_logs",
                    filter=Q(
                        sync_logs__status="failed",
                        sync_logs__started_at__gte=now - timedelta(days=30),
                    ),
                ),
                total_30=Count(
                    "sync_logs",
                    filter=Q(sync_logs__started_at__gte=now - timedelta(days=30)),
                ),
            )
            .order_by("-failed_30", "name")[:20]
        )
        risk_payload = []
        for item in high_risk_devices:
            total = int(item.total_30 or 0)
            failed = int(item.failed_30 or 0)
            risk_payload.append(
                {
                    "id": str(item.id),
                    "name": item.name,
                    "serialNumber": item.serial_number,
                    "status": item.status,
                    "failedCommands30Days": failed,
                    "totalCommands30Days": total,
                    "failureRatePercent": round((failed / total) * 100, 2) if total else 0.0,
                }
            )
        return Response(
            {
                "generatedAt": now,
                "summary": summary,
                "highRiskDevices": risk_payload,
                "recentCommands": recent_commands,
                "pendingApprovals": pending_approvals,
            }
        )

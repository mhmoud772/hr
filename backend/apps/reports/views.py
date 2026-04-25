import logging

import psutil
from django.db import connections
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.models import AuditLog
from apps.authentication.permissions import RolePermission
from apps.attendance.models import Attendance, BiometricLog
from apps.devices.models import Device, DeviceSyncLog
from .services.analytical_service import AnalyticalService
from .serializers import (
    AttendanceTrendResponseSerializer,
    MetricSnapshotTriggerRequestSerializer,
    DashboardSummaryResponseSerializer,
    DashboardPulseResponseSerializer,
    SystemMonitorResponseSerializer,
    AuditLogMinimalSerializer,
)
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter

logger = logging.getLogger(__name__)


class AttendanceTrendView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    resource_name = "analytics"

    @extend_schema(
        parameters=[OpenApiParameter(name="days", type=int, description="Number of days to look back", default=30)],
        responses={200: AttendanceTrendResponseSerializer}
    )
    def get(self, request):
        days = int(request.query_params.get("days", 30))
        trends = AnalyticalService.get_attendance_trends(days=days)
        is_english = request.headers.get("Accept-Language", "").lower().startswith("en")
        return Response(
            {
                "labels": [t["date"] for t in trends],
                "datasets": [
                    {
                        "label": "Attendance Rate (%)" if is_english else "معدل الالتزام (%)",
                        "data": [t["rate"] for t in trends],
                    }
                ],
            }
        )


class MetricSnapshotTriggerView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    resource_name = "settings"

    @extend_schema(request=MetricSnapshotTriggerRequestSerializer, responses={200: inline_serializer("MetricSnapshotStatusResponse", fields={"status": serializers.CharField()})})
    def post(self, request):
        target_date_str = request.data.get("date")
        try:
            AnalyticalService.run_etl_pipeline(target_date_str)
            return Response({"status": "Snapshot triggered successfully."})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    resource_name = "dashboard"

    @extend_schema(
        parameters=[OpenApiParameter(name="range", enum=["today", "week", "month"], description="Time range for stats", default="week")],
        responses={200: DashboardSummaryResponseSerializer}
    )
    def get(self, request):
        range_param = request.query_params.get("range", "week")
        days = 30 if range_param == "month" else (1 if range_param == "today" else 7)
        data = AnalyticalService.get_dashboard_stats(days_range=days, language=request.headers.get("Accept-Language"))
        return Response(data)


class DashboardPulseView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    resource_name = "dashboard"

    @extend_schema(responses={200: DashboardPulseResponseSerializer})
    def get(self, request):
        try:
            now = timezone.now()
            today = now.date()
            language = request.headers.get("Accept-Language")

            currently_checked_in = Attendance.objects.filter(
                date=today,
                check_in__isnull=False,
                check_out__isnull=True,
            ).count()

            online_devices = Device.objects.filter(status="online").count()
            total_devices = Device.objects.count()

            latest_logs = BiometricLog.objects.select_related("device").order_by("-timestamp")[:5]
            logs_data = []
            for log in latest_logs:
                device_name = "Unknown Device"
                if log.device:
                    try:
                        device_name = log.device.get_localized_name(language)
                    except Exception:
                        device_name = log.device.name or "Unnamed Device"
                
                logs_data.append({
                    "employee_code": log.employee_code,
                    "device": device_name,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else now.isoformat(),
                    "action": log.action,
                })

            last_sync = DeviceSyncLog.objects.filter(status="success").order_by("-finished_at").first()

            data = {
                "currentlyCheckedIn": currently_checked_in,
                "deviceStatus": {
                    "online": online_devices,
                    "total": total_devices,
                },
                "latestLogs": logs_data,
                "lastSync": last_sync.finished_at.isoformat() if last_sync and last_sync.finished_at else None,
            }
            return Response(data)
        except Exception as e:
            logger.exception("Error in DashboardPulseView")
            return Response(
                {"detail": "Internal server error in dashboard pulse.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SystemMonitorView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    resource_name = "settings"

    @extend_schema(responses={200: SystemMonitorResponseSerializer})
    def get(self, request):
        db_ok = True
        try:
            with connections["default"].cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            db_ok = False

        redis_configured = bool(getattr(__import__("django.conf").conf.settings, "CELERY_BROKER_URL", ""))
        return Response(
            {
                "resources": {
                    "cpuPercent": psutil.cpu_percent(interval=None),
                    "memoryPercent": psutil.virtual_memory().percent,
                    "diskPercent": psutil.disk_usage("/").percent,
                },
                "services": {
                    "database": {"ok": db_ok},
                    "analyticalDatabase": AnalyticalService.get_metrics_database_status(),
                    "redis": {"configured": redis_configured},
                },
            }
        )


class SecurityAuditLogView(APIView):
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    resource_name = "settings"

    @extend_schema(responses={200: AuditLogMinimalSerializer(many=True)})
    def get(self, request):
        logs = AuditLog.objects.order_by("-created_at")[:50]
        return Response(
            [
                {
                    "id": item.id,
                    "action": item.action,
                    "model_name": item.model_name,
                    "object_id": item.object_id,
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                }
                for item in logs
            ]
        )

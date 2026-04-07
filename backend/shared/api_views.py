import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import connection
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.permissions import (
    RolePermission,
    get_effective_permission_codes,
    is_admin_role,
)
from config.celery import app as celery_app
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from shared.serializers import (
    SettingsSerializer,
    HealthCheckResponseSerializer,
    MetricsResponseSerializer,
)
from shared.system import get_or_create_settings

User = get_user_model()
logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(responses={200: HealthCheckResponseSerializer})
    def get(self, request):
        health = {
            "status": "healthy",
            "database": "ok",
            "redis": "ok",
            "celery": "ok",
            "timestamp": None,
        }

        try:
            connection.ensure_connection()
        except Exception as exc:
            health["database"] = f"error: {exc}"
            health["status"] = "unhealthy"

        try:
            cache.set("health_check_ping", "pong", timeout=10)
            if cache.get("health_check_ping") != "pong":
                health["redis"] = "error: pings failed"
                health["status"] = "unhealthy"
        except Exception as exc:
            health["redis"] = f"error: {exc}"
            health["status"] = "unhealthy"

        try:
            inspect = celery_app.control.inspect()
            stats = inspect.stats()
            if not stats:
                health["celery"] = "warning: no active workers found"
        except Exception as exc:
            health["celery"] = f"error: {exc}"

        health["timestamp"] = timezone.now().isoformat()
        http_status = 200 if health["status"] == "healthy" else 503
        return Response(health, status=http_status)


class MetricsView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    @extend_schema(responses={200: MetricsResponseSerializer})
    def get(self, request):
        return Response(
            {
                "uptime": "99.9%",
                "api_latency_avg": "45ms",
                "active_sessions": User.objects.filter(
                    last_login__gte=timezone.now() - timedelta(hours=1),
                ).count(),
            }
        )


class SettingsViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = SettingsSerializer
    permission_classes = [IsAuthenticated, RolePermission]

    @staticmethod
    def _has_section_permission(request, section: str) -> bool:
        user_permissions = get_effective_permission_codes(request.user)
        if not user_permissions:
            return True
        if {"*", "all"} & user_permissions or is_admin_role(request.user):
            return True
        if section in ["company-settings", "general-settings", "ai-settings", "company_settings", "general_settings", "ai_settings"]:
            return bool({"settings", "settings.write", "settings.*"} & user_permissions)
        if section in ["attendance-settings", "attendance_settings"]:
            return bool(
                {
                    "attendance",
                    "attendance.write",
                    "attendance.*",
                    "settings",
                    "settings.write",
                    "settings.*",
                }
                & user_permissions
            )
        if section in ["leave-settings", "leave_settings"]:
            return bool(
                {
                    "leaves",
                    "leaves.write",
                    "leaves.*",
                    "settings",
                    "settings.write",
                    "settings.*",
                }
                & user_permissions
            )
        if section in ["notification-settings", "notification_settings"]:
            return bool(
                {
                    "notifications",
                    "notifications.write",
                    "notifications.*",
                    "settings",
                    "settings.write",
                    "settings.*",
                }
                & user_permissions
            )
        return bool({"settings", "settings.write", "settings.*"} & user_permissions)

    def get_object(self):
        settings_obj, _created = get_or_create_settings()
        return settings_obj

    @extend_schema(
        parameters=[OpenApiParameter(name="id", type=str, location=OpenApiParameter.PATH, description="Settings ID (use 'current' or any string)")],
        responses={200: SettingsSerializer}
    )
    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    @extend_schema(
        parameters=[OpenApiParameter(name="id", type=str, location=OpenApiParameter.PATH, description="Settings ID (use 'current' or any string)")],
        responses={200: SettingsSerializer, 403: OpenApiResponse(description="Not authorized for this section")}
    )
    def update(self, request, *args, **kwargs):
        section_keys = {
            "company-settings",
            "company_settings",
            "general-settings",
            "general_settings",
            "attendance-settings",
            "attendance_settings",
            "leave-settings",
            "leave_settings",
            "notification-settings",
            "notification_settings",
            "ai-settings",
            "ai_settings",
        }
        if any(key in request.data for key in section_keys):
            for key in request.data.keys():
                if key in section_keys and not self._has_section_permission(request, key):
                    return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

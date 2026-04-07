from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.reports.views import (
    AttendanceTrendView,
    DashboardPulseView,
    DashboardSummaryView,
    MetricSnapshotTriggerView,
    SecurityAuditLogView,
    SystemMonitorView,
)
from shared.api_views import HealthCheckView, SettingsViewSet

router = DefaultRouter()
router.register(r"settings", SettingsViewSet, basename="settings")

urlpatterns = [
    # Core/System Endpoints
    path("health", HealthCheckView.as_view(), name="health"),
    path("dashboard/summary", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/pulse", DashboardPulseView.as_view(), name="dashboard-pulse"),
    path("analytics/trends", AttendanceTrendView.as_view(), name="analytics-trends"),
    path("analytics/snapshot", MetricSnapshotTriggerView.as_view(), name="analytics-snapshot"),
    path("monitoring/status", SystemMonitorView.as_view(), name="monitoring-status"),
    path("monitoring/security-logs", SecurityAuditLogView.as_view(), name="monitoring-security-logs"),

    # Modular App Endpoints
    path("", include("apps.authentication.urls")),
    path("", include("apps.employees.urls")),
    path("", include("apps.attendance.urls")),
    path("", include("apps.devices.urls")),
    path("", include("apps.notifications.urls")),
    path("ai/", include("apps.ai.urls")),
    path("reports/", include("apps.reports.urls")),

    # System Router
    path("", include(router.urls)),
]

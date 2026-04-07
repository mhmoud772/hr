from django.urls import path
from .views import AttendanceTrendView, MetricSnapshotTriggerView, DashboardSummaryView, DashboardPulseView

urlpatterns = [
    path('attendance/trend/', AttendanceTrendView.as_view(), name='attendance-trend'),
    path('metrics/snapshot/trigger/', MetricSnapshotTriggerView.as_view(), name='metric-snapshot-trigger'),
    
    # Dashboard
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/pulse/', DashboardPulseView.as_view(), name='dashboard-pulse'),
]

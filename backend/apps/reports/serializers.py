from rest_framework import serializers
from .models import AnalyticalMetric

class AnalyticalMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticalMetric
        fields = "__all__"


class AttendanceTrendResponseSerializer(serializers.Serializer):
    class DatasetSerializer(serializers.Serializer):
        label = serializers.CharField()
        data = serializers.ListField(child=serializers.FloatField())

    labels = serializers.ListField(child=serializers.CharField())
    datasets = DatasetSerializer(many=True)


class MetricSnapshotTriggerRequestSerializer(serializers.Serializer):
    date = serializers.CharField(required=False, help_text="Target date for ETL in YYYY-MM-DD format")


class DashboardSummaryResponseSerializer(serializers.Serializer):
    # This serializer approximates the complex structure returned by AnalyticalService.get_dashboard_stats
    stats = serializers.DictField()
    distribution = serializers.DictField()
    recentActivity = serializers.ListField(child=serializers.DictField())


class DashboardPulseResponseSerializer(serializers.Serializer):
    class DeviceStatusSerializer(serializers.Serializer):
        online = serializers.IntegerField()
        total = serializers.IntegerField()

    class LogEntrySerializer(serializers.Serializer):
        employee_code = serializers.CharField()
        device = serializers.CharField()
        timestamp = serializers.DateTimeField()
        action = serializers.CharField()

    currentlyCheckedIn = serializers.IntegerField()
    deviceStatus = DeviceStatusSerializer()
    latestLogs = LogEntrySerializer(many=True)
    lastSync = serializers.DateTimeField(allow_null=True)


class SystemMonitorResponseSerializer(serializers.Serializer):
    class ResourcesSerializer(serializers.Serializer):
        cpuPercent = serializers.FloatField()
        memoryPercent = serializers.FloatField()
        diskPercent = serializers.FloatField()

    class ServiceStatusSerializer(serializers.Serializer):
        ok = serializers.BooleanField(required=False)
        configured = serializers.BooleanField(required=False)
        status = serializers.DictField(required=False)

    resources = ResourcesSerializer()
    services = serializers.DictField(child=ServiceStatusSerializer())


class AuditLogMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    action = serializers.CharField()
    model_name = serializers.CharField()
    object_id = serializers.CharField()
    created_at = serializers.DateTimeField()

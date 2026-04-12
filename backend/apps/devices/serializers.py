from datetime import timedelta
import re
from django.utils import timezone
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

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
    DeviceUserMapping,
)
from apps.employees.models import Employee


class LocalizedDeviceFieldsMixin:
    def _resolve_language(self) -> str:
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"


def _localize_device_log_message(message: str, language: str) -> str:
    text = str(message or "")
    if not text or not language.lower().startswith("ar"):
        return text

    exact_messages = {
        "Sync completed": "اكتملت المزامنة بنجاح.",
        "Device time synchronized.": "تمت مزامنة وقت الجهاز.",
        "Device rebooted.": "تمت إعادة تشغيل الجهاز.",
        "Device attendance logs cleared.": "تم مسح سجلات حضور الجهاز.",
        "Task worker is not configured.": "عامل المهام غير مهيأ.",
        "Attendance import request recorded.": "تم تسجيل طلب استيراد الحضور.",
        "Template distributed.": "تم توزيع القالب.",
        "SDK does not support template push.": "لا يدعم SDK إرسال القوالب.",
    }
    if text in exact_messages:
        return exact_messages[text]

    pattern_messages = [
        (
            r"^Synced (\d+) records, (\d+) new\.$",
            lambda match: f"تمت مزامنة {match.group(1)} سجلًا، وأضيف {match.group(2)} جديدًا.",
        ),
        (
            r"^Employee (.+) not found\.$",
            lambda match: f"لم يتم العثور على الموظف {match.group(1)}.",
        ),
        (
            r"^Employee (.+) pushed to device\.$",
            lambda match: f"تم إرسال الموظف {match.group(1)} إلى الجهاز.",
        ),
        (
            r"^Employee (.+) disabled on device\.$",
            lambda match: f"تم تعطيل الموظف {match.group(1)} على الجهاز.",
        ),
        (
            r"^Employee (.+) enabled on device\.$",
            lambda match: f"تم تفعيل الموظف {match.group(1)} على الجهاز.",
        ),
        (
            r"^Employee (.+) deleted from device\.$",
            lambda match: f"تم حذف الموظف {match.group(1)} من الجهاز.",
        ),
        (
            r"^Policy applied: (.+)$",
            lambda match: f"تم تطبيق السياسة: {match.group(1)}",
        ),
        (
            r"^Firmware rollout: (.+)$",
            lambda match: f"تحديث البرنامج الثابت: {match.group(1)}",
        ),
        (
            r"^Queued for ADMS delivery \((\d+) pending\)$",
            lambda match: f"تمت إضافة الأمر إلى قائمة ADMS ({match.group(1)} قيد الانتظار).",
        ),
        (
            r"^Failed to queue ADMS command: (.+)$",
            lambda match: f"فشل في صف أمر ADMS: {match.group(1)}",
        ),
        (
            r"^Failed to queue command: (.+)$",
            lambda match: f"فشل في صف الأمر: {match.group(1)}",
        ),
        (
            r"^Unable to reach device: (.+)$",
            lambda match: f"تعذر الوصول إلى الجهاز: {match.group(1)}",
        ),
    ]
    for pattern, formatter in pattern_messages:
        match = re.match(pattern, text)
        if match:
            return formatter(match)
    return text


def _localize_template_distribution_message(message: str, language: str) -> str:
    text = str(message or "")
    if not text or not language.lower().startswith("ar"):
        return text
    exact_messages = {
        "Template distributed.": "تم توزيع القالب.",
        "SDK does not support template push.": "لا يدعم SDK إرسال القوالب.",
    }
    return exact_messages.get(text, text)


class DeviceGroupSerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    deviceCount = serializers.SerializerMethodField()

    class Meta:
        model = DeviceGroup
        fields = ["id", "name", "description", "deviceCount", "created_at", "updated_at"]

    @extend_schema_field(serializers.IntegerField())
    def get_deviceCount(self, obj):
        if hasattr(obj, "device_total"):
            return int(obj.device_total or 0)
        return obj.devices.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["description"] = instance.get_localized_description(language)
        return data


class DevicePolicySerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    deviceCount = serializers.SerializerMethodField()

    class Meta:
        model = DevicePolicy
        fields = [
            "id",
            "name",
            "description",
            "timezone",
            "heartbeat_interval_seconds",
            "auto_sync_time",
            "verification_mode",
            "config",
            "deviceCount",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_deviceCount(self, obj):
        if hasattr(obj, "device_total"):
            return int(obj.device_total or 0)
        return obj.devices.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["description"] = instance.get_localized_description(language)
        return data


class DeviceSerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    serialNumber = serializers.CharField(source="serial_number")
    ipAddress = serializers.IPAddressField(source="ip_address")
    commKey = serializers.CharField(source="comm_key", allow_blank=True, required=False)
    modelName = serializers.CharField(source="model", allow_blank=True, required=False)
    employeeCount = serializers.IntegerField(source="employee_count", required=False)
    lastSync = serializers.DateTimeField(source="last_sync", read_only=True)
    lastSeen = serializers.DateTimeField(source="last_seen", read_only=True)
    lastHeartbeat = serializers.DateTimeField(source="last_heartbeat", read_only=True)
    groupId = serializers.PrimaryKeyRelatedField(source="group", queryset=DeviceGroup.objects.all(), required=False, allow_null=True)
    policyId = serializers.PrimaryKeyRelatedField(source="policy", queryset=DevicePolicy.objects.all(), required=False, allow_null=True)
    connectionMode = serializers.CharField(source="connection_mode", required=False)
    isPrimaryEnrollment = serializers.BooleanField(source="is_primary_enrollment", required=False)

    class Meta:
        model = Device
        fields = [
            "id",
            "name",
            "serialNumber",
            "ipAddress",
            "port",
            "commKey",
            "modelName",
            "firmware_version",
            "platform",
            "location",
            "status",
            "lastSync",
            "employeeCount",
            "lastSeen",
            "lastHeartbeat",
            "groupId",
            "policyId",
            "connectionMode",
            "isPrimaryEnrollment",
        ]

    def validate_commKey(self, value):
        from .utils.security import encrypt_comm_key

        return encrypt_comm_key(value)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["location"] = instance.get_localized_location(language)
        return data

    def validate(self, attrs):
        attrs = super().validate(attrs)
        serial_number = str(attrs.get("serial_number") or "").strip()
        if serial_number:
            qs = Device.objects.filter(serial_number__iexact=serial_number)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"serialNumber": "Device with this serial number already exists."})
        return attrs


class DeviceSyncLogSerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = DeviceSyncLog
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        if language == "en" and getattr(instance, "reason_en", ""):
            data["reason"] = instance.reason_en
        data["message"] = _localize_device_log_message(getattr(instance, "message", ""), language)
        return data


class DeviceUserMappingSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source="employee.name")
    employee_code = serializers.ReadOnlyField(source="employee.employee_code")

    class Meta:
        model = DeviceUserMapping
        fields = ["id", "device", "employee", "employee_name", "employee_code", "device_user_id", "created_at"]


class BiometricTemplateSerializer(serializers.ModelSerializer):
    employeeCode = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())
    sourceDeviceId = serializers.PrimaryKeyRelatedField(source="source_device", queryset=Device.objects.all(), required=False, allow_null=True)
    templateHash = serializers.CharField(source="template_hash", required=False, allow_blank=True)
    templateType = serializers.CharField(source="template_type", required=False)
    templateIndex = serializers.IntegerField(source="template_index", required=False, min_value=0)
    conflictStrategy = serializers.CharField(source="conflict_strategy", required=False)
    templateData = serializers.CharField(source="template_data")
    lastDistributedAt = serializers.DateTimeField(source="last_distributed_at", required=False, allow_null=True)
    isActive = serializers.BooleanField(source="is_active", required=False)

    class Meta:
        model = BiometricTemplate
        fields = [
            "id",
            "employeeCode",
            "sourceDeviceId",
            "templateType",
            "templateIndex",
            "templateData",
            "templateHash",
            "version",
            "conflictStrategy",
            "metadata",
            "isActive",
            "lastDistributedAt",
            "created_at",
            "updated_at",
        ]


class BiometricTemplateDistributionSerializer(serializers.ModelSerializer):
    templateId = serializers.PrimaryKeyRelatedField(source="template", queryset=BiometricTemplate.objects.all())
    deviceId = serializers.PrimaryKeyRelatedField(source="device", queryset=Device.objects.all())
    requestedByName = serializers.SerializerMethodField()

    class Meta:
        model = BiometricTemplateDistribution
        fields = [
            "id",
            "templateId",
            "deviceId",
            "requested_by",
            "requestedByName",
            "status",
            "message",
            "started_at",
            "finished_at",
        ]
        read_only_fields = ["status", "message", "started_at", "finished_at", "requestedByName"]

    @extend_schema_field(serializers.CharField())
    def get_requestedByName(self, obj):
        if not obj.requested_by:
            return ""
        full = f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip()
        return full or obj.requested_by.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = "en"
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        if not accept_language.lower().startswith("en"):
            language = "ar"
        data["message"] = _localize_template_distribution_message(getattr(instance, "message", ""), language)
        return data


class DeviceCommandApprovalSerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    deviceIds = serializers.PrimaryKeyRelatedField(source="target_devices", queryset=Device.objects.all(), many=True)
    requestedByName = serializers.SerializerMethodField()
    approvedByName = serializers.SerializerMethodField()
    rejectedByName = serializers.SerializerMethodField()

    class Meta:
        model = DeviceCommandApproval
        fields = [
            "id",
            "command",
            "payload",
            "reason",
            "status",
            "deviceIds",
            "requested_by",
            "requestedByName",
            "approved_by",
            "approvedByName",
            "rejected_by",
            "rejectedByName",
            "requested_at",
            "expires_at",
            "decided_at",
            "executed_at",
        ]
        read_only_fields = [
            "status",
            "requested_by",
            "approved_by",
            "rejected_by",
            "requested_at",
            "decided_at",
            "executed_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_requestedByName(self, obj):
        if not obj.requested_by:
            return ""
        full = f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip()
        return full or obj.requested_by.username

    @extend_schema_field(serializers.CharField())
    def get_approvedByName(self, obj):
        if not obj.approved_by:
            return ""
        full = f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip()
        return full or obj.approved_by.username

    @extend_schema_field(serializers.CharField())
    def get_rejectedByName(self, obj):
        if not obj.rejected_by:
            return ""
        full = f"{obj.rejected_by.first_name} {obj.rejected_by.last_name}".strip()
        return full or obj.requested_by.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self._resolve_language() == "en" and getattr(instance, "reason_en", ""):
            data["reason"] = instance.reason_en
        return data

    def create(self, validated_data):
        devices = validated_data.pop("target_devices", [])
        requested_by = validated_data.pop("requested_by", None)
        request = self.context.get("request")
        if requested_by is None and request and request.user and request.user.is_authenticated:
            requested_by = request.user
        approval = DeviceCommandApproval.objects.create(
            requested_by=requested_by,
            **validated_data,
        )
        if devices:
            approval.target_devices.set(devices)
        if approval.expires_at is None:
            approval.expires_at = timezone.now() + timedelta(minutes=30)
            approval.save(update_fields=["expires_at"])
        return approval


class DeviceFirmwareRolloutSerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    deviceGroupId = serializers.PrimaryKeyRelatedField(source="device_group", queryset=DeviceGroup.objects.all(), required=False, allow_null=True)
    requestedByName = serializers.SerializerMethodField()

    class Meta:
        model = DeviceFirmwareRollout
        fields = [
            "id",
            "target_version",
            "deviceGroupId",
            "notes",
            "rollout_plan",
            "results",
            "status",
            "requested_by",
            "requestedByName",
            "created_at",
            "started_at",
            "finished_at",
        ]
        read_only_fields = ["results", "status", "requested_by", "requestedByName", "created_at", "started_at", "finished_at"]

    @extend_schema_field(serializers.CharField())
    def get_requestedByName(self, obj):
        if not obj.requested_by:
            return ""
        full = f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip()
        return full or obj.requested_by.username

    def create(self, validated_data):
        request = self.context.get("request")
        return DeviceFirmwareRollout.objects.create(
            requested_by=request.user if request and request.user and request.user.is_authenticated else None,
            **validated_data,
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self._resolve_language() == "en" and getattr(instance, "notes_en", ""):
            data["notes"] = instance.notes_en
        return data


class DeviceBackupSnapshotSerializer(LocalizedDeviceFieldsMixin, serializers.ModelSerializer):
    deviceId = serializers.PrimaryKeyRelatedField(source="device", queryset=Device.objects.all(), required=False, allow_null=True)
    deviceGroupId = serializers.PrimaryKeyRelatedField(source="device_group", queryset=DeviceGroup.objects.all(), required=False, allow_null=True)
    createdByName = serializers.SerializerMethodField()
    name_en = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = DeviceBackupSnapshot
        fields = [
            "id",
            "name",
            "name_en",
            "scope",
            "deviceId",
            "deviceGroupId",
            "payload",
            "created_by",
            "createdByName",
            "created_at",
            "restored_at",
        ]
        read_only_fields = ["payload", "created_by", "createdByName", "created_at", "restored_at"]

    @extend_schema_field(serializers.CharField())
    def get_createdByName(self, obj):
        if not obj.created_by:
            return ""
        full = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return full or obj.created_by.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        if data.get("scope") == "device":
            data["scope"] = "single"
        return data


class DeviceCommandResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    taskId = serializers.CharField(required=False, allow_blank=True)
    log = DeviceSyncLogSerializer()


class HeartbeatRequestSerializer(serializers.Serializer):
    serialNumber = serializers.CharField()
    ipAddress = serializers.IPAddressField(required=False)
    port = serializers.IntegerField(required=False)
    commKey = serializers.CharField(required=False, allow_blank=True)
    modelName = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False)


class HeartbeatResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    created = serializers.BooleanField()
    deviceId = serializers.CharField()


class DiscoverRequestSerializer(serializers.Serializer):
    ipAddress = serializers.IPAddressField()
    port = serializers.IntegerField(required=False, default=4370)
    commKey = serializers.CharField(required=False, allow_blank=True)


class DiscoverResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    serialNumber = serializers.CharField()
    modelName = serializers.CharField()
    deviceName = serializers.CharField()


class TestConnectionResponseSerializer(serializers.Serializer):
    reachable = serializers.BooleanField()
    detail = serializers.CharField(required=False)
    serialNumber = serializers.CharField(required=False)
    modelName = serializers.CharField(required=False)
    deviceName = serializers.CharField(required=False)


class HealthReportResponseSerializer(serializers.Serializer):
    class SummarySerializer(serializers.Serializer):
        totalDevices = serializers.IntegerField()
        onlineDevices = serializers.IntegerField()
        offlineDevices = serializers.IntegerField()
        totalCommands = serializers.IntegerField()
        failedCommands = serializers.IntegerField()
        averageFailureRatePercent = serializers.FloatField()

    summary = SummarySerializer()

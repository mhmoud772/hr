from django.db import models


class DeviceGroup(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    name_en = models.CharField(max_length=120, blank=True)
    description_en = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

    def get_localized_description(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.description_en:
            return self.description_en
        return self.description


class DevicePolicy(models.Model):
    VERIFICATION_MODE_CHOICES = (
        ("any", "Any"),
        ("fingerprint", "Fingerprint"),
        ("face", "Face"),
        ("card", "Card"),
    )
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    name_en = models.CharField(max_length=120, blank=True)
    description_en = models.TextField(blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    heartbeat_interval_seconds = models.PositiveIntegerField(default=180)
    auto_sync_time = models.BooleanField(default=True)
    verification_mode = models.CharField(max_length=20, choices=VERIFICATION_MODE_CHOICES, default="any")
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

    def get_localized_description(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.description_en:
            return self.description_en
        return self.description


class Device(models.Model):
    STATUS_CHOICES = (
        ("online", "Online"),
        ("offline", "Offline"),
    )
    CONNECTION_MODE_CHOICES = (
        ("sdk", "SDK Pull"),
        ("adms", "ADMS Push"),
    )
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, blank=True)
    serial_number = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    port = models.PositiveIntegerField(default=4370)
    comm_key = models.TextField(blank=True)
    model = models.CharField(max_length=100, blank=True)
    firmware_version = models.CharField(max_length=100, blank=True)
    platform = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255)
    location_en = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="offline")
    last_sync = models.DateTimeField(null=True, blank=True)
    employee_count = models.PositiveIntegerField(default=0)
    last_seen = models.DateTimeField(null=True, blank=True)
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    group = models.ForeignKey(DeviceGroup, null=True, blank=True, on_delete=models.SET_NULL, related_name="devices")
    department = models.ForeignKey("employees.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="devices")
    policy = models.ForeignKey(DevicePolicy, null=True, blank=True, on_delete=models.SET_NULL, related_name="devices")
    connection_mode = models.CharField(max_length=20, choices=CONNECTION_MODE_CHOICES, default="sdk")
    is_primary_enrollment = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

    def get_localized_location(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.location_en:
            return self.location_en
        return self.location


class DeviceUserMapping(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="user_mappings")
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="device_user_mappings")
    device_user_id = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device_id", "device_user_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["device", "device_user_id"],
                name="uniq_dev_user_map",
            )
        ]


class DeviceSyncLog(models.Model):
    STATUS_CHOICES = (
        ("success", "Success"),
        ("failed", "Failed"),
        ("running", "Running"),
    )
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="sync_logs")
    command = models.CharField(max_length=40, blank=True)
    requested_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    reason = models.CharField(max_length=255, blank=True)
    reason_en = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)


class DeviceCommandApproval(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
        ("executed", "Executed"),
    )
    command = models.CharField(max_length=40)
    payload = models.JSONField(default=dict, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    reason_en = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    requested_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="dev_cmd_req")
    approved_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="dev_cmd_appr")
    rejected_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="dev_cmd_rej")
    target_devices = models.ManyToManyField(Device, related_name="command_approvals", blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)


class BiometricTemplate(models.Model):
    TEMPLATE_TYPE_CHOICES = (
        ("fingerprint", "Fingerprint"),
        ("face", "Face"),
        ("card", "Card"),
    )
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="biometric_templates")
    source_device = models.ForeignKey(Device, null=True, blank=True, on_delete=models.SET_NULL, related_name="source_templates")
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES, default="fingerprint")
    template_index = models.PositiveIntegerField(default=0)
    template_data = models.TextField()
    template_hash = models.CharField(max_length=64, db_index=True)
    version = models.PositiveIntegerField(default=1)
    conflict_strategy = models.CharField(max_length=50, default="last_write_wins")
    metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    last_distributed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class BiometricTemplateDistribution(models.Model):
    STATUS_CHOICES = (
        ("queued", "Queued"),
        ("success", "Success"),
        ("failed", "Failed"),
    )
    template = models.ForeignKey(BiometricTemplate, on_delete=models.CASCADE, related_name="distributions")
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="template_distributions")
    requested_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)


class DeviceFirmwareRollout(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )
    target_version = models.CharField(max_length=100)
    device_group = models.ForeignKey(DeviceGroup, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True)
    notes_en = models.TextField(blank=True)
    rollout_plan = models.JSONField(default=dict, blank=True)
    results = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    requested_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)


class DeviceBackupSnapshot(models.Model):
    SCOPE_CHOICES = (
        ("single", "Single"),
        ("group", "Group"),
        ("global", "Global"),
    )
    name = models.CharField(max_length=120)
    name_en = models.CharField(max_length=120, blank=True)
    scope = models.CharField(max_length=50, choices=SCOPE_CHOICES, default="single")
    device = models.ForeignKey(Device, null=True, blank=True, on_delete=models.SET_NULL)
    device_group = models.ForeignKey(DeviceGroup, null=True, blank=True, on_delete=models.SET_NULL)
    payload = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    restored_at = models.DateTimeField(null=True, blank=True)

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

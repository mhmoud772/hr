from django.db import models


class Shift(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    grace_period_minutes = models.PositiveIntegerField(default=15)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class EmployeeShift(models.Model):
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="shifts")
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name="employee_shifts")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date"]


class Attendance(models.Model):
    STATUS_CHOICES = (
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
    )
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="attendance")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["employee", "date"], name="uniq_emp_att_date"),
        ]
        indexes = [
            models.Index(fields=["date"], name="idx_att_date"),
            models.Index(fields=["status"], name="idx_att_status"),
        ]


class AttendanceImportLog(models.Model):
    STATUS_CHOICES = (
        ("success", "Success"),
        ("failed", "Failed"),
        ("running", "Running"),
    )
    source = models.CharField(max_length=100, default="device")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class BiometricLog(models.Model):
    ACTION_CHOICES = (
        ("check_in", "Check In"),
        ("check_out", "Check Out"),
    )
    device = models.ForeignKey("devices.Device", on_delete=models.CASCADE, related_name="biometric_logs")
    employee_code = models.CharField(max_length=50)
    timestamp = models.DateTimeField()
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        constraints = [
            models.UniqueConstraint(
                fields=["device", "employee_code", "timestamp", "action"],
                name="uniq_bio_log_device_emp_ts_act",
            ),
        ]

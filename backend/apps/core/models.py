from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("system_admin", "System Admin"),
        ("hr_manager", "HR Manager"),
        ("supervisor", "Supervisor"),
        ("employee", "Employee"),
        ("admin", "Admin"),
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="employee")
    must_change_password = models.BooleanField(default=False)
    permissions = models.JSONField(default=list, blank=True)


class Department(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")
    manager_name = models.CharField(max_length=255, blank=True)
    manager = models.ForeignKey(
        "Employee",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_departments",
    )
    sort_order = models.PositiveIntegerField(default=0)
    employee_count = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return self.name


class JobTitle(models.Model):
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, blank=True)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    level = models.CharField(max_length=50)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    employee_count = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name


class Employee(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("leave", "On Leave"),
        ("inactive", "Inactive"),
    )
    name = models.CharField(max_length=255)
    employee_code = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    job_title = models.ForeignKey(JobTitle, null=True, blank=True, on_delete=models.SET_NULL)
    hire_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    avatar = models.ImageField(upload_to="employees/", null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    CONTRACT_CHOICES = (
        ("permanent", "Permanent"),
        ("contract", "Contract"),
        ("probation", "Probation"),
        ("terminated", "Terminated"),
    )
    contract_status = models.CharField(max_length=20, choices=CONTRACT_CHOICES, default="permanent")

    def __str__(self) -> str:
        return self.name


class Attendance(models.Model):
    STATUS_CHOICES = (
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
    )
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="attendance")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["employee", "date"], name="uniq_employee_attendance_date"),
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


class Leave(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leaves")
    leave_type = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.PositiveIntegerField(default=1)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    requested_by = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_requests")
    approved_by = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_approvals")
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_rejections")
    rejected_at = models.DateTimeField(null=True, blank=True)


class LeaveAttachment(models.Model):
    leave = models.ForeignKey(Leave, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="leave_attachments/")
    uploaded_by = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class LeaveApproval(models.Model):
    STATUS_CHOICES = (
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )
    leave = models.ForeignKey(Leave, on_delete=models.CASCADE, related_name="approvals")
    approver = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    comment = models.TextField(blank=True)
    level = models.PositiveIntegerField(default=1)
    decided_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-decided_at"]


class LeaveBalance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leave_balances")
    leave_type = models.CharField(max_length=50)
    total_days = models.PositiveIntegerField(default=0)
    used_days = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("employee", "leave_type")


class Device(models.Model):
    STATUS_CHOICES = (
        ("online", "Online"),
        ("offline", "Offline"),
    )
    name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="offline")
    last_sync = models.DateTimeField(null=True, blank=True)
    employee_count = models.PositiveIntegerField(default=0)
    last_seen = models.DateTimeField(null=True, blank=True)


class EmployeeDocument(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=100, blank=True)
    file = models.FileField(upload_to="employee_documents/")
    notes = models.TextField(blank=True)
    uploaded_by = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class BiometricLog(models.Model):
    ACTION_CHOICES = (
        ("check_in", "Check In"),
        ("check_out", "Check Out"),
    )
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="biometric_logs")
    employee_code = models.CharField(max_length=50)
    timestamp = models.DateTimeField()
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]


class Settings(models.Model):
    company_settings = models.JSONField(default=dict)
    attendance_settings = models.JSONField(default=dict)
    leave_settings = models.JSONField(default=dict)
    notification_settings = models.JSONField(default=dict)
    general_settings = models.JSONField(default=dict)

    def __str__(self) -> str:
        return "Settings"


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    )
    user = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64)
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Notification(models.Model):
    CHANNEL_CHOICES = (
        ("app", "In-App"),
        ("email", "Email"),
        ("sms", "SMS"),
    )
    STATUS_CHOICES = (
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    )
    recipient = models.ForeignKey("User", null=True, blank=True, on_delete=models.SET_NULL)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="app")
    title = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class NotificationRead(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="notification_reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("notification", "user")


class DeviceSyncLog(models.Model):
    STATUS_CHOICES = (
        ("success", "Success"),
        ("failed", "Failed"),
        ("running", "Running"),
    )
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="sync_logs")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]


class PayrollRecord(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("approved", "Approved"),
        ("paid", "Paid"),
    )
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="payroll_records")
    period_start = models.DateField()
    period_end = models.DateField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.net_salary:
            self.net_salary = (self.base_salary or 0) + (self.allowances or 0) - (self.deductions or 0)
        super().save(*args, **kwargs)


class RecruitmentCandidate(models.Model):
    STATUS_CHOICES = (
        ("applied", "Applied"),
        ("screening", "Screening"),
        ("interview", "Interview"),
        ("offered", "Offered"),
        ("hired", "Hired"),
        ("rejected", "Rejected"),
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    position = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="applied")
    source = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)


class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="performance_reviews")
    period = models.CharField(max_length=50)
    rating = models.PositiveSmallIntegerField(default=3)
    reviewer = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class TrainingRecord(models.Model):
    STATUS_CHOICES = (
        ("planned", "Planned"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="training_records")
    title = models.CharField(max_length=255)
    provider = models.CharField(max_length=255, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")
    notes = models.TextField(blank=True)


class Asset(models.Model):
    STATUS_CHOICES = (
        ("available", "Available"),
        ("assigned", "Assigned"),
        ("maintenance", "Maintenance"),
        ("retired", "Retired"),
    )
    name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    assigned_to = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL)
    assigned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

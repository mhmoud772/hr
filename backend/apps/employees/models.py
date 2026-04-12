from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, blank=True)
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

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
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

    class Meta:
        indexes = [
            models.Index(fields=["status"], name="idx_emp_status"),
            models.Index(fields=["department_id"], name="idx_emp_dept"),
            models.Index(fields=["employee_code"], name="idx_emp_code"),
            models.Index(fields=["email"], name="idx_emp_email"),
        ]

    def __str__(self) -> str:
        return self.name


class EmployeeDocument(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255, blank=True)
    doc_type = models.CharField(max_length=100, blank=True)
    doc_type_en = models.CharField(max_length=100, blank=True)
    file = models.FileField(upload_to="employee_documents/")
    notes = models.TextField(blank=True)
    notes_en = models.TextField(blank=True)
    uploaded_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def get_localized_title(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.title_en:
            return self.title_en
        return self.title

    def get_localized_doc_type(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.doc_type_en:
            return self.doc_type_en
        return self.doc_type


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
    reason_en = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    requested_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_requests")
    approved_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_approvals")
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_rejections")
    rejected_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"], name="idx_leave_st"),
            models.Index(fields=["employee", "status"], name="idx_leave_emp_st"),
            models.Index(fields=["start_date", "end_date"], name="idx_leave_dt"),
        ]

    def get_localized_reason(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.reason_en:
            return self.reason_en
        return self.reason


class LeaveAttachment(models.Model):
    leave = models.ForeignKey(Leave, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="leave_attachments/")
    uploaded_by = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class LeaveApproval(models.Model):
    STATUS_CHOICES = (
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )
    leave = models.ForeignKey(Leave, on_delete=models.CASCADE, related_name="approvals")
    approver = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    comment = models.TextField(blank=True)
    level = models.PositiveIntegerField(default=1)
    decided_at = models.DateTimeField(auto_now_add=True)


class LeaveBalance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leave_balances")
    leave_type = models.CharField(max_length=50)
    total_days = models.PositiveIntegerField(default=0)
    used_days = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("employee", "leave_type")


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
    position_en = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="applied")
    source = models.CharField(max_length=255, blank=True)
    source_en = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    notes_en = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-applied_at", "-id"]

    def get_localized_position(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.position_en:
            return self.position_en
        return self.position

    def get_localized_source(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.source_en:
            return self.source_en
        return self.source


class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="performance_reviews")
    period = models.CharField(max_length=50)
    rating = models.PositiveSmallIntegerField(default=3)
    reviewer = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True)
    notes_en = models.TextField(blank=True)
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
    title_en = models.CharField(max_length=255, blank=True)
    provider = models.CharField(max_length=255, blank=True)
    provider_en = models.CharField(max_length=255, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")
    notes = models.TextField(blank=True)
    notes_en = models.TextField(blank=True)

    class Meta:
        ordering = ["-id"]

    def get_localized_title(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.title_en:
            return self.title_en
        return self.title

    def get_localized_provider(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.provider_en:
            return self.provider_en
        return self.provider


class Asset(models.Model):
    STATUS_CHOICES = (
        ("available", "Available"),
        ("assigned", "Assigned"),
        ("maintenance", "Maintenance"),
        ("retired", "Retired"),
    )
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, blank=True)
    serial_number = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=255, blank=True)
    category_en = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    assigned_to = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL)
    assigned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    notes_en = models.TextField(blank=True)

    class Meta:
        ordering = ["-id"]

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

    def get_localized_category(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.category_en:
            return self.category_en
        return self.category


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

from django.db import models

class AnalyticalMetric(models.Model):
    """
    Legacy metric storage for simple key-value pairs over periods.
    """
    METRIC_TYPES = (
        ("attendance_rate", "Attendance Rate"),
        ("late_rate", "Late Rate"),
        ("leave_requests", "Leave Requests"),
        ("payroll_total", "Payroll Total"),
        ("headcount", "Headcount"),
    )
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    scope = models.CharField(max_length=50, default="global")
    scope_id = models.IntegerField(null=True, blank=True)
    value = models.FloatField()
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-period_start"]
        indexes = [
            models.Index(fields=["metric_type", "period_start"], name="idx_metric_type_dt"),
        ]

class DailyDashboardSnapshot(models.Model):
    """
    Aggregated daily KPIs for the main dashboard.
    Primary source for 'at-a-glance' metrics.
    """
    date = models.DateField(unique=True)
    total_employees = models.IntegerField(default=0)
    present_today = models.IntegerField(default=0)
    absent_today = models.IntegerField(default=0)
    pending_leaves = models.IntegerField(default=0)
    critical_leaves = models.IntegerField(default=0)
    adherence_rate = models.FloatField(default=0.0)
    average_late_minutes = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Daily Dashboard Snapshot"

class DepartmentDistributionSnapshot(models.Model):
    """
    Snapshot of employee counts by department for a specific date.
    """
    date = models.DateField()
    department_name = models.CharField(max_length=255)
    employee_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-employee_count"]
        unique_together = ("date", "department_name")
        verbose_name = "Department Distribution Snapshot"

class SystemActivityFact(models.Model):
    """
    Fact table capturing significant system events (attendance, leaves)
    in a denormalized format for the Activity Feed.
    """
    date = models.DateField()
    activity_id = models.CharField(max_length=255, unique=True)
    employee_name = models.CharField(max_length=255)
    action = models.CharField(max_length=255)
    time = models.DateTimeField()
    activity_type = models.CharField(max_length=50) # 'attendance', 'leave', etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-time"]
        indexes = [
            models.Index(fields=["date", "-time"], name="idx_activity_date_time"),
            models.Index(fields=["activity_type", "date"], name="idx_activity_type_dt"),
        ]

class MetricTrendFact(models.Model):
    """
    Fact table storing periodic metrics for trend analysis (weekly/monthly).
    """
    PERIOD_CHOICES = (
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
    )
    metric_name = models.CharField(max_length=100)
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    value = models.FloatField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-start_date", "metric_name"]
        indexes = [
            models.Index(fields=["metric_name", "period_type", "start_date"], name="idx_trend_metric_lookup"),
        ]

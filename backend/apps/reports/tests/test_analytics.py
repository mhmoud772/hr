from datetime import date, datetime, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.attendance.models import Attendance
from apps.devices.models import Device
from apps.attendance.models import BiometricLog
from apps.employees.models import Department, Employee
from apps.reports.models import AnalyticalMetric, SystemActivityFact
from apps.reports.services.analytical_service import AnalyticalService

User = get_user_model()


class AnalyticalServiceTests(TestCase):
    databases = "__all__"

    def setUp(self):
        self.department = Department.objects.create(
            name="الموارد البشرية",
            name_en="Human Resources",
        )
        self.emp = Employee.objects.create(
            employee_code="ANALYTIC_001",
            name="Analytic User",
            email="analytic@test.com",
            hire_date=date.today() - timedelta(days=10),
            department=self.department,
        )
        Attendance.objects.create(employee=self.emp, date=date.today(), status="present")
        Attendance.objects.create(
            employee=self.emp,
            date=date.today() - timedelta(days=1),
            status="absent",
        )

    def test_dashboard_stats_aggregation(self):
        # Run ETL first to populate the analytical store
        AnalyticalService.run_etl_pipeline(date.today())
        stats = AnalyticalService.get_dashboard_stats(days_range=7)
        self.assertEqual(stats["totalEmployees"], 1)
        self.assertEqual(stats["presentToday"], 1)

    def test_compute_daily_snapshot(self):
        target = date.today() - timedelta(days=1)
        AnalyticalService.run_etl_pipeline(target)

        metric = AnalyticalMetric.objects.filter(
            metric_type="attendance_rate",
            period_start=target,
        ).first()
        self.assertIsNotNone(metric)
        self.assertEqual(metric.value, 0.0)  # 1 emp, but absent

    def test_dashboard_metrics_ignore_inactive_employees_and_count_leave_status(self):
        inactive_emp = Employee.objects.create(
            employee_code="ANALYTIC_003",
            name="Inactive User",
            email="inactive@test.com",
            hire_date=date.today() - timedelta(days=20),
            status="inactive",
        )
        leave_emp = Employee.objects.create(
            employee_code="ANALYTIC_004",
            name="Leave User",
            email="leave@test.com",
            hire_date=date.today() - timedelta(days=20),
            status="leave",
        )
        Attendance.objects.create(employee=inactive_emp, date=date.today(), status="present")
        Attendance.objects.create(employee=leave_emp, date=date.today(), status="present")

        AnalyticalService.run_etl_pipeline(date.today())
        stats = AnalyticalService.get_dashboard_stats(days_range=7)

        self.assertEqual(stats["totalEmployees"], 2)
        self.assertEqual(stats["presentToday"], 2)
        self.assertEqual(stats["absentToday"], 0)

    def test_etl_pipeline_is_idempotent_for_activity_facts(self):
        AnalyticalService.run_etl_pipeline(date.today())
        AnalyticalService.run_etl_pipeline(date.today())

        activity_ids = list(
            SystemActivityFact.objects.filter(date=date.today())
            .values_list("activity_id", flat=True)
        )

        self.assertEqual(len(activity_ids), len(set(activity_ids)))

    def test_dashboard_stats_localize_department_distribution_and_recent_activity(self):
        AnalyticalService.run_etl_pipeline(date.today())

        stats = AnalyticalService.get_dashboard_stats(days_range=7, language="en")

        self.assertEqual(stats["departmentDistribution"][0]["name"], "Human Resources")
        self.assertEqual(stats["recentActivities"][0]["action"], "Checked in")


class AnalyticsAPITests(APITestCase):
    databases = "__all__"

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin_an",
            password="pass",
            email="a@b.com",
        )
        self.admin.role = "system_admin"
        self.admin.save()
        self.client.force_authenticate(user=self.admin)

        self.emp = Employee.objects.create(
            employee_code="ANALYTIC_002",
            name="Analytic User 2",
            email="analytic2@test.com",
            hire_date=date.today() - timedelta(days=10),
            department=Department.objects.create(name="العمليات", name_en="Operations"),
        )

    def test_dashboard_summary_endpoint(self):
        # Populate analytical store first
        AnalyticalService.run_etl_pipeline(date.today())
        url = reverse("dashboard-summary")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("totalEmployees", response.data)

    def test_attendance_trends_endpoint(self):
        AnalyticalService.run_etl_pipeline(date.today() - timedelta(days=1))

        url = reverse("analytics-trends")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data["labels"]) >= 1)

    def test_attendance_trends_endpoint_accepts_reports_read_permission(self):
        user = User.objects.create_user(
            username="analytics_reader",
            password="pass",
            email="reader@example.com",
            role="employee",
        )
        user.permissions_list = ["reports.read"]
        user.save(update_fields=["permissions_list"])
        self.client.force_authenticate(user=user)

        url = reverse("analytics-trends")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_summary_endpoint_respects_accept_language(self):
        Attendance.objects.create(employee=self.emp, date=date.today(), status="present")
        AnalyticalService.run_etl_pipeline(date.today())

        response = self.client.get(reverse("dashboard-summary"), HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["departmentDistribution"][0]["name"], "Operations")
        self.assertEqual(response.data["recentActivities"][0]["action"], "Checked in")

    def test_dashboard_pulse_localizes_device_name(self):
        device = Device.objects.create(
            name="بوابة المقر",
            name_en="HQ Gate",
            serial_number="PULSE-001",
            ip_address="192.168.10.10",
            location="المقر",
            location_en="Headquarters",
            status="online",
        )
        BiometricLog.objects.create(
            device=device,
            employee_code="ANALYTIC_002",
            timestamp=timezone.make_aware(datetime.combine(date.today(), datetime.min.time()).replace(hour=8)),
            action="check_in",
        )

        response = self.client.get(reverse("dashboard-pulse"), HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["latestLogs"][0]["device"], "HQ Gate")

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.attendance.models import Attendance
from apps.employees.models import Employee
from apps.reports.models import AnalyticalMetric
from apps.reports.services.analytical_service import AnalyticalService

User = get_user_model()


class AnalyticalServiceTests(TestCase):
    databases = "__all__"

    def setUp(self):
        self.emp = Employee.objects.create(
            employee_code="ANALYTIC_001",
            name="Analytic User",
            email="analytic@test.com",
            hire_date=date.today() - timedelta(days=10),
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

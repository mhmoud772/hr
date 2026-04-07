from datetime import date
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.attendance.models import Attendance, AttendanceImportLog
from apps.employees.models import Employee

User = get_user_model()

class AttendanceCompatibilityTests(APITestCase):
    def setUp(self):
        self.hr_user = User.objects.create_user(
            username="compat_hr_att",
            password="Test12345!",
            role="hr_manager",
            email="compat-hr-att@example.com",
        )
        self.employee = Employee.objects.create(
            employee_code="COMPAT_ATT_001",
            name="Compat Attendance Employee",
            email="compat-att-emp@example.com",
            status="active",
        )
        Attendance.objects.create(
            employee=self.employee,
            date=date.today(),
            status="present",
        )
        AttendanceImportLog.objects.create(
            source="device",
            status="success",
            message="Seed import log",
        )

    def test_attendance_compat_list_and_summary_endpoints(self):
        self.client.force_authenticate(self.hr_user)

        list_response = self.client.get("/api/attendance/?page=1")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        summary_response = self.client.get(
            f"/api/attendance/summary/?date={date.today().isoformat()}"
        )
        self.assertEqual(summary_response.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_response.data["total"], 1)
        self.assertEqual(summary_response.data["present"], 1)

    def test_attendance_import_compat_endpoints(self):
        self.client.force_authenticate(self.hr_user)

        history_response = self.client.get("/api/import-logs/")
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(history_response.data.get("results", [])), 1)

        import_response = self.client.post(
            "/api/attendance/import_logs/",
            {"source": "device"},
            format="json",
        )
        self.assertEqual(import_response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(import_response.data["source"], "device")

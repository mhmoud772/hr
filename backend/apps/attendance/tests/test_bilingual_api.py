from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.attendance.models import EmployeeShift, Shift
from apps.employees.models import Department, Employee, JobTitle

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class AttendanceBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="attendance_admin",
            password="Admin12345!",
            role="system_admin",
            email="attendance-admin@example.com",
        )
        self.client.force_authenticate(user=self.admin)
        department = Department.objects.create(name="الموارد البشرية", name_en="Human Resources")
        job_title = JobTitle.objects.create(name="أخصائي موارد بشرية", name_en="HR Specialist", department=department, level="mid")
        employee = Employee.objects.create(
            name="منى علي",
            employee_code="EMP-SHIFT-001",
            email="shift-employee@example.com",
            department=department,
            job_title=job_title,
            status="active",
        )
        self.shift = Shift.objects.create(
            name="الوردية الصباحية",
            name_en="Morning Shift",
            description="الوردية الأساسية خلال ساعات الدوام الصباحية.",
            description_en="Core working hours in the morning.",
            start_time="08:00",
            end_time="16:00",
            grace_period_minutes=15,
        )
        self.employee_shift = EmployeeShift.objects.create(
            employee=employee,
            shift=self.shift,
            start_date="2026-01-01",
        )

    def test_shifts_and_employee_shifts_return_localized_english_fields(self):
        shifts_response = self.client.get("/api/shifts/", HTTP_ACCEPT_LANGUAGE="en")
        employee_shifts_response = self.client.get("/api/employee-shifts/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(shifts_response.status_code, status.HTTP_200_OK)
        self.assertEqual(employee_shifts_response.status_code, status.HTTP_200_OK)
        shift_item = _results(shifts_response.data)[0]
        employee_shift_item = _results(employee_shifts_response.data)[0]

        self.assertEqual(shift_item["name"], "Morning Shift")
        self.assertEqual(shift_item["description"], "Core working hours in the morning.")
        self.assertEqual(employee_shift_item["shift_name"], "Morning Shift")

    def test_shift_search_matches_english_translation(self):
        response = self.client.get("/api/shifts/", {"search": "Morning"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["name"], "Morning Shift")

    def test_attendance_import_logs_return_localized_messages(self):
        response_en = self.client.post(
            "/api/attendance/import_logs/",
            {"source": "device"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="en",
        )
        response_ar = self.client.post(
            "/api/attendance/import_logs/",
            {"source": "device"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )

        self.assertEqual(response_en.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response_ar.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response_en.data["message"], "Attendance import request recorded.")
        self.assertEqual(response_ar.data["message"], "تم تسجيل طلب استيراد الحضور.")

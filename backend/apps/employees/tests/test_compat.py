from datetime import date
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.attendance.models import Attendance
from apps.employees.models import Employee, Leave

User = get_user_model()

class EmployeeCompatibilityTests(APITestCase):
    def setUp(self):
        self.employee_user = User.objects.create_user(
            username="compat_emp_me",
            password="Test12345!",
            role="employee",
            email="compat-emp-me@example.com",
        )
        self.employee = Employee.objects.create(
            employee_code="COMPAT_EMP_001",
            name="Compat Me Employee",
            email="compat-emp-me@example.com",
            status="active",
        )
        Attendance.objects.create(
            employee=self.employee,
            date=date.today(),
            status="present",
        )
        Leave.objects.create(
            employee=self.employee,
            leave_type="annual",
            start_date=date.today(),
            end_date=date.today(),
            days=1,
            status="pending",
        )

    def test_employee_me_and_summary_endpoints(self):
        self.client.force_authenticate(self.employee_user)

        me_response = self.client.get("/api/employees/me/")
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["employeeCode"], "COMPAT_EMP_001")

        summary_response = self.client.get(f"/api/employees/{self.employee.id}/summary/")
        self.assertEqual(summary_response.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_response.data["attendance"]["present"], 1)
        self.assertEqual(summary_response.data["leaves"]["pending"], 1)

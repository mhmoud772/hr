from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.employees.models import Employee, LeaveBalance

User = get_user_model()

class LeaveCompatibilityTests(APITestCase):
    def setUp(self):
        self.employee_user = User.objects.create_user(
            username="compat_emp_lv",
            password="Test12345!",
            role="employee",
            email="compat-emp-lv@example.com",
        )
        self.employee = Employee.objects.create(
            employee_code="COMPAT_LV_001",
            name="Compat Leave Employee",
            email="compat-emp-lv@example.com",
            status="active",
        )
        LeaveBalance.objects.create(
            employee=self.employee,
            leave_type="annual",
            total_days=21,
            used_days=3,
        )

    def test_leave_balances_compat_endpoint(self):
        self.client.force_authenticate(self.employee_user)

        response = self.client.get(f"/api/leave-balances/?employee={self.employee.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["leave_type"], "annual")

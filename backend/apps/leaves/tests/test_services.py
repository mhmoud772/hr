from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.employees.models import Employee, Leave, LeaveBalance
from apps.employees.services.leave_service import LeaveService

User = get_user_model()

class LeaveServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="test_serv_leave", password="pass")
        self.employee = Employee.objects.create(
            employee_code="E_LEAVE_001",
            name="Leave Test Employee",
            email="leave@example.com",
            status="active"
        )
        # Setup balance
        self.balance = LeaveBalance.objects.create(
            employee=self.employee,
            leave_type="annual",
            total_days=30,
            used_days=0
        )

    def test_create_leave_request_success(self):
        start = date.today() + timedelta(days=10)
        end = start + timedelta(days=2)
        leave = LeaveService.create_leave_request(
            employee=self.employee,
            leave_type="annual",
            start_date=start,
            end_date=end,
            requested_by=self.user
        )
        self.assertEqual(leave.status, "pending")
        self.assertEqual(leave.days, 3)

    def test_overlap_prevents_creation(self):
        start = date.today() + timedelta(days=10)
        end = start + timedelta(days=2)
        LeaveService.create_leave_request(self.employee, "annual", start, end, requested_by=self.user)
        
        with self.assertRaises(ValueError):
            LeaveService.create_leave_request(self.employee, "annual", start, end, requested_by=self.user)

    def test_approve_updates_balance(self):
        start = date.today() + timedelta(days=10)
        end = start + timedelta(days=2)
        leave = LeaveService.create_leave_request(self.employee, "annual", start, end, requested_by=self.user)
        
        LeaveService.approve_leave(leave, user=self.user)
        
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.used_days, 3)
        self.assertEqual(leave.status, "approved")

from datetime import date
from django.test import TestCase
from apps.employees.models import Employee, PayrollRecord
from apps.employees.services.payroll_service import PayrollService

class PayrollServiceTests(TestCase):
    def setUp(self):
        self.emp1 = Employee.objects.create(employee_code="P_PAY_001", name="E1", email="e1_pay@example.com", salary=1000, status="active")
        self.emp2 = Employee.objects.create(employee_code="P_PAY_002", name="E2", email="e2_pay@example.com", salary=2000, status="active")

    def test_generate_payroll(self):
        start = date(2026, 1, 1)
        end = date(2026, 1, 31)
        count = PayrollService.generate_payroll_for_period(
            period_start=start,
            period_end=end
        )
        self.assertEqual(count, 2)
        rec1 = PayrollRecord.objects.filter(employee=self.emp1).first()
        self.assertIsNotNone(rec1)
        self.assertEqual(rec1.net_salary, 1000)

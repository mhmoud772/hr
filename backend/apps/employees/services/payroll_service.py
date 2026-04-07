from decimal import Decimal

from django.db import transaction

from apps.employees.models import Employee, PayrollRecord
from shared.logging import StructuredLogger

logger = StructuredLogger(__name__)


class PayrollService:
    @staticmethod
    def calculate_net_salary(base_salary, allowances=0, deductions=0):
        return Decimal(base_salary) + Decimal(allowances) - Decimal(deductions)

    @staticmethod
    def generate_payroll_for_period(employee_id=None, department_id=None, period_start=None, period_end=None):
        employees = Employee.objects.filter(status="active")
        if employee_id:
            employees = employees.filter(employee_code=employee_id)
        if department_id:
            employees = employees.filter(department_id=department_id)

        records_created = 0
        with transaction.atomic():
            for emp in employees:
                exists = PayrollRecord.objects.filter(
                    employee=emp,
                    period_start=period_start,
                    period_end=period_end,
                ).exists()
                if exists:
                    continue

                base_salary = emp.salary or 0
                allowances = 0
                deductions = 0
                net_salary = PayrollService.calculate_net_salary(base_salary, allowances, deductions)

                PayrollRecord.objects.create(
                    employee=emp,
                    period_start=period_start,
                    period_end=period_end,
                    base_salary=base_salary,
                    allowances=allowances,
                    deductions=deductions,
                    net_salary=net_salary,
                    status="draft",
                )
                records_created += 1

        logger.info(
            "Payroll generated",
            count=records_created,
            period_start=period_start,
            period_end=period_end,
        )
        return records_created

    @staticmethod
    def approve_payroll(payroll_record, user):
        payroll_record.status = "approved"
        payroll_record.save(update_fields=["status"])
        logger.info("Payroll approved", payroll_id=payroll_record.id, approver=user.username)
        return payroll_record

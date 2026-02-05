from __future__ import annotations

from datetime import date, timedelta
import os
from random import choice, randint

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.core.models import (
    Asset,
    Attendance,
    Department,
    Device,
    Leave,
    LeaveBalance,
    JobTitle,
    PayrollRecord,
    RecruitmentCandidate,
    TrainingRecord,
    PerformanceReview,
    Employee,
)


class Command(BaseCommand):
    help = "Seed demo data for local testing."

    def handle(self, *args, **options):
        User = get_user_model()

        admin_user, admin_created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "role": "system_admin", "must_change_password": False},
        )
        admin_seed_password = os.getenv("SEED_ADMIN_PASSWORD") or ("admin123" if admin_created else None)
        if admin_seed_password:
            admin_user.set_password(admin_seed_password)
            admin_user.save(update_fields=["password"])

        hr_user, hr_created = User.objects.get_or_create(
            username="hr",
            defaults={"email": "hr@example.com", "role": "hr_manager", "must_change_password": False},
        )
        hr_seed_password = os.getenv("SEED_HR_PASSWORD") or ("hr123456" if hr_created else None)
        if hr_seed_password:
            hr_user.set_password(hr_seed_password)
            hr_user.save(update_fields=["password"])

        employee_user, employee_created = User.objects.get_or_create(
            username="employee",
            defaults={"email": "employee@example.com", "role": "employee", "must_change_password": False},
        )
        employee_seed_password = os.getenv("SEED_EMPLOYEE_PASSWORD") or ("employee123" if employee_created else None)
        if employee_seed_password:
            employee_user.set_password(employee_seed_password)
            employee_user.save(update_fields=["password"])

        departments = [
            Department.objects.get_or_create(name="HR")[0],
            Department.objects.get_or_create(name="Operations")[0],
            Department.objects.get_or_create(name="Engineering")[0],
            Department.objects.get_or_create(name="Finance")[0],
        ]

        job_titles = [
            JobTitle.objects.get_or_create(name="HR Specialist", level="mid", department=departments[0])[0],
            JobTitle.objects.get_or_create(name="Operations Lead", level="senior", department=departments[1])[0],
            JobTitle.objects.get_or_create(name="Software Engineer", level="mid", department=departments[2])[0],
            JobTitle.objects.get_or_create(name="Accountant", level="junior", department=departments[3])[0],
        ]

        employee, _ = Employee.objects.get_or_create(
            employee_code="EMP-0001",
            defaults={
                "name": "Mona Ali",
                "email": "employee@example.com",
                "phone": "+966500000001",
                "department": departments[0],
                "job_title": job_titles[0],
                "hire_date": date.today() - timedelta(days=420),
                "status": "active",
                "salary": 8500,
                "contract_status": "permanent",
            },
        )

        for idx in range(2, 9):
            Employee.objects.get_or_create(
                employee_code=f"EMP-{idx:04d}",
                defaults={
                    "name": f"Employee {idx}",
                    "email": f"employee{idx}@example.com",
                    "phone": f"+9665000000{idx:02d}",
                    "department": choice(departments),
                    "job_title": choice(job_titles),
                    "hire_date": date.today() - timedelta(days=randint(90, 900)),
                    "status": choice(["active", "leave", "inactive"]),
                    "salary": randint(5000, 15000),
                    "contract_status": choice(["permanent", "contract", "probation"]),
                },
            )

        Device.objects.get_or_create(
            serial_number="DEV-001",
            defaults={"name": "Front Gate", "ip_address": "10.0.0.10", "location": "HQ", "status": "online"},
        )
        Device.objects.get_or_create(
            serial_number="DEV-002",
            defaults={"name": "Warehouse", "ip_address": "10.0.0.11", "location": "Warehouse", "status": "offline"},
        )

        for day_offset in range(10):
            target_date = date.today() - timedelta(days=day_offset)
            for emp in Employee.objects.all()[:6]:
                Attendance.objects.get_or_create(
                    employee=emp,
                    date=target_date,
                    defaults={
                        "status": choice(["present", "late", "absent"]),
                        "check_in": timezone.now().time(),
                        "check_out": timezone.now().time(),
                    },
                )

        leave_types = ["annual", "sick", "unpaid"]
        for emp in Employee.objects.all()[:5]:
            Leave.objects.get_or_create(
                employee=emp,
                start_date=date.today() + timedelta(days=randint(1, 20)),
                end_date=date.today() + timedelta(days=randint(21, 30)),
                defaults={
                    "leave_type": choice(leave_types),
                    "days": randint(1, 5),
                    "reason": "Family reasons",
                    "status": choice(["pending", "approved", "rejected"]),
                    "requested_by": hr_user,
                },
            )
            for leave_type in leave_types:
                LeaveBalance.objects.get_or_create(
                    employee=emp,
                    leave_type=leave_type,
                    defaults={"total_days": 30, "used_days": randint(0, 10)},
                )

        for emp in Employee.objects.all()[:5]:
            PayrollRecord.objects.get_or_create(
                employee=emp,
                period_start=date.today().replace(day=1),
                period_end=date.today(),
                defaults={
                    "base_salary": emp.salary or 0,
                    "allowances": 500,
                    "deductions": 150,
                    "status": choice(["draft", "approved", "paid"]),
                },
            )

        RecruitmentCandidate.objects.get_or_create(
            name="Sara Ibrahim",
            defaults={
                "email": "sara@example.com",
                "phone": "+966500000099",
                "position": "Data Analyst",
                "status": "interview",
                "source": "LinkedIn",
            },
        )

        for emp in Employee.objects.all()[:3]:
            PerformanceReview.objects.get_or_create(
                employee=emp,
                period="2025",
                defaults={"rating": randint(3, 5), "reviewer": hr_user, "notes": "Strong contributor."},
            )

            TrainingRecord.objects.get_or_create(
                employee=emp,
                title="Leadership Basics",
                defaults={"provider": "HR Academy", "status": "in_progress"},
            )

        for idx, asset_name in enumerate(["Laptop", "Phone", "Access Card"], start=1):
            Asset.objects.get_or_create(
                name=f"{asset_name} {idx}",
                defaults={
                    "serial_number": f"AST-{idx:03d}",
                    "category": asset_name,
                    "status": "assigned",
                    "assigned_to": employee,
                    "assigned_at": timezone.now(),
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))

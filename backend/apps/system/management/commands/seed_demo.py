from __future__ import annotations

from datetime import date, timedelta
import os
from random import choice, randint

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.employees.models import (
    Asset,
    Department,
    JobTitle,
    Employee,
    Leave,
    LeaveBalance,
    PayrollRecord,
    RecruitmentCandidate,
    TrainingRecord,
    PerformanceReview,
)
from apps.attendance.models import Attendance
from apps.devices.models import Device


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
            Department.objects.get_or_create(name="\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629")[0],
            Department.objects.get_or_create(name="\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a")[0],
            Department.objects.get_or_create(name="\u0627\u0644\u0647\u0646\u062f\u0633\u0629")[0],
            Department.objects.get_or_create(name="\u0627\u0644\u0645\u0627\u0644\u064a\u0629")[0],
        ]

        job_titles = [
            JobTitle.objects.get_or_create(
                name="\u0623\u062e\u0635\u0627\u0626\u064a \u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629",
                defaults={"name_en": "HR Specialist", "level": "mid", "department": departments[0]},
            )[0],
            JobTitle.objects.get_or_create(
                name="\u0642\u0627\u0626\u062f \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a",
                defaults={"name_en": "Operations Lead", "level": "senior", "department": departments[1]},
            )[0],
            JobTitle.objects.get_or_create(
                name="\u0645\u0647\u0646\u062f\u0633 \u0628\u0631\u0645\u062c\u064a\u0627\u062a",
                defaults={"name_en": "Software Engineer", "level": "mid", "department": departments[2]},
            )[0],
            JobTitle.objects.get_or_create(
                name="\u0645\u062d\u0627\u0633\u0628",
                defaults={"name_en": "Accountant", "level": "junior", "department": departments[3]},
            )[0],
        ]

        employee, _ = Employee.objects.get_or_create(
            employee_code="EMP-0001",
            defaults={
                "name": "\u0645\u0646\u0649 \u0639\u0644\u064a",
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
                    "name": f"\u0645\u0648\u0638\u0641 {idx}",
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
            defaults={
                "name": "\u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064a\u0629",
                "ip_address": "10.0.0.10",
                "location": "\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u0631\u0626\u064a\u0633\u064a",
                "status": "online",
            },
        )
        Device.objects.get_or_create(
            serial_number="DEV-002",
            defaults={
                "name": "\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639",
                "ip_address": "10.0.0.11",
                "location": "\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639",
                "status": "offline",
            },
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
                    "reason": "\u0638\u0631\u0648\u0641 \u0639\u0627\u0626\u0644\u064a\u0629",
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
            name="\u0633\u0627\u0631\u0629 \u0625\u0628\u0631\u0627\u0647\u064a\u0645",
            defaults={
                "email": "sara@example.com",
                "phone": "+966500000099",
                "position": "\u0645\u062d\u0644\u0644 \u0628\u064a\u0627\u0646\u0627\u062a",
                "status": "interview",
                "source": "\u0644\u064a\u0646\u0643\u062f\u0625\u0646",
            },
        )

        for emp in Employee.objects.all()[:3]:
            PerformanceReview.objects.get_or_create(
                employee=emp,
                period="2025",
                defaults={
                    "rating": randint(3, 5),
                    "reviewer": hr_user,
                    "notes": "\u064a\u0642\u062f\u0645 \u0625\u0633\u0647\u0627\u0645\u0627\u062a \u0642\u0648\u064a\u0629 \u0648\u0645\u0633\u062a\u0642\u0631\u0629.",
                },
            )

            TrainingRecord.objects.get_or_create(
                employee=emp,
                title="\u0623\u0633\u0627\u0633\u064a\u0627\u062a \u0627\u0644\u0642\u064a\u0627\u062f\u0629",
                defaults={
                    "provider": "\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629",
                    "status": "in_progress",
                },
            )

        for idx, asset_name in enumerate(
            [
                "\u062d\u0627\u0633\u0628 \u0645\u062d\u0645\u0648\u0644",
                "\u0647\u0627\u062a\u0641",
                "\u0628\u0637\u0627\u0642\u0629 \u062f\u062e\u0648\u0644",
            ],
            start=1,
        ):
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

        call_command("seed_policies")

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))

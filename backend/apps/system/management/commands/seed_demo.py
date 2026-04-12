from __future__ import annotations

import os
from datetime import date, timedelta
from random import Random

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.attendance.models import Attendance, EmployeeShift, Shift
from apps.devices.models import Device, DeviceBackupSnapshot
from apps.employees.models import (
    Asset,
    Department,
    Employee,
    EmployeeDocument,
    JobTitle,
    Leave,
    LeaveBalance,
    PayrollRecord,
    PerformanceReview,
    RecruitmentCandidate,
    TrainingRecord,
)
from apps.system.models import Settings
from apps.notifications.models import Notification


ENGLISH_DEMO = {
    "company_name": "HR Companion Demo Company",
    "department_translations": [
        ("\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629", "Human Resources"),
        ("\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a", "Operations"),
        ("\u0627\u0644\u0647\u0646\u062f\u0633\u0629", "Engineering"),
        ("\u0627\u0644\u0645\u0627\u0644\u064a\u0629", "Finance"),
    ],
    "departments": [
        "Human Resources",
        "Operations",
        "Engineering",
        "Finance",
    ],
    "job_title_translations": [
        ("\u0623\u062e\u0635\u0627\u0626\u064a \u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629", "HR Specialist", "mid", 0),
        ("\u0642\u0627\u0626\u062f \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a", "Operations Lead", "senior", 1),
        ("\u0645\u0647\u0646\u062f\u0633 \u0628\u0631\u0645\u062c\u064a\u0627\u062a", "Software Engineer", "mid", 2),
        ("\u0645\u062d\u0627\u0633\u0628", "Accountant", "junior", 3),
    ],
    "job_titles": [
        ("HR Specialist", "mid", 0),
        ("Operations Lead", "senior", 1),
        ("Software Engineer", "mid", 2),
        ("Accountant", "junior", 3),
    ],
    "primary_employee": "Mona Ali",
    "employee_prefix": "Employee",
    "device_translations": [
        ("البوابة الأمامية", "Front Gate", "المقر الرئيسي", "Headquarters"),
        ("المستودع", "Warehouse Scanner", "المستودع", "Warehouse"),
    ],
    "shift_translations": [
        ("الوردية الصباحية", "Morning Shift", "الوردية الأساسية خلال ساعات الدوام الصباحية.", "Core working hours in the morning."),
        ("الوردية المسائية", "Evening Shift", "وردية تغطي النصف الثاني من اليوم.", "Shift covering the second half of the day."),
    ],
    "leave_reason": "Family commitments",
    "candidate": {
        "name": "Sara Ibrahim",
        "position": "Data Analyst",
        "position_ar": "محلل بيانات",
        "source": "LinkedIn",
        "source_ar": "لينكدإن",
    },
    "performance_note": "Consistently delivers reliable work and contributes strong team outcomes.",
    "training_title": "Leadership Essentials",
    "training_title_ar": "أساسيات القيادة",
    "training_provider": "HR Academy",
    "training_provider_ar": "أكاديمية الموارد البشرية",
    "assets_translations": [
        ("حاسب محمول", "Laptop", "معدات تقنية", "IT Equipment"),
        ("هاتف", "Phone", "جهاز محمول", "Mobile Device"),
        ("بطاقة دخول", "Access Card", "الوصول الأمني", "Access Control"),
    ],
    "notifications": [
        (
            "تنبيه الحضور اليومي",
            "Daily attendance alert",
            "يرجى مراجعة الحضور والانصراف لهذا اليوم.",
            "Please review today's attendance status.",
        ),
    ],
    "general_language": "en",
}

ARABIC_DEMO = {
    "company_name": "\u0631\u0641\u064a\u0642 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a",
    "department_translations": [
        ("\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629", "Human Resources"),
        ("\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a", "Operations"),
        ("\u0627\u0644\u0647\u0646\u062f\u0633\u0629", "Engineering"),
        ("\u0627\u0644\u0645\u0627\u0644\u064a\u0629", "Finance"),
    ],
    "departments": [
        "\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629",
        "\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a",
        "\u0627\u0644\u0647\u0646\u062f\u0633\u0629",
        "\u0627\u0644\u0645\u0627\u0644\u064a\u0629",
    ],
    "job_title_translations": [
        ("\u0623\u062e\u0635\u0627\u0626\u064a \u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629", "HR Specialist", "mid", 0),
        ("\u0642\u0627\u0626\u062f \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a", "Operations Lead", "senior", 1),
        ("\u0645\u0647\u0646\u062f\u0633 \u0628\u0631\u0645\u062c\u064a\u0627\u062a", "Software Engineer", "mid", 2),
        ("\u0645\u062d\u0627\u0633\u0628", "Accountant", "junior", 3),
    ],
    "job_titles": [
        ("\u0623\u062e\u0635\u0627\u0626\u064a \u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629", "mid", 0),
        ("\u0642\u0627\u0626\u062f \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a", "senior", 1),
        ("\u0645\u0647\u0646\u062f\u0633 \u0628\u0631\u0645\u062c\u064a\u0627\u062a", "mid", 2),
        ("\u0645\u062d\u0627\u0633\u0628", "junior", 3),
    ],
    "primary_employee": "\u0645\u0646\u0649 \u0639\u0644\u064a",
    "employee_prefix": "\u0645\u0648\u0638\u0641",
    "device_translations": [
        ("\u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064a\u0629", "Front Gate", "\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u0631\u0626\u064a\u0633\u064a", "Headquarters"),
        ("\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639", "Warehouse Scanner", "\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639", "Warehouse"),
    ],
    "shift_translations": [
        ("\u0627\u0644\u0648\u0631\u062f\u064a\u0629 \u0627\u0644\u0635\u0628\u0627\u062d\u064a\u0629", "Morning Shift", "\u0627\u0644\u0648\u0631\u062f\u064a\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u062e\u0644\u0627\u0644 \u0633\u0627\u0639\u0627\u062a \u0627\u0644\u062f\u0648\u0627\u0645 \u0627\u0644\u0635\u0628\u0627\u062d\u064a\u0629.", "Core working hours in the morning."),
        ("\u0627\u0644\u0648\u0631\u062f\u064a\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u064a\u0629", "Evening Shift", "\u0648\u0631\u062f\u064a\u0629 \u062a\u063a\u0637\u064a \u0627\u0644\u0646\u0635\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0645\u0646 \u0627\u0644\u064a\u0648\u0645.", "Shift covering the second half of the day."),
    ],
    "leave_reason": "\u0638\u0631\u0648\u0641 \u0639\u0627\u0626\u0644\u064a\u0629",
    "candidate": {
        "name": "\u0633\u0627\u0631\u0629 \u0625\u0628\u0631\u0627\u0647\u064a\u0645",
        "position": "\u0645\u062d\u0644\u0644 \u0628\u064a\u0627\u0646\u0627\u062a",
        "position_en": "Data Analyst",
        "source": "\u0644\u064a\u0646\u0643\u062f\u0625\u0646",
        "source_en": "LinkedIn",
    },
    "performance_note": "\u064a\u0642\u062f\u0645 \u0625\u0633\u0647\u0627\u0645\u0627\u062a \u0642\u0648\u064a\u0629 \u0648\u0645\u0633\u062a\u0642\u0631\u0629.",
    "training_title": "\u0623\u0633\u0627\u0633\u064a\u0627\u062a \u0627\u0644\u0642\u064a\u0627\u062f\u0629",
    "training_title_en": "Leadership Essentials",
    "training_provider": "\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629",
    "training_provider_en": "HR Academy",
    "assets_translations": [
        ("\u062d\u0627\u0633\u0628 \u0645\u062d\u0645\u0648\u0644", "Laptop", "\u0645\u0639\u062f\u0627\u062a \u062a\u0642\u0646\u064a\u0629", "IT Equipment"),
        ("\u0647\u0627\u062a\u0641", "Phone", "\u062c\u0647\u0627\u0632 \u0645\u062d\u0645\u0648\u0644", "Mobile Device"),
        ("\u0628\u0637\u0627\u0642\u0629 \u062f\u062e\u0648\u0644", "Access Card", "\u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0623\u0645\u0646\u064a", "Access Control"),
    ],
    "notifications": [
        (
            "\u062a\u0646\u0628\u064a\u0647 \u0627\u0644\u062d\u0636\u0648\u0631 \u0627\u0644\u064a\u0648\u0645\u064a",
            "Daily attendance alert",
            "\u064a\u0631\u062c\u0649 \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u062d\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0646\u0635\u0631\u0627\u0641 \u0644\u0647\u0630\u0627 \u0627\u0644\u064a\u0648\u0645.",
            "Please review today's attendance status.",
        ),
    ],
    "general_language": "ar",
}

class Command(BaseCommand):
    help = "Seed demo data for local testing."

    def handle(self, *args, **options):
        locale = (os.getenv("SEED_DEMO_LOCALE") or "en").lower()
        seed = ARABIC_DEMO if locale.startswith("ar") else ENGLISH_DEMO
        other_seed = ENGLISH_DEMO if seed is ARABIC_DEMO else ARABIC_DEMO
        rng = Random(42)
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

        departments: list[Department] = []
        for index, (department_name_ar, department_name_en) in enumerate(seed["department_translations"]):
            department = Department.objects.filter(name=department_name_ar).first()
            if department is None:
                department = Department()
            department.name = department_name_ar
            department.name_en = department_name_en
            department.sort_order = index
            department.manager_name = ""
            department.save()
            departments.append(department)

        job_titles: list[JobTitle] = []
        for job_name_ar, job_name_en, level, department_index in seed["job_title_translations"]:
            job_title = JobTitle.objects.filter(name=job_name_ar).first()
            if job_title is None:
                job_title = JobTitle()
            job_title.name = job_name_ar
            job_title.name_en = job_name_en
            job_title.level = level
            job_title.department = departments[department_index]
            job_title.save()
            job_titles.append(job_title)

        employee, _ = Employee.objects.update_or_create(
            employee_code="EMP-0001",
            defaults={
                "name": seed["primary_employee"],
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

        Employee.objects.update_or_create(
            employee_code="admin",
            defaults={
                "name": "Admin User",
                "email": "admin@example.com",
                "phone": "+966500000009",
                "department": departments[0],
                "job_title": job_titles[0],
                "hire_date": date.today() - timedelta(days=365),
                "status": "active",
                "salary": 12000,
                "contract_status": "permanent",
            },
        )

        statuses = ["active", "leave", "inactive"]
        contracts = ["permanent", "contract", "probation"]
        for idx in range(2, 9):
            Employee.objects.update_or_create(
                employee_code=f"EMP-{idx:04d}",
                defaults={
                    "name": f"{seed['employee_prefix']} {idx}",
                    "email": f"employee{idx}@example.com",
                    "phone": f"+9665000000{idx:02d}",
                    "department": departments[(idx - 2) % len(departments)],
                    "job_title": job_titles[(idx - 2) % len(job_titles)],
                    "hire_date": date.today() - timedelta(days=120 + idx * 37),
                    "status": statuses[rng.randrange(len(statuses))],
                    "salary": 5500 + idx * 850,
                    "contract_status": contracts[rng.randrange(len(contracts))],
                },
            )

        for device_index, (device_name_ar, device_name_en, location_ar, location_en) in enumerate(seed["device_translations"], start=1):
            Device.objects.update_or_create(
                serial_number=f"DEV-00{device_index}",
                defaults={
                    "name": device_name_ar,
                    "name_en": device_name_en,
                    "ip_address": f"10.0.0.1{device_index - 1}",
                    "location": location_ar,
                    "location_en": location_en,
                    "status": "online" if device_index == 1 else "offline",
                },
            )

        attendance_employees = list(Employee.objects.exclude(status="inactive").order_by("id")[:6])
        shifts = []
        shift_times = [("08:00", "16:00"), ("16:00", "00:00")]
        for index, (name_ar, name_en, description_ar, description_en) in enumerate(seed["shift_translations"]):
            start_time, end_time = shift_times[index % len(shift_times)]
            shift, _ = Shift.objects.update_or_create(
                name=name_ar,
                defaults={
                    "name_en": name_en,
                    "description": description_ar,
                    "description_en": description_en,
                    "start_time": start_time,
                    "end_time": end_time,
                    "grace_period_minutes": 15,
                },
            )
            shifts.append(shift)

        for index, emp in enumerate(attendance_employees):
            EmployeeShift.objects.update_or_create(
                employee=emp,
                shift=shifts[index % len(shifts)],
                start_date=date.today() - timedelta(days=30),
                defaults={"end_date": None},
            )

        attendance_statuses = ["present", "late", "absent"]
        now = timezone.localtime()
        for day_offset in range(10):
            target_date = date.today() - timedelta(days=day_offset)
            for index, emp in enumerate(attendance_employees):
                Attendance.objects.update_or_create(
                    employee=emp,
                    date=target_date,
                    defaults={
                        "status": attendance_statuses[(day_offset + index) % len(attendance_statuses)],
                        "check_in": now.time(),
                        "check_out": now.time(),
                    },
                )

        leave_types = ["annual", "sick", "unpaid"]
        statuses = ["pending", "approved", "rejected"]
        for index, emp in enumerate(Employee.objects.all()[:5]):
            start_date = date.today() + timedelta(days=2 + index * 3)
            end_date = start_date + timedelta(days=2 + (index % 3))
            Leave.objects.update_or_create(
                employee=emp,
                start_date=start_date,
                end_date=end_date,
                defaults={
                    "leave_type": leave_types[index % len(leave_types)],
                    "days": (end_date - start_date).days + 1,
                    "reason": seed["leave_reason"],
                    "reason_en": other_seed["leave_reason"],
                    "status": statuses[index % len(statuses)],
                    "requested_by": hr_user,
                },
            )
            for leave_type in leave_types:
                LeaveBalance.objects.update_or_create(
                    employee=emp,
                    leave_type=leave_type,
                    defaults={"total_days": 30, "used_days": (index + len(leave_type)) % 11},
                )

        for emp in Employee.objects.all()[:5]:
            PayrollRecord.objects.update_or_create(
                employee=emp,
                period_start=date.today().replace(day=1),
                period_end=date.today(),
                defaults={
                    "base_salary": emp.salary or 0,
                    "allowances": 500,
                    "deductions": 150,
                    "status": "approved",
                },
            )

        RecruitmentCandidate.objects.update_or_create(
            email="sara@example.com",
            defaults={
                "name": seed["candidate"]["name"],
                "phone": "+966500000099",
                "position": seed["candidate"].get("position_ar", seed["candidate"]["position"]),
                "position_en": seed["candidate"].get("position_en", seed["candidate"]["position"]),
                "status": "interview",
                "source": seed["candidate"].get("source_ar", seed["candidate"]["source"]),
                "source_en": seed["candidate"].get("source_en", seed["candidate"]["source"]),
                "notes": "Shortlisted after screening and first interview." if locale.startswith("en") else "تم ترشيحها بعد الفرز والمقابلة الأولى.",
                "notes_en": "تم ترشيحها بعد الفرز والمقابلة الأولى." if locale.startswith("en") else "Shortlisted after screening and first interview.",
            },
        )

        for index, emp in enumerate(Employee.objects.all()[:3]):
            PerformanceReview.objects.update_or_create(
                employee=emp,
                period="2025",
                defaults={
                    "rating": 3 + (index % 3),
                    "reviewer": hr_user,
                    "notes": seed["performance_note"],
                    "notes_en": other_seed["performance_note"],
                },
            )
            TrainingRecord.objects.update_or_create(
                employee=emp,
                title=seed.get("training_title_ar", seed["training_title"]),
                defaults={
                    "title_en": seed.get("training_title_en", seed["training_title"]),
                    "provider": seed.get("training_provider_ar", seed["training_provider"]),
                    "provider_en": seed.get("training_provider_en", seed["training_provider"]),
                    "status": "in_progress",
                    "notes": "Completed the first training module." if locale.startswith("en") else "أكمل الوحدة التدريبية الأولى.",
                    "notes_en": "أكمل الوحدة التدريبية الأولى." if locale.startswith("en") else "Completed the first training module.",
                },
            )

        for index, (asset_name_ar, asset_name_en, category_ar, category_en) in enumerate(seed["assets_translations"], start=1):
            Asset.objects.update_or_create(
                serial_number=f"AST-{index:03d}",
                defaults={
                    "name": f"{asset_name_ar} {index}",
                    "name_en": f"{asset_name_en} {index}",
                    "category": category_ar,
                    "category_en": category_en,
                    "status": "assigned",
                    "assigned_to": employee,
                    "assigned_at": timezone.now(),
                    "notes": "Assigned for daily operations." if locale.startswith("en") else "مخصص للاستخدام اليومي.",
                    "notes_en": "مخصص للاستخدام اليومي." if locale.startswith("en") else "Assigned for daily operations.",
                },
            )

        document = EmployeeDocument.objects.filter(employee=employee, title="عقد العمل").first()
        if document is None:
            document = EmployeeDocument(employee=employee, title="عقد العمل")
        document.title_en = "Employment Contract"
        document.doc_type = "عقد"
        document.doc_type_en = "Contract"
        document.notes = "Signed copy of the employment contract." if locale.startswith("en") else "نسخة موقعة من عقد العمل."
        document.notes_en = "نسخة موقعة من عقد العمل." if locale.startswith("en") else "Signed copy of the employment contract."
        document.uploaded_by = admin_user
        if not document.file:
            document.file.save("employment-contract.txt", ContentFile("Employment contract demo file."), save=False)
        document.save()

        primary_device = Device.objects.order_by("id").first()
        if primary_device:
            DeviceBackupSnapshot.objects.update_or_create(
                name="نسخة احتياطية للأجهزة",
                defaults={
                    "name_en": "Device backup snapshot",
                    "scope": "single",
                    "device": primary_device,
                    "device_group": primary_device.group,
                    "created_by": admin_user,
                    "payload": {
                        "createdAt": timezone.now().isoformat(),
                        "scope": "single",
                        "deviceCount": 1,
                        "devices": [
                            {
                                "id": primary_device.id,
                                "name": primary_device.name,
                                "name_en": primary_device.name_en,
                                "serial_number": primary_device.serial_number,
                                "ip_address": primary_device.ip_address,
                                "port": primary_device.port,
                                "model": primary_device.model,
                                "firmware_version": primary_device.firmware_version,
                                "platform": primary_device.platform,
                                "location": primary_device.location,
                                "location_en": primary_device.location_en,
                                "status": primary_device.status,
                                "group_id": primary_device.group_id,
                                "policy_id": primary_device.policy_id,
                                "connection_mode": primary_device.connection_mode,
                                "is_primary_enrollment": primary_device.is_primary_enrollment,
                            }
                        ],
                    },
                },
            )

        for title_ar, title_en, body_ar, body_en in seed["notifications"]:
            Notification.objects.update_or_create(
                recipient=admin_user,
                channel="app",
                title=title_ar,
                defaults={
                    "title_en": title_en,
                    "body": body_ar,
                    "body_en": body_en,
                    "status": "sent",
                },
            )

        settings_obj, _ = Settings.objects.get_or_create(pk=1)
        general_settings = dict(settings_obj.general_settings or {})
        general_settings["language"] = seed["general_language"]
        settings_obj.general_settings = general_settings
        settings_obj.save(update_fields=["general_settings", "updated_at"])

        call_command("seed_policies")

        self.stdout.write(self.style.SUCCESS(f"Demo data seeded for locale: {seed['general_language']}"))

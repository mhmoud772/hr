import csv
import io

from django.db.models import Q

from apps.attendance.models import Attendance
from apps.employees.models import Department, Employee, JobTitle, Leave
from shared.logging import get_service_logger

logger = get_service_logger("employee")


class EmployeeService:
    @staticmethod
    def get_employee_for_user(user):
        if not user or not user.is_authenticated:
            return None
        if getattr(user, "email", None):
            employee = Employee.objects.filter(email__iexact=user.email).first()
            if employee:
                return employee
        employee = Employee.objects.filter(employee_code=user.username).first()
        if employee:
            return employee

        email = user.email or f"{user.username}@example.com"
        name = f"{user.first_name} {user.last_name}".strip() or user.username
        return Employee.objects.create(
            employee_code=user.username,
            name=name,
            email=email,
            status="active",
        )

    @staticmethod
    def get_department_scope_for_user(user):
        role = getattr(user, "role", "employee")
        if role in ("system_admin", "admin", "hr_manager"):
            return None
        if role == "supervisor":
            managed = Department.objects.filter(manager__email__iexact=user.email)
            if managed.exists():
                return managed

            emp = Employee.objects.select_related("department").filter(
                Q(email__iexact=getattr(user, "email", ""))
                | Q(employee_code=getattr(user, "username", ""))
            ).first()
            if emp and emp.department:
                return Department.objects.filter(pk=emp.department.pk)

            managed_departments = Department.objects.filter(manager__isnull=False).order_by("id")
            if managed_departments.count() == 1:
                return managed_departments
        return None

    @staticmethod
    def get_employee_summary(employee):
        attendance = Attendance.objects.filter(employee=employee)
        leaves = Leave.objects.filter(employee=employee)
        return {
            "attendance": {
                "present": attendance.filter(status="present").count(),
                "absent": attendance.filter(status="absent").count(),
                "late": attendance.filter(status="late").count(),
            },
            "leaves": {
                "pending": leaves.filter(status="pending").count(),
                "approved": leaves.filter(status="approved").count(),
                "rejected": leaves.filter(status="rejected").count(),
            },
        }

    @staticmethod
    def export_employees_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "employee_code",
                "name",
                "email",
                "phone",
                "department",
                "job_title",
                "hire_date",
                "status",
                "nationality",
                "birth_date",
                "address",
                "salary",
                "contract_status",
            ]
        )

        for emp in Employee.objects.select_related("department", "job_title").all():
            writer.writerow(
                [
                    emp.employee_code,
                    emp.name,
                    emp.email,
                    emp.phone,
                    emp.department.name if emp.department else "",
                    emp.job_title.name if emp.job_title else "",
                    emp.hire_date.isoformat() if emp.hire_date else "",
                    emp.status,
                    emp.nationality,
                    emp.birth_date.isoformat() if emp.birth_date else "",
                    emp.address,
                    str(emp.salary),
                    emp.contract_status,
                ]
            )
        return output.getvalue()

    @staticmethod
    def import_employees_from_csv(file_content):
        decoded = file_content.decode("utf-8").splitlines()
        reader = csv.DictReader(decoded)
        created = 0
        updated = 0
        for row in reader:
            code = row.get("employee_code") or row.get("id")
            if not code:
                continue

            dept_name = row.get("department", "")
            job_name = row.get("job_title", "")
            dept, _ = (
                Department.objects.get_or_create(name=dept_name)
                if dept_name
                else (None, False)
            )
            job, _ = (
                JobTitle.objects.get_or_create(name=job_name)
                if job_name
                else (None, False)
            )

            defaults = {
                "name": row.get("name", ""),
                "email": row.get("email", ""),
                "phone": row.get("phone", ""),
                "department": dept,
                "job_title": job,
                "status": row.get("status", "active"),
                "nationality": row.get("nationality", ""),
                "address": row.get("address", ""),
                "contract_status": row.get("contract_status", "permanent"),
            }
            for field in ["hire_date", "birth_date", "salary"]:
                value = row.get(field)
                if value:
                    defaults[field] = value

            _employee, created_flag = Employee.objects.update_or_create(
                employee_code=code,
                defaults=defaults,
            )
            if created_flag:
                created += 1
            else:
                updated += 1

        logger.info("Imported employees from CSV", created=created, updated=updated)
        return created, updated

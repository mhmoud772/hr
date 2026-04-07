"""
tests/test_rls.py — اختبارات Row-Level Security الشاملة
تضمن أن:
- الموظف العادي يرى بياناته فقط
- المشرف يرى موظفي قسمه فقط
- الـ HR Manager يرى كل شيء
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.employees.models import Department, Employee, Leave
from apps.attendance.models import Attendance

User = get_user_model()


def make_user(username, role, email=None):
    email = email or f"{username}@test.com"
    return User.objects.create_user(
        username=username,
        password="Test12345!",
        role=role,
        email=email,
    )


def make_employee(code, name, email, department=None):
    return Employee.objects.create(
        employee_code=code,
        name=name,
        email=email,
        department=department,
        status="active",
    )


def get_token(client, username, password="Test12345!"):
    resp = client.post(
        reverse("login"),
        {"username": username, "password": password},
        format="json",
    )
    return resp.data.get("accessToken", "")


class RLSEmployeeViewSetTest(APITestCase):
    """اختبار RLS على /api/employees/"""

    def setUp(self):
        # أقسام
        self.dept_marketing = Department.objects.create(name="Marketing")
        self.dept_sales = Department.objects.create(name="Sales")

        # مستخدمون
        self.hr_user = make_user("hr_manager1", "hr_manager", "hr@test.com")
        self.supervisor = make_user("supervisor1", "supervisor", "sup@test.com")
        self.employee_user = make_user("emp_user1", "employee", "emp1@test.com")
        self.other_employee_user = make_user("emp_user2", "employee", "emp2@test.com")

        # موظفون
        self.emp_marketing_1 = make_employee("MK001", "Ali Hassan", "emp1@test.com", self.dept_marketing)
        self.emp_marketing_2 = make_employee("MK002", "Sara Ahmed", "emp2_work@test.com", self.dept_marketing)
        self.emp_sales_1 = make_employee("SL001", "Omar Khalid", "emp3@test.com", self.dept_sales)

        # ربط المشرف بقسم التسويق
        self.dept_marketing.manager = self.emp_marketing_1
        self.dept_marketing.save()

    def _auth(self, username):
        token = get_token(self.client, username)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_hr_manager_sees_all_employees(self):
        """HR Manager يرى جميع الموظفين"""
        self._auth("hr_manager1")
        resp = self.client.get(reverse("employee-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [e["employeeCode"] for e in resp.data.get("results", resp.data)]
        self.assertIn("MK001", codes)
        self.assertIn("MK002", codes)
        self.assertIn("SL001", codes)

    def test_employee_sees_only_own_profile(self):
        """الموظف العادي يرى بياناته فقط"""
        self._auth("emp_user1")
        resp = self.client.get(reverse("employee-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        # يجب أن يرى فقط ملف المرتبط بـ emp1@test.com
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "emp1@test.com")

    def test_supervisor_sees_only_managed_dept(self):
        """المشرف يرى موظفي قسمه فقط لا قسم المبيعات"""
        self._auth("supervisor1")
        resp = self.client.get(reverse("employee-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        codes = [e["employeeCode"] for e in results]
        self.assertIn("MK001", codes)   # في قسمه ✅
        self.assertNotIn("SL001", codes)  # ليس في قسمه ❌

    def test_unauthenticated_cannot_access_employees(self):
        """بدون مصادقة يجب أن يُرفض الطلب"""
        self.client.credentials()
        resp = self.client.get(reverse("employee-list"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employee_cannot_create_employee(self):
        """الموظف العادي لا يستطيع إنشاء موظف جديد"""
        self._auth("emp_user1")
        resp = self.client.post(reverse("employee-list"), {
            "employeeCode": "NEW001",
            "name": "New Employee",
            "email": "new@test.com",
            "status": "active",
        }, format="json")
        self.assertIn(resp.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST,  # قد يفشل بسبب RLS
        ])


class RLSAttendanceViewSetTest(APITestCase):
    """اختبار RLS على /api/attendance/"""

    def setUp(self):
        self.dept_a = Department.objects.create(name="Dept A")
        self.dept_b = Department.objects.create(name="Dept B")

        self.hr_user = make_user("hr2", "hr_manager", "hr2@test.com")
        self.supervisor = make_user("sup2", "supervisor", "sup2@test.com")
        self.emp_user = make_user("emp_att1", "employee", "att1@test.com")

        self.emp_a = make_employee("A001", "Ahmed", "att1@test.com", self.dept_a)
        self.emp_b = make_employee("B001", "Bassam", "att2@test.com", self.dept_b)

        self.dept_a.manager = self.emp_a
        self.dept_a.save()

        from datetime import date
        today = date.today()
        self.att_a = Attendance.objects.create(employee=self.emp_a, date=today, status="present")
        self.att_b = Attendance.objects.create(employee=self.emp_b, date=today, status="absent")

    def _auth(self, username):
        token = get_token(self.client, username)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_hr_sees_all_attendance(self):
        """HR يرى حضور جميع الموظفين"""
        self._auth("hr2")
        resp = self.client.get(reverse("attendance-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        ids = [r["id"] for r in results]
        self.assertIn(str(self.att_a.id), ids)
        self.assertIn(str(self.att_b.id), ids)

    def test_employee_sees_only_own_attendance(self):
        """الموظف يرى حضوره فقط"""
        self._auth("emp_att1")
        resp = self.client.get(reverse("attendance-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]["id"]), str(self.att_a.id))

    def test_supervisor_sees_only_dept_attendance(self):
        """المشرف يرى حضور قسمه فقط"""
        self._auth("sup2")
        resp = self.client.get(reverse("attendance-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        ids = [str(r["id"]) for r in results]
        self.assertIn(str(self.att_a.id), ids)
        self.assertNotIn(str(self.att_b.id), ids)


class RLSLeaveViewSetTest(APITestCase):
    """اختبار RLS على /api/leaves/"""

    def setUp(self):
        self.dept_x = Department.objects.create(name="Dept X")
        self.dept_y = Department.objects.create(name="Dept Y")

        self.hr_user = make_user("hr3", "hr_manager", "hr3@test.com")
        self.supervisor = make_user("sup3", "supervisor", "sup3@test.com")
        self.emp_user = make_user("emp_lv1", "employee", "lv1@test.com")

        self.emp_x = make_employee("X001", "Khalid", "lv1@test.com", self.dept_x)
        self.emp_y = make_employee("Y001", "Nour", "lv2@test.com", self.dept_y)

        self.dept_x.manager = self.emp_x
        self.dept_x.save()

        from datetime import date
        today = date.today()
        self.leave_x = Leave.objects.create(
            employee=self.emp_x, leave_type="annual",
            start_date=today, end_date=today, days=1, status="pending"
        )
        self.leave_y = Leave.objects.create(
            employee=self.emp_y, leave_type="sick",
            start_date=today, end_date=today, days=1, status="pending"
        )

    def _auth(self, username):
        token = get_token(self.client, username)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_hr_sees_all_leaves(self):
        self._auth("hr3")
        resp = self.client.get(reverse("leave-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        ids = [str(r["id"]) for r in results]
        self.assertIn(str(self.leave_x.id), ids)
        self.assertIn(str(self.leave_y.id), ids)

    def test_employee_sees_only_own_leaves(self):
        self._auth("emp_lv1")
        resp = self.client.get(reverse("leave-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]["id"]), str(self.leave_x.id))

    def test_supervisor_sees_only_dept_leaves(self):
        self._auth("sup3")
        resp = self.client.get(reverse("leave-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        ids = [str(r["id"]) for r in results]
        self.assertIn(str(self.leave_x.id), ids)
        self.assertNotIn(str(self.leave_y.id), ids)

    def test_leave_approve_workflow(self):
        """اختبار workflow الموافقة على الإجازة"""
        self._auth("hr3")
        resp = self.client.post(reverse("leave-approve", kwargs={"pk": self.leave_x.id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.leave_x.refresh_from_db()
        self.assertEqual(self.leave_x.status, "approved")

    def test_leave_reject_workflow(self):
        """اختبار رفض الإجازة مع تعليق"""
        self._auth("hr3")
        resp = self.client.post(
            reverse("leave-reject", kwargs={"pk": self.leave_y.id}),
            {"comment": "لا يوجد بديل"},
            format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.leave_y.refresh_from_db()
        self.assertEqual(self.leave_y.status, "rejected")

    def test_employee_cannot_approve_leave(self):
        """الموظف لا يستطيع الموافقة على الإجازات"""
        self._auth("emp_lv1")
        resp = self.client.post(reverse("leave-approve", kwargs={"pk": self.leave_y.id}))
        self.assertIn(resp.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,  # لا يراها أصلاً
        ])


class DepartmentScopeHelperTest(TestCase):
    """اختبار وحدة helper الـ RLS مباشرة"""

    def setUp(self):
        self.dept = Department.objects.create(name="Test Dept")
        self.admin_user = make_user("admin_t", "admin")
        self.hr_user = make_user("hr_t", "hr_manager")
        self.supervisor_user = make_user("sup_t", "supervisor", "sup_t@test.com")
        self.emp_user = make_user("emp_t", "employee")
        emp = make_employee("SUP_EMP", "Supervisor Employee", "sup_t@test.com", self.dept)
        self.dept.manager = emp
        self.dept.save()

    def test_admin_gets_full_access(self):
        from shared.security import get_department_scope_for_user
        result = get_department_scope_for_user(self.admin_user)
        self.assertIsNone(result)

    def test_hr_manager_gets_full_access(self):
        from shared.security import get_department_scope_for_user
        result = get_department_scope_for_user(self.hr_user)
        self.assertIsNone(result)

    def test_supervisor_gets_dept_scope(self):
        from shared.security import get_department_scope_for_user
        result = get_department_scope_for_user(self.supervisor_user)
        self.assertIsNotNone(result)
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first().name, "Test Dept")

    def test_employee_gets_none_scope(self):
        from shared.security import get_department_scope_for_user
        result = get_department_scope_for_user(self.emp_user)
        self.assertIsNone(result)

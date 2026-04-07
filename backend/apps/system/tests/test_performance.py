"""
tests/test_performance.py — اختبارات الأداء والـ Caching
"""
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.employees.models import Department, Employee, Leave
from apps.attendance.models import Attendance
from apps.system.models import Settings

User = get_user_model()


def make_user(username, role, email=None):
    email = email or f"{username}@test.com"
    return User.objects.create_user(
        username=username, password="Test12345!", role=role, email=email,
    )


def make_employee(code, name, email, department=None):
    return Employee.objects.create(
        employee_code=code, name=name, email=email,
        department=department, status="active",
    )


class SettingsCacheTest(TestCase):
    """يتحقق أن Settings تُحمّل من الكاش لا من DB في كل استدعاء"""

    def setUp(self):
        Settings.objects.create(
            company_settings={},
            attendance_settings={"workStartTime": "08:00", "lateThreshold": "08:15"},
            leave_settings={},
            notification_settings={},
            general_settings={},
        )

    def test_settings_loaded_from_cache_on_second_call(self):
        from django.core.cache import cache
        cache.clear()
        from shared.security import _validate_security_policy
        # أول استدعاء — من DB
        with patch.object(Settings.objects, "first", wraps=Settings.objects.first) as mock_db:
            try:
                _validate_security_policy("ValidPass123!")
            except Exception:
                pass
            self.assertEqual(mock_db.call_count, 1)

        # ثاني استدعاء يجب أن يأتي من الكاش (call_count = 0)
        with patch.object(Settings.objects, "first", wraps=Settings.objects.first) as mock_db2:
            try:
                _validate_security_policy("ValidPass123!")
            except Exception:
                pass
            self.assertEqual(mock_db2.call_count, 0)  # من الكاش

        cache.clear()


class DBIndexQueryCountTest(APITestCase):
    """يتحقق أن العمليات الشائعة لا تُنتج queries مفرطة"""

    def setUp(self):
        self.dept = Department.objects.create(name="Indexed Dept")
        self.hr_user = make_user("hr_idx", "hr_manager", "hridx@test.com")
        for i in range(10):
            make_employee(f"IDX{i:03}", f"Employee {i}", f"idx{i}@test.com", self.dept)

        token_resp = self.client.post(
            reverse("login"),
            {"username": "hr_idx", "password": "Test12345!"},
            format="json",
        )
        self.token = token_resp.data.get("accessToken", "")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_employee_list_query_count(self):
        """تأكد أن قائمة الموظفين لا تُنفذ أكثر من 5 queries (بدون N+1)"""
        from django.db import connection, reset_queries
        from django.test.utils import override_settings

        with override_settings(DEBUG=True):
            reset_queries()
            resp = self.client.get(reverse("employee-list"))
            query_count = len(connection.queries)

        self.assertEqual(resp.status_code, 200)
        # مع select_related يجب أن تكون < 5 queries
        self.assertLessEqual(
            query_count, 5,
            f"Too many queries: {query_count}. Possible N+1 issue.\n"
            + "\n".join(q["sql"][:100] for q in connection.queries[:10])
        )

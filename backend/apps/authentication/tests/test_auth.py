from django.contrib.auth import get_user_model
from django.urls import reverse
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.notifications.models import Notification
from apps.authentication.models import Role, Permission as AppPermission
from apps.system.models import Settings

User = get_user_model()

class AuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="Test12345!")

    def test_login(self):
        url = reverse("login")
        response = self.client.post(url, {"username": "tester", "password": "Test12345!"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", response.data)

    def test_me_requires_auth(self):
        url = reverse("me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_endpoint_returns_access_token(self):
        login_url = reverse("login")
        login_response = self.client.post(
            login_url,
            {"username": "tester", "password": "Test12345!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        refresh_token = login_response.data.get("refreshToken")
        self.assertTrue(refresh_token)

        refresh_url = reverse("refresh")
        refresh_response = self.client.post(
            refresh_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", refresh_response.data)

    def test_login_token_contains_effective_permissions_claim(self):
        perm = AppPermission.objects.create(code="settings", name="Settings")
        role = Role.objects.create(name="settings_reader")
        role.permissions.add(perm)
        self.user.roles.add(role)

        url = reverse("login")
        response = self.client.post(url, {"username": "tester", "password": "Test12345!"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        access = response.data.get("accessToken")
        self.assertTrue(access)
        claims = AccessToken(access)
        self.assertEqual(claims.get("permission_mode"), "role")
        self.assertIn("settings", claims.get("permissions", []))

    def test_explicit_permissions_override_role_permissions_for_api_access(self):
        perm = AppPermission.objects.create(code="settings", name="Settings")
        role = Role.objects.create(name="settings_reader_2")
        role.permissions.add(perm)
        self.user.roles.add(role)
        self.user.permissions = ["notifications"]
        self.user.save(update_fields=["permissions"])

        login = self.client.post(
            reverse("login"),
            {"username": "tester", "password": "Test12345!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        token = login.data.get("accessToken")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        settings_response = self.client.get("/api/settings/1/")
        self.assertEqual(settings_response.status_code, status.HTTP_403_FORBIDDEN)

        notifications_response = self.client.get("/api/notifications/")
        self.assertEqual(notifications_response.status_code, status.HTTP_200_OK)

    def test_permissions_endpoint_returns_localized_english_fields(self):
        AppPermission.objects.create(
            code="employees.read",
            name="عرض الموظفين",
            name_en="View employees",
            description="عرض بيانات الموظفين",
            description_en="View employee records",
        )
        self.user.role = "system_admin"
        self.user.save(update_fields=["role"])
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/permissions/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data["results"][0] if isinstance(response.data, dict) else response.data[0]
        self.assertEqual(item["name"], "View employees")
        self.assertEqual(item["description"], "View employee records")

    def test_roles_endpoint_returns_localized_english_fields(self):
        permission = AppPermission.objects.create(
            code="reports.read",
            name="عرض التقارير",
            name_en="View reports",
        )
        role = Role.objects.create(
            name="مدير تقارير",
            name_en="Reports Manager",
            description="يدير الوصول إلى التقارير",
            description_en="Manages report access",
        )
        role.permissions.add(permission)
        self.user.role = "system_admin"
        self.user.save(update_fields=["role"])
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/roles/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data["results"][0] if isinstance(response.data, dict) else response.data[0]
        self.assertEqual(item["name"], "Reports Manager")
        self.assertEqual(item["description"], "Manages report access")
        self.assertEqual(item["permissions"][0]["name"], "View reports")


class UserInviteTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_inviter",
            password="Admin12345!",
            role="admin",
            email="admin@example.com",
        )
        login = self.client.post(
            reverse("login"),
            {"username": "admin_inviter", "password": "Admin12345!"},
            format="json",
        )
        token = login.data["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_invite_endpoint_creates_users_and_reports_invalid_emails(self):
        response = self.client.post(
            "/api/users/invite/",
            {
                "emails": [
                    "alpha.invite@example.com",
                    "invalid-email",
                    "beta.invite@example.com",
                ],
                "role": "employee",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("invited"), 2)
        self.assertIn("invalid-email", response.data.get("invalidEmails", []))
        self.assertEqual(response.data.get("createdUsers"), 2)
        self.assertTrue(User.objects.filter(email="alpha.invite@example.com").exists())
        self.assertTrue(User.objects.filter(email="beta.invite@example.com").exists())
        self.assertEqual(Notification.objects.filter(channel="email", status="sent").count(), 2)


class InitialSetupTests(APITestCase):
    def test_setup_status_requires_setup_when_no_users(self):
        response = self.client.get(reverse("setup-status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("requiresSetup"))
        self.assertFalse(response.data.get("setupCompleted"))

    def test_initial_setup_creates_admin_and_marks_completed(self):
        payload = {
            "admin": {
                "name": "System Admin",
                "username": "bootstrap_admin",
                "email": "bootstrap@example.com",
                "password": "Admin12345!",
            },
            "company": {
                "name": "Bootstrap Co",
                "country": "Saudi Arabia",
                "currency": "SAR",
            },
        }
        response = self.client.post(reverse("initial-setup"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("accessToken", response.data)
        self.assertTrue(User.objects.filter(username="bootstrap_admin", role="system_admin").exists())

        setup_status = self.client.get(reverse("setup-status"))
        self.assertEqual(setup_status.status_code, status.HTTP_200_OK)
        self.assertFalse(setup_status.data.get("requiresSetup"))
        self.assertTrue(setup_status.data.get("setupCompleted"))

        settings_obj = Settings.objects.first()
        self.assertIsNotNone(settings_obj)
        self.assertTrue((settings_obj.general_settings or {}).get("setupCompleted"))

    def test_initial_setup_cannot_run_twice(self):
        User.objects.create_user(
            username="existing_admin",
            email="existing@example.com",
            password="Admin12345!",
            role="system_admin",
            is_active=True,
        )
        response = self.client.post(
            reverse("initial-setup"),
            {
                "admin": {
                    "name": "Another Admin",
                    "username": "another_admin",
                    "email": "another@example.com",
                    "password": "Admin12345!",
                }
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_register_blocked_while_setup_required(self):
        response = self.client.post(
            reverse("register"),
            {"username": "u1", "password": "Pass12345!", "name": "User One"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get("code"), "SETUP_REQUIRED")

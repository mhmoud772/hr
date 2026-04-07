from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class SecuritySettingsTests(TestCase):
    def test_security_headers_presence(self):
        """
        Verify that critical security headers are set in the response.
        """
        response = self.client.get("/")
        # X-Frame-Options should be DENY
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        # Content-Type-Options should be nosniff
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")


class MonitoringAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin_mon",
            password="pass",
            email="admin@mon.com",
        )
        self.admin.role = "system_admin"
        self.admin.save()
        self.client.force_authenticate(user=self.admin)

    def test_system_status_endpoint(self):
        url = reverse("monitoring-status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("resources", response.data)
        self.assertIn("services", response.data)
        self.assertIn("analyticalDatabase", response.data["services"])

    def test_security_logs_endpoint(self):
        url = reverse("monitoring-security-logs")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

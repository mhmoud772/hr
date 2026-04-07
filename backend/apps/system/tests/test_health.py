from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

class HealthCheckTests(APITestCase):
    def test_health_check(self):
        url = reverse("health")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Updated to match the new "healthy" string
        self.assertEqual(response.json().get("status"), "healthy")
        self.assertIn("database", response.json())
        self.assertIn("redis", response.json())
        self.assertIn("celery", response.json())

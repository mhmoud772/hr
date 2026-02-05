from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "ok")

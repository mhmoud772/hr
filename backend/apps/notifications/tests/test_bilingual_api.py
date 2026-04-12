from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import Notification

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class NotificationsBilingualAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notify_bilingual",
            password="Admin12345!",
            role="system_admin",
            email="notify-bilingual@example.com",
        )
        self.client.force_authenticate(user=self.user)
        Notification.objects.create(
            recipient=self.user,
            channel="app",
            title="تنبيه الحضور اليومي",
            title_en="Daily attendance alert",
            body="يرجى مراجعة الحضور والانصراف لهذا اليوم.",
            body_en="Please review today's attendance status.",
            status="sent",
        )

    def test_notifications_return_localized_english_fields(self):
        response = self.client.get("/api/notifications/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["title"], "Daily attendance alert")
        self.assertEqual(item["description"], "Please review today's attendance status.")

    def test_notifications_search_matches_english_translation(self):
        response = self.client.get("/api/notifications/", {"search": "attendance alert"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["title"], "Daily attendance alert")

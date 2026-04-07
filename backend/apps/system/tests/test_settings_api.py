from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.system.models import Settings

User = get_user_model()


@override_settings(
    AI_PROVIDER="google",
    AI_MODEL_NAME="gemini-2.5-flash",
    AI_API_KEY="test-key",
)
class SettingsAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="settings_admin",
            password="Admin12345!",
            role="system_admin",
            email="settings@example.com",
        )
        self.client.force_authenticate(user=self.admin)
        self.settings_obj, _ = Settings.objects.get_or_create(
            id=1,
            defaults={
                "general_settings": {},
            },
        )

    def test_retrieve_includes_ai_settings(self):
        response = self.client.get("/api/settings/1/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["ai_enabled"])
        self.assertTrue(response.data["ai_settings"]["enabled"])
        self.assertTrue(response.data["ai_settings"]["runtime_enabled"])
        self.assertEqual(response.data["ai_settings"]["provider"], "google")
        self.assertEqual(response.data["ai_settings"]["model_name"], "gemini-2.5-flash")
        self.assertTrue(response.data["ai_settings"]["features"]["policy_assistant"])
        self.assertTrue(response.data["ai_settings"]["features"]["dashboard_summary"])

    def test_update_persists_ai_settings_inside_general_settings(self):
        payload = {
            "ai_settings": {
                "enabled": False,
                "allow_fallback": False,
                "access_roles": ["system_admin", "admin"],
                "features": {
                    "policy_assistant": True,
                    "dashboard_summary": False,
                },
            }
        }

        response = self.client.put("/api/settings/1/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.settings_obj.refresh_from_db()
        stored_ai = (self.settings_obj.general_settings or {}).get("ai", {})
        self.assertFalse(stored_ai.get("enabled"))
        self.assertFalse(stored_ai.get("allow_fallback"))
        self.assertEqual(stored_ai.get("access_roles"), ["system_admin", "admin"])
        self.assertTrue(stored_ai.get("features", {}).get("policy_assistant"))
        self.assertFalse(stored_ai.get("features", {}).get("dashboard_summary"))
        self.assertFalse(response.data["ai_enabled"])

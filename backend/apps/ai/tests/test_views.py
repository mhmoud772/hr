from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.ai.models import PolicyDocument
from apps.system.models import Settings

User = get_user_model()


class AIViewsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="ai_tester",
            password="Test12345!",
            email="ai@example.com",
        )

    def test_query_view_requires_authentication(self):
        response = self.client.post(reverse("ai_query"), {"prompt": "Headcount?"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_query_view_returns_answer_for_authenticated_user(self):
        self.client.force_authenticate(user=self.user)

        with (
            patch("apps.ai.views.ContextBuilder.build_full_hr_context", return_value="ctx") as mock_context,
            patch("apps.ai.views.LLMService.ask_ai") as mock_ask_ai,
        ):
            mock_ask_ai.return_value = {"answer": "Mock headcount response", "metadata": {"mock": True}}
            response = self.client.post(
                reverse("ai_query"),
                {"prompt": "What is the headcount?", "include_context": True},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["answer"], "Mock headcount response")
        mock_context.assert_called_once_with("What is the headcount?")
        mock_ask_ai.assert_called_once_with(self.user, "What is the headcount?", "ctx")

    def test_dashboard_summary_view_returns_answer_for_authenticated_user(self):
        self.client.force_authenticate(user=self.user)

        with (
            patch("apps.ai.views.ContextBuilder.get_system_snapshot_context", return_value="snapshot") as mock_snapshot,
            patch("apps.ai.views.LLMService.ask_ai") as mock_ask_ai,
        ):
            mock_ask_ai.return_value = {"answer": "Mock dashboard summary", "metadata": {"mock": True}}
            response = self.client.get(reverse("ai_summary"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["answer"], "Mock dashboard summary")
        mock_snapshot.assert_called_once()
        mock_ask_ai.assert_called_once()

    def test_dashboard_summary_view_uses_arabic_snapshot_and_prompt_for_arabic_requests(self):
        self.client.force_authenticate(user=self.user)

        with (
            patch("apps.ai.views.ContextBuilder.get_system_snapshot_context", return_value="snapshot") as mock_snapshot,
            patch("apps.ai.views.LLMService.ask_ai") as mock_ask_ai,
        ):
            mock_ask_ai.return_value = {"answer": "Mock dashboard summary", "metadata": {"mock": True}}
            response = self.client.get(reverse("ai_summary"), HTTP_ACCEPT_LANGUAGE="ar")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_snapshot.assert_called_once_with(language="ar")
        self.assertEqual(mock_ask_ai.call_args[0][0], self.user)
        self.assertIn(
            "\u0642\u062f\u0651\u0645 \u0645\u0644\u062e\u0635\u064b\u0627 \u062a\u0646\u0641\u064a\u0630\u064a\u064b\u0627",
            mock_ask_ai.call_args[0][1],
        )
        self.assertEqual(mock_ask_ai.call_args[0][2], "snapshot")

    def test_policies_view_returns_only_active_policies(self):
        self.client.force_authenticate(user=self.user)
        active_policy = PolicyDocument.objects.create(
            title="Annual Leave Policy",
            category="leaves",
            content="Employees receive annual leave according to policy.",
            is_active=True,
        )
        PolicyDocument.objects.create(
            title="Deprecated Policy",
            category="general",
            content="Old policy",
            is_active=False,
        )

        response = self.client.get(reverse("ai_policies"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]["id"]), str(active_policy.id))
        self.assertEqual(response.data[0]["title"], "Annual Leave Policy")

    def test_query_view_returns_403_when_ai_is_disabled_in_settings(self):
        self.client.force_authenticate(user=self.user)
        Settings.objects.update_or_create(
            id=1,
            defaults={"general_settings": {"ai": {"enabled": False}}},
        )

        response = self.client.post(
            reverse("ai_query"),
            {"prompt": "What is the headcount?", "include_context": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_policies_view_returns_403_when_ai_is_disabled_in_settings(self):
        self.client.force_authenticate(user=self.user)
        Settings.objects.update_or_create(
            id=1,
            defaults={"general_settings": {"ai": {"enabled": False}}},
        )

        response = self.client.get(reverse("ai_policies"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

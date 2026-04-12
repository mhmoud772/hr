from unittest.mock import patch

from django.test import TestCase, override_settings

from apps.ai.models import PolicyDocument

from apps.ai.services.llm_service import LLMService


class LLMServiceTests(TestCase):
    def setUp(self):
        PolicyDocument.objects.create(
            title="Annual Leave Policy",
            category="leaves",
            content="All full-time employees are entitled to 21 days of paid annual leave per year.",
            is_active=True,
        )

    @override_settings(AI_API_KEY=None)
    def test_get_model_returns_none_without_api_key(self):
        self.assertIsNone(LLMService.get_model())

    @override_settings(AI_API_KEY="test-key", AI_PROVIDER="openai")
    @patch("apps.ai.services.llm_service.import_module")
    def test_get_model_returns_none_when_provider_package_missing(self, mock_import_module):
        mock_import_module.side_effect = ModuleNotFoundError("No module named 'langchain_openai'")

        self.assertIsNone(LLMService.get_model())

    @override_settings(AI_API_KEY=None)
    def test_ask_ai_falls_back_to_mock_response_without_api_key(self):
        response = LLMService.ask_ai(
            user=None,
            prompt="What is the annual leave policy?",
            system_context="### Current System Snapshot (Live Analytics):\n- Total Employees: 10",
        )

        self.assertIn("answer", response)
        self.assertTrue(response["metadata"]["grounded"])
        self.assertIn("Annual Leave Policy", response["answer"])
        self.assertIn("21 days", response["answer"])

    @override_settings(AI_API_KEY=None)
    def test_ask_ai_returns_grounded_answer_for_arabic_policy_question(self):
        PolicyDocument.objects.all().delete()
        PolicyDocument.objects.create(
            title="سياسة الإجازة السنوية",
            title_en="Annual Leave Policy",
            category="leaves",
            content="يستحق جميع الموظفين بدوام كامل 21 يومًا من الإجازة السنوية المدفوعة في السنة.",
            content_en="All full-time employees are entitled to 21 days of paid annual leave per year.",
            is_active=True,
        )
        response = LLMService.ask_ai(
            user=None,
            prompt="\u0645\u0627 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629\u061f",
            system_context="ctx",
        )

        self.assertIn("\u0628\u062d\u0633\u0628 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629", response["answer"])
        self.assertIn("سياسة الإجازة السنوية", response["answer"])
        self.assertTrue(response["metadata"]["grounded"])

    @override_settings(AI_API_KEY=None)
    def test_ask_ai_returns_localized_english_answer_for_bilingual_policy(self):
        PolicyDocument.objects.all().delete()
        PolicyDocument.objects.create(
            title="سياسة الإجازة السنوية",
            title_en="Annual Leave Policy",
            category="leaves",
            content="يستحق جميع الموظفين بدوام كامل 21 يومًا من الإجازة السنوية المدفوعة في السنة.",
            content_en="All full-time employees are entitled to 21 days of paid annual leave per year.",
            is_active=True,
        )

        response = LLMService.ask_ai(
            user=None,
            prompt="What is the annual leave policy?",
            system_context="ctx",
        )

        self.assertIn("Annual Leave Policy", response["answer"])
        self.assertIn("21 days", response["answer"])
        self.assertNotIn("سياسة الإجازة السنوية", response["answer"])
        self.assertTrue(response["metadata"]["grounded"])

    @override_settings(AI_API_KEY="live-key")
    @patch("apps.ai.services.llm_service.LLMService.get_model")
    def test_ask_ai_prefers_grounded_policy_answer_for_policy_queries(self, mock_get_model):
        response = LLMService.ask_ai(
            user=None,
            prompt="What is the annual leave policy?",
            system_context="ctx",
        )

        self.assertIn("Annual Leave Policy", response["answer"])
        self.assertIn("21 days", response["answer"])
        self.assertTrue(response["metadata"]["grounded"])
        mock_get_model.assert_not_called()

    @override_settings(AI_API_KEY="live-key")
    @patch("apps.ai.services.llm_service.LLMService.get_model")
    def test_ask_ai_prefers_grounded_policy_answer_for_arabic_policy_queries(self, mock_get_model):
        PolicyDocument.objects.create(
            title="\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629",
            category="leaves",
            content="\u064a\u0633\u062a\u062d\u0642 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u0628\u062f\u0648\u0627\u0645 \u0643\u0627\u0645\u0644 21 \u064a\u0648\u0645\u064b\u0627 \u0645\u0646 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0629 \u0641\u064a \u0627\u0644\u0633\u0646\u0629.",
            is_active=True,
        )

        response = LLMService.ask_ai(
            user=None,
            prompt="\u0645\u0627 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629\u061f",
            system_context="ctx",
        )

        self.assertIn("\u0628\u062d\u0633\u0628 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629", response["answer"])
        self.assertIn("21", response["answer"])
        self.assertTrue(response["metadata"]["grounded"])
        mock_get_model.assert_not_called()

    @override_settings(AI_API_KEY=None)
    def test_dashboard_fallback_returns_arabic_summary_for_arabic_prompt(self):
        with patch(
            "apps.ai.services.llm_service.AnalyticalService.get_dashboard_stats",
            return_value={
                "totalEmployees": 6,
                "presentToday": 5,
                "absentToday": 1,
                "pendingLeaves": 2,
                "adherenceRate": 83.3,
            },
        ):
            response = LLMService.ask_ai(
                user=None,
                prompt="\u0642\u062f\u0645 \u0645\u0644\u062e\u0635 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645",
                system_context="ctx",
            )

        self.assertIn("\u0645\u0644\u062e\u0635 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062d\u0627\u0644\u064a", response["answer"])
        self.assertTrue(response["metadata"]["mock"])

    @patch("apps.ai.services.llm_service.LLMService.get_model")
    @patch("apps.ai.services.llm_service.import_module")
    def test_ask_ai_falls_back_to_mock_response_when_langchain_core_missing(
        self,
        mock_import_module,
        mock_get_model,
    ):
        mock_get_model.return_value = object()
        mock_import_module.side_effect = ModuleNotFoundError("No module named 'langchain_core'")

        response = LLMService.ask_ai(user=None, prompt="Policy question", system_context="ctx")

        self.assertIn("answer", response)
        self.assertTrue(response["metadata"]["grounded"])
        self.assertIn("Annual Leave Policy", response["answer"])

    @patch("apps.ai.services.llm_service.LLMService.get_model")
    @patch("apps.ai.services.llm_service.import_module")
    def test_ask_ai_falls_back_to_policy_answer_when_provider_call_fails(
        self,
        mock_import_module,
        mock_get_model,
    ):
        class FakeMessage:
            def __init__(self, content):
                self.content = content

        class FakeModel:
            def invoke(self, _messages):
                raise RuntimeError("provider unavailable")

        class FakeMessagesModule:
            HumanMessage = FakeMessage
            SystemMessage = FakeMessage

        mock_get_model.return_value = FakeModel()
        mock_import_module.return_value = FakeMessagesModule

        response = LLMService.ask_ai(
            user=None,
            prompt="What is the annual leave policy?",
            system_context="ctx",
        )

        self.assertIn("answer", response)
        self.assertTrue(response["metadata"]["grounded"])
        self.assertIn("Annual Leave Policy", response["answer"])

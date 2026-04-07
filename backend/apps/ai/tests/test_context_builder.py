from django.test import TestCase
from unittest.mock import patch

from apps.ai.models import PolicyDocument
from apps.ai.services.context_builder import ContextBuilder


class ContextBuilderTests(TestCase):
    def setUp(self):
        PolicyDocument.objects.create(
            title="Sick Leave and Emergency Policy",
            category="leaves",
            content="Paid sick leave is provided for up to 10 days per year.",
            is_active=True,
        )
        PolicyDocument.objects.create(
            title="Annual Leave Policy",
            category="leaves",
            content="All full-time employees are entitled to 21 days of paid annual leave per year.",
            is_active=True,
        )

    def test_get_relevant_policy_documents_prioritizes_best_title_match(self):
        policies = ContextBuilder.get_relevant_policy_documents("What is the annual leave policy?")

        self.assertGreaterEqual(len(policies), 1)
        self.assertEqual(policies[0].title, "Annual Leave Policy")

    def test_is_arabic_text_detects_arabic_input(self):
        self.assertTrue(ContextBuilder.is_arabic_text("\u0645\u0627 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629\u061f"))
        self.assertFalse(ContextBuilder.is_arabic_text("What is the leave policy?"))

    def test_build_full_hr_context_returns_arabic_system_prompt_for_arabic_query(self):
        with patch(
            "apps.ai.services.context_builder.AnalyticalService.get_dashboard_stats",
            return_value={
                "totalEmployees": 6,
                "presentToday": 5,
                "absentToday": 1,
                "adherenceRate": 83.3,
                "pendingLeaves": 2,
                "departmentStats": [{"name": "HR", "value": 2}],
            },
        ):
            context = ContextBuilder.build_full_hr_context(
                "\u0645\u0627 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629\u061f"
            )

        self.assertIn("\u0623\u0646\u062a \u0645\u0633\u0627\u0639\u062f HR Companion", context)
        self.assertIn("\u0627\u0644\u0633\u064a\u0627\u0633\u0627\u062a \u0630\u0627\u062a \u0627\u0644\u0635\u0644\u0629", context)
        self.assertIn("\u0645\u0644\u062e\u0635 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062d\u0627\u0644\u064a", context)
        self.assertIn("Annual Leave Policy", context)

    def test_get_relevant_policy_documents_supports_english_query_against_arabic_policy(self):
        PolicyDocument.objects.create(
            title="\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629",
            category="leaves",
            content="\u064a\u0633\u062a\u062d\u0642 \u0627\u0644\u0645\u0648\u0638\u0641 \u0628\u062f\u0648\u0627\u0645 \u0643\u0627\u0645\u0644 21 \u064a\u0648\u0645\u064b\u0627 \u0645\u0646 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0629.",
            is_active=True,
        )

        policies = ContextBuilder.get_relevant_policy_documents("What is the annual leave policy?")

        self.assertGreaterEqual(len(policies), 1)
        self.assertEqual(policies[0].title, "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629")

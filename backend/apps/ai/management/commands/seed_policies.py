from django.core.management.base import BaseCommand

from apps.ai.models import PolicyDocument


ENGLISH_POLICIES = [
    {
        "title": "Attendance and Punctuality Policy",
        "category": "attendance",
        "content": (
            "Employees are expected to be ready to start work by 8:00 AM. "
            "A grace period of 15 minutes is allowed for exceptional delays. "
            "Repeated lateness more than three times in a month may trigger a formal warning. "
            "The standard workday ends at 5:00 PM."
        ),
        "version": "1.1.0",
    },
    {
        "title": "Annual Leave Policy",
        "category": "leaves",
        "content": (
            "All full-time employees are entitled to 21 days of paid annual leave per year. "
            "Short leave requests of one to two days should be submitted at least 48 hours in advance, "
            "while longer leave requests should be submitted at least two weeks in advance. "
            "Approval depends on team workload and the manager's discretion."
        ),
        "version": "2.1.0",
    },
    {
        "title": "Sick Leave and Emergency Policy",
        "category": "leaves",
        "content": (
            "Paid sick leave is granted for up to 10 days per year. "
            "If the absence exceeds two consecutive days, a medical report must be provided upon return. "
            "In emergencies, the direct supervisor should be informed within two hours of the workday start."
        ),
        "version": "1.3.0",
    },
    {
        "title": "Employee Code of Conduct",
        "category": "conduct",
        "content": (
            "Employees must maintain professional conduct at all times. "
            "Respectful communication is mandatory across all levels of the organization. "
            "Company resources must not be used for personal gain, and company and customer data must remain confidential "
            "even after employment ends."
        ),
        "version": "3.2.0",
    },
]

ARABIC_POLICIES = [
    {
        "title": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062d\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645 \u0628\u0627\u0644\u0648\u0642\u062a",
        "category": "attendance",
        "content": (
            "\u064a\u062c\u0628 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 "
            "\u0627\u0644\u062a\u0648\u0627\u062c\u062f \u0641\u064a \u0623\u0645\u0627\u0643\u0646 "
            "\u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0627\u0633\u062a\u0639\u062f\u0627\u062f "
            "\u0644\u0628\u062f\u0621 \u0627\u0644\u0639\u0645\u0644 \u0628\u062d\u0644\u0648\u0644 "
            "\u0627\u0644\u0633\u0627\u0639\u0629 8:00 \u0635\u0628\u0627\u062d\u064b\u0627. "
            "\u064a\u0633\u0645\u062d \u0628\u0641\u062a\u0631\u0629 \u0633\u0645\u0627\u062d "
            "\u0645\u062f\u062a\u0647\u0627 15 \u062f\u0642\u064a\u0642\u0629 "
            "(\u062d\u062a\u0649 8:15 \u0635\u0628\u0627\u062d\u064b\u0627) "
            "\u0644\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u062a\u0623\u062e\u0631 "
            "\u0627\u0644\u0637\u0627\u0631\u0626\u0629. \u062a\u0643\u0631\u0627\u0631 "
            "\u0627\u0644\u062a\u0623\u062e\u0631 \u0623\u0643\u062b\u0631 \u0645\u0646 "
            "3 \u0645\u0631\u0627\u062a \u0634\u0647\u0631\u064a\u064b\u0627 \u0642\u062f "
            "\u064a\u0624\u062f\u064a \u0625\u0644\u0649 \u0625\u0646\u0630\u0627\u0631 "
            "\u0631\u0633\u0645\u064a. \u064a\u0646\u062a\u0647\u064a \u0627\u0644\u062f\u0648\u0627\u0645 "
            "\u0627\u0644\u0631\u0633\u0645\u064a \u0641\u064a \u0627\u0644\u0633\u0627\u0639\u0629 5:00 \u0645\u0633\u0627\u0621\u064b."
        ),
        "version": "1.1.0",
    },
    {
        "title": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629",
        "category": "leaves",
        "content": (
            "\u064a\u0633\u062a\u062d\u0642 \u062c\u0645\u064a\u0639 "
            "\u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u0628\u062f\u0648\u0627\u0645 "
            "\u0643\u0627\u0645\u0644 21 \u064a\u0648\u0645\u064b\u0627 \u0645\u0646 "
            "\u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0633\u0646\u0648\u064a\u0629 "
            "\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0629 \u0641\u064a \u0627\u0644\u0633\u0646\u0629. "
            "\u064a\u062c\u0628 \u062a\u0642\u062f\u064a\u0645 \u0637\u0644\u0628\u0627\u062a "
            "\u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0639\u0628\u0631 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 "
            "\u0642\u0628\u0644 48 \u0633\u0627\u0639\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 "
            "\u0644\u0644\u0625\u062c\u0627\u0632\u0627\u062a \u0627\u0644\u0642\u0635\u064a\u0631\u0629 "
            "(1-2 \u064a\u0648\u0645) \u0648\u0642\u0628\u0644 \u0623\u0633\u0628\u0648\u0639\u064a\u0646 "
            "\u0644\u0644\u0625\u062c\u0627\u0632\u0627\u062a \u0627\u0644\u0637\u0648\u064a\u0644\u0629. "
            "\u062a\u062e\u0636\u0639 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0644\u0636\u063a\u0637 "
            "\u0627\u0644\u0639\u0645\u0644 \u0641\u064a \u0627\u0644\u0642\u0633\u0645 "
            "\u0648\u062a\u0642\u062f\u064a\u0631 \u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631."
        ),
        "version": "2.1.0",
    },
    {
        "title": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0627\u062a \u0627\u0644\u0645\u0631\u0636\u064a\u0629 \u0648\u0627\u0644\u0637\u0648\u0627\u0631\u0626",
        "category": "leaves",
        "content": (
            "\u062a\u0645\u0646\u062d \u0627\u0644\u0625\u062c\u0627\u0632\u0629 "
            "\u0627\u0644\u0645\u0631\u0636\u064a\u0629 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0629 "
            "\u0644\u0645\u062f\u0629 \u062a\u0635\u0644 \u0625\u0644\u0649 10 \u0623\u064a\u0627\u0645 "
            "\u0633\u0646\u0648\u064a\u064b\u0627. \u0625\u0630\u0627 \u062a\u062c\u0627\u0648\u0632 "
            "\u0627\u0644\u063a\u064a\u0627\u0628 \u064a\u0648\u0645\u064a\u0646 \u0645\u062a\u062a\u0627\u0644\u064a\u064a\u0646 "
            "\u0641\u064a\u062c\u0628 \u062a\u0642\u062f\u064a\u0645 \u062a\u0642\u0631\u064a\u0631 "
            "\u0637\u0628\u064a \u0639\u0646\u062f \u0627\u0644\u0639\u0648\u062f\u0629. "
            "\u0641\u064a \u0627\u0644\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0637\u0627\u0631\u0626\u0629 "
            "\u064a\u062c\u0628 \u0625\u0628\u0644\u0627\u063a \u0627\u0644\u0645\u0634\u0631\u0641 "
            "\u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u062e\u0644\u0627\u0644 \u0633\u0627\u0639\u062a\u064a\u0646 "
            "\u0645\u0646 \u0628\u062f\u0627\u064a\u0629 \u064a\u0648\u0645 \u0627\u0644\u0639\u0645\u0644."
        ),
        "version": "1.3.0",
    },
    {
        "title": "\u0645\u062f\u0648\u0646\u0629 \u0633\u0644\u0648\u0643 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646",
        "category": "conduct",
        "content": (
            "\u064a\u062c\u0628 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 "
            "\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645 \u0628\u0633\u0644\u0648\u0643 "
            "\u0645\u0647\u0646\u064a \u0628\u0634\u0643\u0644 \u062f\u0627\u0626\u0645. "
            "\u064a\u0639\u062f \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0628\u0627\u062d\u062a\u0631\u0627\u0645 "
            "\u0645\u0637\u0644\u0628\u064b\u0627 \u0623\u0633\u0627\u0633\u064a\u064b\u0627 \u0639\u0644\u0649 "
            "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u062a\u0648\u064a\u0627\u062a. "
            "\u064a\u0645\u0646\u0639 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0645\u0648\u0627\u0631\u062f "
            "\u0627\u0644\u0634\u0631\u0643\u0629 \u0644\u062a\u062d\u0642\u064a\u0642 \u0645\u0635\u0644\u062d\u0629 "
            "\u0634\u062e\u0635\u064a\u0629. \u0648\u064a\u062c\u0628 \u0627\u0644\u062d\u0641\u0627\u0638 "
            "\u0639\u0644\u0649 \u0633\u0631\u064a\u0629 \u0628\u064a\u0627\u0646\u0627\u062a "
            "\u0627\u0644\u0634\u0631\u0643\u0629 \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0621 "
            "\u062d\u062a\u0649 \u0628\u0639\u062f \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0627\u0644\u0648\u0638\u064a\u0641\u0629."
        ),
        "version": "3.2.0",
    },
]


class Command(BaseCommand):
    help = "Seeds the database with bilingual HR policies for AI context."

    def handle(self, *args, **options):
        known_titles = [policy["title"] for policy in ENGLISH_POLICIES + ARABIC_POLICIES]
        PolicyDocument.objects.filter(title__in=known_titles).exclude(title__in=[policy["title"] for policy in ARABIC_POLICIES]).delete()

        for policy_data, english_policy in zip(ARABIC_POLICIES, ENGLISH_POLICIES):
            defaults = {
                **policy_data,
                "title_en": english_policy["title"],
                "content_en": english_policy["content"],
            }
            obj, created = PolicyDocument.objects.update_or_create(
                title=policy_data["title"],
                defaults=defaults,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created policy: {obj.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated policy: {obj.title}"))

        self.stdout.write(self.style.SUCCESS("Successfully seeded bilingual HR policies."))

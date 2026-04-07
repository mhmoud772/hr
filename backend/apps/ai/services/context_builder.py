import re

from django.db.models import Q

from apps.ai.models import PolicyDocument
from apps.reports.services.analytical_service import AnalyticalService


class ContextBuilder:
    ARABIC_PATTERN = re.compile(r"[\u0600-\u06FF]")
    KEYWORD_SYNONYM_GROUPS = (
        ("leave", "vacation", "\u0625\u062c\u0627\u0632\u0629", "\u0627\u0644\u0625\u062c\u0627\u0632\u0629"),
        ("annual", "\u0633\u0646\u0648\u064a", "\u0633\u0646\u0648\u064a\u0629", "\u0627\u0644\u0633\u0646\u0648\u064a\u0629"),
        ("sick", "\u0645\u0631\u0636", "\u0645\u0631\u0636\u064a\u0629"),
        ("attendance", "\u062d\u0636\u0648\u0631", "\u0627\u0646\u0635\u0631\u0627\u0641"),
        ("late", "lateness", "\u062a\u0623\u062e\u0631"),
        ("absence", "absent", "\u063a\u064a\u0627\u0628"),
        ("salary", "payroll", "\u0631\u0627\u062a\u0628", "\u0631\u0648\u0627\u062a\u0628"),
        ("recruitment", "hiring", "\u062a\u0648\u0638\u064a\u0641"),
        ("training", "\u062a\u062f\u0631\u064a\u0628"),
        ("performance", "\u0623\u062f\u0627\u0621"),
        ("policy", "policies", "\u0633\u064a\u0627\u0633\u0629", "\u0633\u064a\u0627\u0633\u0627\u062a"),
        ("approval", "approvals", "\u0645\u0648\u0627\u0641\u0642\u0629", "\u0645\u0648\u0627\u0641\u0642\u0627\u062a"),
    )

    @classmethod
    def is_arabic_text(cls, value: str) -> bool:
        return bool(value and cls.ARABIC_PATTERN.search(value))

    @staticmethod
    def _tokenize_query(query: str) -> list[str]:
        return [word for word in re.findall(r"\w+", query.lower()) if len(word) > 2]

    @classmethod
    def _expand_query_terms(cls, query: str, words: list[str]) -> list[str]:
        expanded_terms = set(words)
        lowered_query = query.lower()

        for group in cls.KEYWORD_SYNONYM_GROUPS:
            if any(term in lowered_query for term in group):
                expanded_terms.update(group)

        return sorted(expanded_terms)

    @classmethod
    def _score_policy_document(cls, policy: PolicyDocument, query: str, words: list[str]) -> int:
        normalized_query = query.lower().strip()
        title = policy.title.lower()
        content = policy.content.lower()
        category = policy.category.lower()

        score = 0
        if normalized_query and normalized_query in title:
            score += 12
        if normalized_query and normalized_query in content:
            score += 6

        for word in words:
            if word in title:
                score += 4
            if word in category:
                score += 2
            if word in content:
                score += 1

        return score

    @classmethod
    def get_relevant_policy_documents(cls, query: str, limit: int = 3) -> list[PolicyDocument]:
        words = cls._expand_query_terms(query, cls._tokenize_query(query))
        if not words:
            return list(PolicyDocument.objects.filter(is_active=True)[:limit])

        q_objects = Q()
        for word in words:
            q_objects |= (
                Q(content__icontains=word)
                | Q(title__icontains=word)
                | Q(category__icontains=word)
            )

        policies = list(PolicyDocument.objects.filter(q_objects, is_active=True).distinct())
        ranked_policies = sorted(
            policies,
            key=lambda policy: cls._score_policy_document(policy, query, words),
            reverse=True,
        )
        return ranked_policies[:limit]

    @classmethod
    def get_relevant_policies(cls, query: str, limit: int = 3) -> str:
        policies = cls.get_relevant_policy_documents(query, limit=limit)
        is_arabic = cls.is_arabic_text(query)

        if is_arabic:
            context = "### \u0627\u0644\u0633\u064a\u0627\u0633\u0627\u062a \u0630\u0627\u062a \u0627\u0644\u0635\u0644\u0629:\n"
            for policy in policies:
                context += (
                    f"- **{policy.title}** "
                    f"(\u0627\u0644\u0641\u0626\u0629: {policy.category}): "
                    f"{policy.content[:500]}...\n"
                )
            return context

        context = "### Relevant HR Policies:\n"
        for policy in policies:
            context += (
                f"- **{policy.title}** "
                f"(Category: {policy.category}): "
                f"{policy.content[:500]}...\n"
            )
        return context

    @staticmethod
    def get_system_snapshot_context(language: str = "en") -> str:
        stats = AnalyticalService.get_dashboard_stats()
        department_stats = stats.get("departmentStats", [])
        is_arabic = language == "ar"

        if is_arabic:
            context = (
                "### \u0645\u0644\u062e\u0635 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062d\u0627\u0644\u064a "
                "(\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0645\u0628\u0627\u0634\u0631\u0629):\n"
            )
            context += (
                f"- \u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646: "
                f"{stats.get('totalEmployees', 0)}\n"
            )
            context += (
                f"- \u0627\u0644\u0645\u0648\u0638\u0641\u0648\u0646 "
                f"\u0627\u0644\u062d\u0627\u0636\u0631\u0648\u0646 \u0627\u0644\u064a\u0648\u0645: "
                f"{stats.get('presentToday', 0)}\n"
            )
            context += (
                f"- \u0627\u0644\u0645\u0648\u0638\u0641\u0648\u0646 "
                f"\u0627\u0644\u063a\u0627\u0626\u0628\u0648\u0646 \u0627\u0644\u064a\u0648\u0645: "
                f"{stats.get('absentToday', 0)}\n"
            )
            context += (
                f"- \u0645\u0639\u062f\u0644 \u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645: "
                f"{stats.get('adherenceRate', 0)}%\n"
            )
            context += (
                f"- \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u062c\u0627\u0632\u0629 "
                f"\u0627\u0644\u0645\u0639\u0644\u0642\u0629: {stats.get('pendingLeaves', 0)}\n"
            )
            if department_stats:
                context += "- \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u0642\u0633\u0627\u0645:\n"
                for department in department_stats:
                    context += (
                        f"  * {department.get('name')}: {department.get('value')} "
                        "\u0645\u0648\u0638\u0641\u064b\u0627\n"
                    )
            return context

        context = "### Current System Snapshot (Live Analytics):\n"
        context += f"- Total Employees: {stats.get('totalEmployees', 0)}\n"
        context += f"- Employees Present Today: {stats.get('presentToday', 0)}\n"
        context += f"- Employees Absent Today: {stats.get('absentToday', 0)}\n"
        context += f"- Adherence Rate: {stats.get('adherenceRate', 0)}%\n"
        context += f"- Pending Leaves: {stats.get('pendingLeaves', 0)}\n"
        if department_stats:
            context += "- Department Distribution:\n"
            for department in department_stats:
                context += f"  * {department.get('name')}: {department.get('value')} employees\n"
        return context

    @classmethod
    def build_full_hr_context(cls, query: str) -> str:
        language = "ar" if cls.is_arabic_text(query) else "en"
        policies = cls.get_relevant_policies(query)
        snapshot = cls.get_system_snapshot_context(language=language)

        if language == "ar":
            system_prompt = (
                "\u0623\u0646\u062a \u0645\u0633\u0627\u0639\u062f HR Companion "
                "\u0627\u0644\u0630\u0643\u064a\u060c \u0648\u0645\u0647\u0645\u062a\u0643 "
                "\u0645\u0633\u0627\u0639\u062f\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 "
                "\u0641\u064a \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f "
                "\u0627\u0644\u0628\u0634\u0631\u064a\u0629 \u0628\u0637\u0631\u064a\u0642\u0629 "
                "\u0645\u0647\u0646\u064a\u0629 \u0648\u0648\u0627\u0636\u062d\u0629 \u0648\u0645\u062e\u062a\u0635\u0631\u0629. "
                "\u0627\u0639\u062a\u0645\u062f \u0641\u0642\u0637 \u0639\u0644\u0649 "
                "\u0627\u0644\u0633\u064a\u0627\u0633\u0627\u062a \u0648\u0628\u064a\u0627\u0646\u0627\u062a "
                "\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u0641\u064a "
                "\u0627\u0644\u0633\u064a\u0627\u0642. \u0625\u0630\u0627 \u0644\u0645 \u062a\u062c\u062f "
                "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0628\u0648\u0636\u0648\u062d "
                "\u0641\u0627\u0630\u0643\u0631 \u0630\u0644\u0643 \u0628\u0635\u0631\u0627\u062d\u0629. "
                "\u0625\u0630\u0627 \u0643\u0627\u0646 \u0633\u0624\u0627\u0644 "
                "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629 "
                "\u0641\u0644\u062a\u0643\u0646 \u0627\u0644\u0625\u062c\u0627\u0628\u0629 "
                "\u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629.\n\n"
                f"{snapshot}\n\n"
                f"{policies}\n"
            )
            return system_prompt

        system_prompt = (
            "You are an HR Companion AI, a helpful and professional HR assistant for the company. "
            "Your goal is to answer queries based on the provided HR policies and current system data. "
            "If the information is not in the context, be honest and say you do not have access to that "
            "specific detail. Maintain a helpful, concise, and professional tone. Respond in the same "
            "language as the user's prompt.\n\n"
            f"{snapshot}\n\n"
            f"{policies}\n"
        )
        return system_prompt

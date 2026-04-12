import time
from importlib import import_module
from typing import Any, Dict

from django.conf import settings

from apps.ai.models import AIInteraction
from apps.ai.services.context_builder import ContextBuilder
from apps.reports.services.analytical_service import AnalyticalService
from shared.logging import get_service_logger

logger = get_service_logger("ai_service")


class LLMService:
    POLICY_QUERY_TERMS = (
        "policy",
        "policies",
        "leave",
        "vacation",
        "attendance",
        "salary",
        "payroll",
        "approval",
        "approvals",
        "\u0633\u064a\u0627\u0633\u0629",
        "\u0633\u064a\u0627\u0633\u0627\u062a",
        "\u0625\u062c\u0627\u0632\u0629",
        "\u0627\u0644\u0625\u062c\u0627\u0632\u0629",
        "\u062d\u0636\u0648\u0631",
        "\u0631\u0627\u062a\u0628",
        "\u0631\u0648\u0627\u062a\u0628",
        "\u0645\u0648\u0627\u0641\u0642\u0629",
        "\u0645\u0648\u0627\u0641\u0642\u0627\u062a",
    )

    @classmethod
    def _is_policy_query(cls, prompt: str) -> bool:
        normalized_prompt = prompt.lower()
        return any(term in normalized_prompt for term in cls.POLICY_QUERY_TERMS)

    @staticmethod
    def _extract_policy_excerpt(policy, prompt: str) -> str:
        language = "ar" if ContextBuilder.is_arabic_text(prompt) else "en"
        content = policy.get_localized_content(language)
        sentences = [
            sentence.strip()
            for sentence in __import__("re").split(r"(?<=[\.\!\?؟])\s+", content)
            if sentence.strip()
        ]
        if not sentences:
            return content[:320].rstrip()

        words = ContextBuilder._expand_query_terms(prompt, ContextBuilder._tokenize_query(prompt))
        if not words:
            return sentences[0][:320].rstrip()

        ranked_sentences = sorted(
            sentences,
            key=lambda sentence: sum(sentence.lower().count(word) for word in words),
            reverse=True,
        )
        return ranked_sentences[0][:320].rstrip()

    @classmethod
    def _build_grounded_policy_answer(cls, prompt: str) -> Dict[str, Any] | None:
        policies = ContextBuilder.get_relevant_policy_documents(prompt, limit=3)
        if not policies:
            return None

        is_arabic = ContextBuilder.is_arabic_text(prompt)
        language = "ar" if is_arabic else "en"
        lead_policy = policies[0]
        lead_policy_title = lead_policy.get_localized_title(language)
        lead_excerpt = cls._extract_policy_excerpt(lead_policy, prompt)

        if is_arabic:
            answer_lines = [
                "بحسب سياسة الموارد البشرية الحالية:",
                f"{lead_policy_title}: {lead_excerpt}",
            ]
            if len(policies) > 1:
                answer_lines.append("سياسات ذات صلة:")
                answer_lines.extend(f"- {policy.get_localized_title(language)}" for policy in policies[1:])
            answer_lines.append("إذا رغبت، أستطيع تلخيص خطوات التقديم أو الموافقة أيضًا.")
        else:
            answer_lines = [
                "Based on the current HR policy library:",
                f"{lead_policy_title}: {lead_excerpt}",
            ]
            if len(policies) > 1:
                answer_lines.append("Related policies:")
                answer_lines.extend(f"- {policy.get_localized_title(language)}" for policy in policies[1:])
            answer_lines.append("If needed, I can also summarize the approval flow or required lead time.")

        return {
            "answer": "\n".join(answer_lines),
            "metadata": {
                "grounded": True,
                "source": "policy_documents",
                "matched_policies": [policy.get_localized_title(language) for policy in policies],
            },
        }

    @staticmethod
    def _build_policy_fallback_answer(prompt: str) -> Dict[str, Any]:
        is_arabic = ContextBuilder.is_arabic_text(prompt)
        language = "ar" if is_arabic else "en"
        policies = ContextBuilder.get_relevant_policy_documents(prompt, limit=3)
        if not policies:
            answer = (
                "لم أجد سياسة موارد بشرية مطابقة لهذا السؤال في مكتبة السياسات الحالية. "
                "جرّب صياغة السؤال بتفاصيل أكثر مثل نوع الإجازة أو قاعدة الحضور أو مسار الموافقة."
                if is_arabic
                else "I could not find a matching HR policy for this question in the current policy library. "
                "Try asking with more detail, such as leave type, attendance rule, or approval process."
            )
            return {
                "answer": answer,
                "metadata": {
                    "mock": True,
                    "source": "policy_documents",
                    "matched_policies": [],
                },
            }

        lead_policy = policies[0]
        lead_policy_title = lead_policy.get_localized_title(language)
        lead_policy_content = lead_policy.get_localized_content(language)
        if is_arabic:
            summary_lines = [
                "بالاستناد إلى مكتبة سياسات الموارد البشرية الحالية:",
                f'{lead_policy_title}: {lead_policy_content[:260].rstrip()}',
            ]
        else:
            summary_lines = [
                "Based on the current HR policy library:",
                f"{lead_policy_title}: {lead_policy_content[:260].rstrip()}",
            ]

        if len(policies) > 1:
            summary_lines.append("سياسات ذات صلة:" if is_arabic else "Related policies:")
            summary_lines.extend(f"- {policy.get_localized_title(language)}" for policy in policies[1:])

        summary_lines.append(
            "إذا رغبت، اسأل سؤالًا أكثر تحديدًا للحصول على إجابة أدق."
            if is_arabic
            else "If you need, ask a more specific follow-up question."
        )
        return {
            "answer": "\n".join(summary_lines),
            "metadata": {
                "mock": True,
                "source": "policy_documents",
                "matched_policies": [policy.get_localized_title(language) for policy in policies],
            },
        }

    @staticmethod
    def _build_dashboard_fallback_answer(prompt: str = "") -> Dict[str, Any]:
        is_arabic = ContextBuilder.is_arabic_text(prompt)
        language = "ar" if is_arabic else "en"
        stats = AnalyticalService.get_dashboard_stats(language=language)
        if is_arabic:
            answer = (
                "ملخص النظام الحالي: "
                f"{stats.get('totalEmployees', 0)} موظفًا إجمالًا، "
                f"{stats.get('presentToday', 0)} حاضرون اليوم، "
                f"{stats.get('absentToday', 0)} غائبون اليوم، "
                f"{stats.get('pendingLeaves', 0)} طلبات إجازة معلقة، "
                f"ومعدل التزام يبلغ {stats.get('adherenceRate', 0)}%."
            )
        else:
            answer = (
                "Current system snapshot: "
                f"{stats.get('totalEmployees', 0)} total employees, "
                f"{stats.get('presentToday', 0)} present today, "
                f"{stats.get('absentToday', 0)} absent today, "
                f"{stats.get('pendingLeaves', 0)} pending leave requests, "
                f"and an adherence rate of {stats.get('adherenceRate', 0)}%."
            )
        return {
            "answer": answer,
            "metadata": {
                "mock": True,
                "source": "analytics_snapshot",
            },
        }

    @classmethod
    def _build_fallback_response(cls, prompt: str, system_context: str = "") -> Dict[str, Any]:
        normalized_prompt = prompt.lower()
        is_dashboard_summary = (
            "executive summary" in normalized_prompt
            or "dashboard summary" in normalized_prompt
            or "current system data" in normalized_prompt
            or "system snapshot" in normalized_prompt
            or "الملخص التنفيذي" in prompt
            or "ملخص لوحة التحكم" in prompt
            or "بيانات النظام" in prompt
            or "ملخص النظام" in prompt
        )
        if is_dashboard_summary:
            return cls._build_dashboard_fallback_answer(prompt)
        return cls._build_policy_fallback_answer(prompt)

    @staticmethod
    def _load_provider_class(provider: str):
        provider_map = {
            "openai": ("langchain_openai", "ChatOpenAI"),
            "google": ("langchain_google_genai", "ChatGoogleGenerativeAI"),
        }
        module_name, class_name = provider_map.get(provider, provider_map["openai"])

        try:
            module = import_module(module_name)
        except ModuleNotFoundError as exc:
            logger.warning(
                "AI provider package missing. Falling back to mock responses.",
                provider=provider,
                module=module_name,
                error=str(exc),
            )
            return None

        return getattr(module, class_name, None)

    @staticmethod
    def get_model():
        provider = getattr(settings, "AI_PROVIDER", "openai").lower()
        api_key = getattr(settings, "AI_API_KEY", None)
        model_name = getattr(settings, "AI_MODEL_NAME", None)

        if not api_key:
            logger.warning("AI_API_KEY not configured. Falling back to mock responses.")
            return None

        model_class = LLMService._load_provider_class(provider)
        if model_class is None:
            return None

        if provider == "google":
            return model_class(
                model=model_name or "gemini-2.5-flash",
                google_api_key=api_key,
                max_retries=1,
            )

        return model_class(
            model=model_name or "gpt-4o",
            openai_api_key=api_key,
            max_retries=1,
        )

    @classmethod
    def ask_ai(cls, user, prompt: str, system_context: str = "") -> Dict[str, Any]:
        if cls._is_policy_query(prompt):
            grounded_response = cls._build_grounded_policy_answer(prompt)
            if grounded_response is not None:
                return grounded_response

        model = cls.get_model()
        start_time = time.time()

        if not model:
            return cls._build_fallback_response(prompt, system_context)

        messages = []
        try:
            langchain_messages_module = import_module("langchain_core.messages")
        except ModuleNotFoundError as exc:
            logger.warning(
                "langchain_core is unavailable. Falling back to mock responses.",
                error=str(exc),
            )
            return cls._build_fallback_response(prompt, system_context)

        human_message = getattr(langchain_messages_module, "HumanMessage")
        system_message = getattr(langchain_messages_module, "SystemMessage")
        if system_context:
            messages.append(system_message(content=system_context))
        messages.append(human_message(content=prompt))

        try:
            response = model.invoke(messages)
            answer = response.content

            duration_ms = int((time.time() - start_time) * 1000)
            AIInteraction.objects.create(
                user=user,
                prompt=prompt,
                response=answer,
                response_time_ms=duration_ms,
                context_metadata={"system_context_len": len(system_context)},
            )

            return {
                "answer": answer,
                "metadata": {
                    "provider": getattr(settings, "AI_PROVIDER", "openai"),
                    "duration_ms": duration_ms,
                },
            }
        except Exception as exc:
            logger.error("LLM call failed", error=str(exc))
            fallback_response = cls._build_fallback_response(prompt, system_context)
            fallback_response.setdefault("metadata", {})
            fallback_response["metadata"].update(
                {
                    "provider": getattr(settings, "AI_PROVIDER", "openai"),
                    "fallback_reason": "provider_error",
                    "provider_error": str(exc),
                }
            )
            return fallback_response

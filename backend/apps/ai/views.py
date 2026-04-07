from drf_spectacular.utils import extend_schema
from rest_framework import permissions, response, views

from apps.ai.models import PolicyDocument
from apps.ai.serializers import AIQuerySerializer, AIResponseSerializer, PolicyDocumentSerializer
from apps.ai.services.context_builder import ContextBuilder
from apps.ai.services.llm_service import LLMService
from apps.system.models import Settings


def _is_ai_feature_enabled() -> bool:
    settings_obj = Settings.objects.filter(pk=1).only("general_settings").first()
    general_settings = (settings_obj.general_settings if settings_obj else {}) or {}
    if not isinstance(general_settings, dict):
        return True
    stored_ai = general_settings.get("ai", {})
    if not isinstance(stored_ai, dict):
        return True
    return bool(stored_ai.get("enabled", True))


class AIQueryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=AIQuerySerializer,
        responses={200: AIResponseSerializer},
        summary="Natural language query for AI Assistant",
        description="Ask questions about HR policies or current system status.",
    )
    def post(self, request):
        if not _is_ai_feature_enabled():
            return response.Response(
                {"detail": "AI features are currently disabled."},
                status=403,
            )

        serializer = AIQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prompt = serializer.validated_data["prompt"]
        include_context = serializer.validated_data.get("include_context", True)

        system_context = ""
        if include_context:
            system_context = ContextBuilder.build_full_hr_context(prompt)

        result = LLMService.ask_ai(request.user, prompt, system_context)

        return response.Response(
            {
                "status": "success",
                "answer": result.get("answer", ""),
                "metadata": result.get("metadata", {}),
            }
        )


class AIDashboardSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: AIResponseSerializer},
        summary="AI-generated dashboard summary",
        description="Generates a human-friendly executive summary of the current dashboard KPIs.",
    )
    def get(self, request):
        if not _is_ai_feature_enabled():
            return response.Response(
                {"detail": "AI features are currently disabled."},
                status=403,
            )

        accept_language = request.headers.get("Accept-Language", "").lower()
        preferred_language = "ar" if "ar" in accept_language else "en"
        snapshot = ContextBuilder.get_system_snapshot_context(language=preferred_language)

        if preferred_language == "ar":
            prompt = (
                "\u0642\u062f\u0651\u0645 \u0645\u0644\u062e\u0635\u064b\u0627 "
                "\u062a\u0646\u0641\u064a\u0630\u064a\u064b\u0627 \u0639\u0631\u0628\u064a\u064b\u0627 "
                "\u0645\u0648\u062c\u0632\u064b\u0627 \u0645\u0646 3 \u0625\u0644\u0649 4 "
                "\u062c\u0645\u0644 \u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 "
                "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645 "
                "\u0627\u0644\u062d\u0627\u0644\u064a\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629."
            )
        else:
            prompt = (
                "Please provide a concise, high-level executive summary "
                "(max 3-4 sentences) based on the following current system data."
            )

        result = LLMService.ask_ai(request.user, prompt, snapshot)

        return response.Response(
            {
                "status": "success",
                "answer": result.get("answer", ""),
                "metadata": result.get("metadata", {}),
            }
        )


class PolicyDocumentListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: PolicyDocumentSerializer(many=True)},
        summary="List active HR policies",
        description="Get a list of all active HR policy documents.",
    )
    def get(self, request):
        if not _is_ai_feature_enabled():
            return response.Response(
                {"detail": "AI features are currently disabled."},
                status=403,
            )

        policies = PolicyDocument.objects.filter(is_active=True)
        serializer = PolicyDocumentSerializer(policies, many=True)
        return response.Response(serializer.data)

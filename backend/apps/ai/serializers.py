from rest_framework import serializers
from apps.ai.models import PolicyDocument, AIInteraction

class PolicyDocumentSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()

    def _resolve_language(self) -> str:
        explicit_language = self.context.get("language")
        if explicit_language:
            return explicit_language

        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"

    def get_title(self, obj: PolicyDocument) -> str:
        return obj.get_localized_title(self._resolve_language())

    def get_content(self, obj: PolicyDocument) -> str:
        return obj.get_localized_content(self._resolve_language())

    class Meta:
        model = PolicyDocument
        fields = [
            'id', 'title', 'category', 'content', 
            'version', 'last_updated', 'created_at'
        ]


class AIQuerySerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True, help_text="User's natural language query")
    include_context = serializers.BooleanField(default=True, help_text="Whether to include system snapshot and policies")


class AIResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    metadata = serializers.JSONField()
    status = serializers.CharField()

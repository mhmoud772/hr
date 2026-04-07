from rest_framework import serializers
from apps.ai.models import PolicyDocument, AIInteraction

class PolicyDocumentSerializer(serializers.ModelSerializer):
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

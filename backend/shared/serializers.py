from django.conf import settings
from rest_framework import serializers

from apps.system.models import Settings


class SettingsSerializer(serializers.ModelSerializer):
    ai_enabled = serializers.SerializerMethodField()
    ai_settings = serializers.JSONField(required=False, write_only=True)

    class Meta:
        model = Settings
        fields = [
            "company_settings",
            "attendance_settings",
            "leave_settings",
            "notification_settings",
            "general_settings",
            "ai_enabled",
            "ai_settings",
        ]

    def _get_stored_ai(self, obj) -> dict:
        general_settings = obj.general_settings or {}
        if not isinstance(general_settings, dict):
            return {}
        stored_ai = general_settings.get("ai", {})
        return stored_ai if isinstance(stored_ai, dict) else {}

    def get_ai_runtime_enabled(self, obj) -> bool:
        return bool(getattr(settings, "AI_API_KEY", None))

    def get_ai_enabled(self, obj) -> bool:
        stored_ai = self._get_stored_ai(obj)
        return bool(stored_ai.get("enabled", True))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        stored_ai = self._get_stored_ai(instance)
        features = stored_ai.get("features", {}) if isinstance(stored_ai, dict) else {}
        data["ai_settings"] = {
            "enabled": bool(stored_ai.get("enabled", True)),
            "runtime_enabled": self.get_ai_runtime_enabled(instance),
            "provider": getattr(settings, "AI_PROVIDER", "openai"),
            "model_name": getattr(settings, "AI_MODEL_NAME", "") or "",
            "allow_fallback": bool(stored_ai.get("allow_fallback", True)),
            "access_roles": stored_ai.get("access_roles", ["system_admin", "admin", "hr_manager"]),
            "features": {
                "policy_assistant": bool(features.get("policy_assistant", True)),
                "dashboard_summary": bool(features.get("dashboard_summary", True)),
            },
        }
        return data

    def update(self, instance, validated_data):
        ai_settings = validated_data.pop("ai_settings", None)
        instance = super().update(instance, validated_data)
        if ai_settings is not None:
            general_settings = dict(instance.general_settings or {})
            existing_ai = dict(general_settings.get("ai") or {})
            requested_features = ai_settings.get("features") or {}
            existing_features = dict(existing_ai.get("features") or {})
            existing_features.update(
                {
                    "policy_assistant": bool(requested_features.get("policy_assistant", existing_features.get("policy_assistant", True))),
                    "dashboard_summary": bool(requested_features.get("dashboard_summary", existing_features.get("dashboard_summary", True))),
                }
            )
            existing_ai.update(
                {
                    "enabled": bool(ai_settings.get("enabled", existing_ai.get("enabled", True))),
                    "allow_fallback": bool(ai_settings.get("allow_fallback", existing_ai.get("allow_fallback", True))),
                    "access_roles": list(ai_settings.get("access_roles", existing_ai.get("access_roles", ["system_admin", "admin", "hr_manager"]))),
                    "features": existing_features,
                }
            )
            general_settings["ai"] = existing_ai
            instance.general_settings = general_settings
            instance.save(update_fields=["general_settings", "updated_at"])
        return instance


class HealthCheckResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    database = serializers.CharField()
    redis = serializers.CharField()
    celery = serializers.CharField()
    timestamp = serializers.DateTimeField()


class MetricsResponseSerializer(serializers.Serializer):
    uptime = serializers.CharField()
    api_latency_avg = serializers.CharField()
    active_sessions = serializers.IntegerField()

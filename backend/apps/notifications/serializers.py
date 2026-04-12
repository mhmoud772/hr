from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Notification, NotificationRead


class NotificationSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()
    description = serializers.CharField(source="body", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"

    def _resolve_language(self) -> str:
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"

    @extend_schema_field(serializers.BooleanField())
    def get_read(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.reads.filter(user=user).exists()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["title"] = instance.get_localized_title(language)
        data["body"] = instance.get_localized_body(language)
        data["description"] = instance.get_localized_body(language)
        return data


class NotificationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRead
        fields = "__all__"

from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Notification, NotificationRead


class NotificationSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()
    description = serializers.CharField(source="body", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"

    @extend_schema_field(serializers.BooleanField())
    def get_read(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.reads.filter(user=user).exists()


class NotificationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRead
        fields = "__all__"

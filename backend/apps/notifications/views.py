import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, NotificationRead
from .serializers import NotificationSerializer, NotificationReadSerializer
from .services.notification_service import NotificationService
from apps.authentication.permissions import RolePermission

logger = logging.getLogger(__name__)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    search_fields = ["title", "title_en", "body", "body_en", "channel"]
    ordering_fields = ["created_at", "title", "channel", "status"]

    def get_queryset(self):
        queryset = NotificationService.visible_to_user(self.request.user).distinct()

        read_value = self.request.query_params.get("read")
        if read_value is not None:
            normalized = str(read_value).strip().lower()
            if normalized in {"true", "1", "yes"}:
                queryset = queryset.filter(reads__user=self.request.user)
            elif normalized in {"false", "0", "no"}:
                queryset = queryset.exclude(reads__user=self.request.user)

        channel = str(self.request.query_params.get("channel") or "").strip()
        if channel:
            queryset = queryset.filter(channel=channel)

        return queryset.distinct()

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        NotificationRead.objects.get_or_create(
            notification=notification,
            user=request.user
        )
        return Response({'status': 'read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="mark_read")
    def mark_read(self, request):
        ids = request.data.get("ids") or []
        if not isinstance(ids, list):
            return Response({"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        NotificationService.mark_read(request.user, ids)
        return Response({"updated": len(ids)}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        updated = NotificationService.mark_all_read(request.user)
        return Response({'status': 'all marked as read', 'updated': updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        updated = NotificationService.mark_all_read(request.user)
        return Response({"updated": updated}, status=status.HTTP_200_OK)


class NotificationReadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationRead.objects.all()
    serializer_class = NotificationReadSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]

    def get_queryset(self):
        return NotificationRead.objects.filter(user=self.request.user)

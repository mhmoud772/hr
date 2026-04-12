from django.contrib.auth import get_user_model
from django.db import transaction

from apps.notifications.models import Notification, NotificationRead
from shared.logging import StructuredLogger

User = get_user_model()
logger = StructuredLogger(__name__)


class NotificationService:
    @staticmethod
    def visible_to_user(user):
        return Notification.objects.filter(recipient__isnull=True) | Notification.objects.filter(
            recipient=user,
        )

    @staticmethod
    def unread_for_user(user):
        return NotificationService.visible_to_user(user).exclude(reads__user=user)

    @staticmethod
    def send_notification(
        recipient,
        title,
        body,
        channel="app",
        status=None,
        title_en=None,
        body_en=None,
    ):
        channel_value = str(channel or "app").strip().lower() or "app"
        status_value = status or ("queued" if channel_value in {"email", "sms"} else "sent")
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            title_en=title_en or "",
            body=body,
            body_en=body_en or "",
            channel=channel_value,
            status=status_value,
        )
        logger.info(
            "Notification sent",
            recipient=recipient.username if recipient else "ALL",
            title=title,
            channel=channel_value,
        )

        if status_value == "queued" and channel_value in {"email", "sms"}:
            from apps.notifications.tasks import send_notification_async

            send_notification_async.delay(notification.id)

        return notification

    @staticmethod
    def mark_read(user, notification_ids):
        visible_ids = {
            str(notification_id)
            for notification_id in NotificationService.visible_to_user(user).values_list("id", flat=True)
        }
        with transaction.atomic():
            for nid in notification_ids:
                normalized_id = str(nid)
                if normalized_id not in visible_ids:
                    continue
                NotificationRead.objects.get_or_create(notification_id=normalized_id, user=user)
            logger.info("Notifications marked as read", user=user.username, count=len(notification_ids))

    @staticmethod
    def mark_all_read(user):
        unread_ids = NotificationService.unread_for_user(user).values_list("id", flat=True)
        with transaction.atomic():
            for nid in unread_ids:
                NotificationRead.objects.get_or_create(notification_id=nid, user=user)

        logger.info("All notifications marked as read", user=user.username, count=len(unread_ids))
        return len(unread_ids)

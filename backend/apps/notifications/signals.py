from __future__ import annotations

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.notifications.models import Notification, NotificationRead
from apps.notifications.realtime import broadcast_notification_event, broadcast_resource_update


@receiver(post_save, sender=Notification)
def broadcast_notification_on_create(sender, instance, created, **kwargs):
    if not created:
        return

    transaction.on_commit(lambda: broadcast_notification_event(instance))


@receiver(post_save, sender=NotificationRead)
def broadcast_notification_read_update(sender, instance, created, **kwargs):
    if not created:
        return

    transaction.on_commit(
        lambda: broadcast_resource_update(
            resource="notifications",
            model="notification",
            action="read",
            object_id=instance.notification_id,
            user_id=instance.user_id,
        )
    )

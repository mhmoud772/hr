from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

UPDATES_GROUP = "updates.broadcast"


def user_updates_group(user_id) -> str:
    return f"updates.user.{user_id}"


def _send_to_group(group_name: str, payload: dict) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "broadcast.message",
            "payload": payload,
        },
    )


def broadcast_notification_event(notification) -> None:
    payload = {
        "type": "notification",
        "notification": {
            "id": str(notification.id),
            "title": notification.title,
            "body": notification.body,
            "channel": notification.channel,
            "status": notification.status,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
        },
        "payload": {
            "resource": "notifications",
            "notificationId": str(notification.id),
        },
    }
    if notification.recipient_id:
        _send_to_group(user_updates_group(notification.recipient_id), payload)
        return
    _send_to_group(UPDATES_GROUP, payload)


def broadcast_resource_update(
    *,
    resource: str,
    model: str,
    action: str,
    object_id: str | int | None = None,
    user_id: int | None = None,
) -> None:
    payload = {
        "type": "update",
        "message": {
            "model": model,
            "action": action,
        },
        "payload": {
            "resource": resource,
            "action": action,
            "id": str(object_id) if object_id is not None else None,
        },
    }
    if user_id:
        _send_to_group(user_updates_group(user_id), payload)
        return
    _send_to_group(UPDATES_GROUP, payload)

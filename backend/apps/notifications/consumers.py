from __future__ import annotations

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.notifications.realtime import UPDATES_GROUP, user_updates_group
from apps.notifications.services.notification_service import NotificationService


class UpdatesConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user_group = user_updates_group(user.id)
        await self.channel_layer.group_add(UPDATES_GROUP, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        await self.send_json(
            {
                "type": "connected",
                "unreadCount": await self.get_unread_count(user),
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        await self.channel_layer.group_discard(UPDATES_GROUP, self.channel_name)

    async def receive_json(self, content, **kwargs):
        message_type = content.get("type")
        if message_type == "ping":
            await self.send_json({"type": "pong"})

    async def broadcast_message(self, event):
        await self.send_json(event["payload"])

    @database_sync_to_async
    def get_unread_count(self, user):
        return NotificationService.unread_for_user(user).count()

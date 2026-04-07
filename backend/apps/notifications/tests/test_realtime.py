from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.employees.models import Employee
from apps.notifications.models import NotificationRead
from apps.notifications.services.notification_service import NotificationService
from config.asgi import application

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="notify_api_user", password="Pass12345!")
        login = self.client.post(
            "/api/auth/login",
            {"username": "notify_api_user", "password": "Pass12345!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['accessToken']}")

    def test_notifications_support_read_filter_and_mark_read_actions(self):
        from django.urls import reverse
        personal = NotificationService.send_notification(self.user, "Personal", "Body")
        global_notification = NotificationService.send_notification(None, "Global", "Body")
        hidden_user = User.objects.create_user(username="other_notify_user", password="Pass12345!")
        NotificationService.send_notification(hidden_user, "Other", "Body")
        NotificationRead.objects.create(notification=personal, user=self.user)

        list_url = reverse("notification-list")
        unread_response = self.client.get(list_url, {"read": "false"})
        self.assertEqual(unread_response.status_code, status.HTTP_200_OK)
        data = unread_response.data
        if isinstance(data, dict) and "results" in data:
            unread_items = data["results"]
        else:
            unread_items = data if isinstance(data, list) else []
        unread_ids = {str(item["id"]) for item in unread_items}
        self.assertEqual(unread_ids, {str(global_notification.id)})

        mark_read_url = reverse("notification-mark-read")
        mark_read = self.client.post(
            mark_read_url,
            {"ids": [str(global_notification.id)]},
            format="json",
        )
        self.assertEqual(mark_read.status_code, status.HTTP_200_OK)
        self.assertTrue(
            NotificationRead.objects.filter(notification=global_notification, user=self.user).exists(),
        )

        mark_all_url = reverse("notification-mark-all-read")
        mark_all = self.client.post(mark_all_url, {}, format="json")
        self.assertEqual(mark_all.status_code, status.HTTP_200_OK)
        self.assertIn("updated", mark_all.data)


class UpdatesWebSocketTests(TransactionTestCase):
    reset_sequences = True
    websocket_headers = [
        (b"origin", b"http://localhost"),
        (b"host", b"localhost"),
    ]

    def setUp(self):
        self.user = User.objects.create_user(username="ws_user", password="Pass12345!")

    def test_websocket_accepts_jwt_and_sends_initial_unread_count(self):
        NotificationService.send_notification(self.user, "Direct", "Direct body")
        NotificationService.send_notification(None, "Global", "Global body")
        token = str(AccessToken.for_user(self.user))
        message = async_to_sync(self._connect_and_receive_connected)(token)
        self.assertEqual(message["type"], "connected")
        self.assertEqual(message["unreadCount"], 2)

    def test_websocket_broadcasts_resource_updates(self):
        token = str(AccessToken.for_user(self.user))
        message = async_to_sync(self._create_employee_and_receive_update)(token)
        self.assertEqual(message["type"], "update")
        self.assertEqual(message["message"]["model"], "employee")
        self.assertEqual(message["payload"]["resource"], "employees")

    async def _connect_and_receive_connected(self, token):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/updates/?token={token}",
            headers=self.websocket_headers,
        )
        connected, _subprotocol = await communicator.connect()
        self.assertTrue(connected)
        message = await communicator.receive_json_from()
        await communicator.disconnect()
        return message

    async def _create_employee_and_receive_update(self, token):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/updates/?token={token}",
            headers=self.websocket_headers,
        )
        connected, _subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()

        await database_sync_to_async(Employee.objects.create)(
            employee_code="WS001",
            name="Realtime Employee",
            email="ws-employee@example.com",
            status="active",
        )

        message = await communicator.receive_json_from()
        await communicator.disconnect()
        return message

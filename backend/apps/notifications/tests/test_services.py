from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification
from apps.notifications.services.notification_service import NotificationService

User = get_user_model()

class NotificationServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="notify_user_ser", password="pass")

    def test_send_notification(self):
        notif = NotificationService.send_notification(
            recipient=self.user,
            title="Hello",
            body="Test Body"
        )
        self.assertEqual(notif.title, "Hello")
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 1)

    def test_mark_all_read(self):
        NotificationService.send_notification(self.user, "T1", "B1")
        NotificationService.send_notification(self.user, "T2", "B2")
        
        count = NotificationService.mark_all_read(self.user)
        self.assertEqual(count, 2)

from django.db import models


class Notification(models.Model):
    CHANNEL_CHOICES = (
        ("app", "In-App"),
        ("email", "Email"),
        ("sms", "SMS"),
    )
    STATUS_CHOICES = (
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    )
    recipient = models.ForeignKey("authentication.User", null=True, blank=True, on_delete=models.SET_NULL)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="app")
    title = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    body_en = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def get_localized_title(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.title_en:
            return self.title_en
        return self.title

    def get_localized_body(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.body_en:
            return self.body_en
        return self.body


class NotificationRead(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey("authentication.User", on_delete=models.CASCADE, related_name="notification_reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("notification", "user")

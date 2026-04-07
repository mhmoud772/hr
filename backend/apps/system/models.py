from django.db import models

class Settings(models.Model):
    """
    Global system settings stored in JSON format.
    """
    company_settings = models.JSONField(default=dict, blank=True)
    attendance_settings = models.JSONField(default=dict, blank=True)
    leave_settings = models.JSONField(default=dict, blank=True)
    notification_settings = models.JSONField(default=dict, blank=True)
    general_settings = models.JSONField(default=dict, blank=True)
    theme_settings = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Settings"
        db_table = "core_settings"

    def __str__(self):
        return "Global Settings"

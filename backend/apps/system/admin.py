from django.contrib import admin
from .models import Settings

@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ("__str__",)
    fieldsets = (
        ("Company", {"fields": ("company_settings",)}),
        ("Attendance", {"fields": ("attendance_settings",)}),
        ("Leave", {"fields": ("leave_settings",)}),
        ("Notifications", {"fields": ("notification_settings",)}),
        ("General", {"fields": ("general_settings",)}),
    )

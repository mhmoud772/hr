from django.contrib import admin
from .models import Notification, NotificationRead

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'channel', 'status', 'created_at')
    list_filter = ('status', 'channel')
    search_fields = ('title', 'body', 'recipient__username')

@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ('notification', 'user', 'read_at')

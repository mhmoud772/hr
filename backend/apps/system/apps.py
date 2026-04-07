from django.apps import AppConfig

class SystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.system'
    verbose_name = 'System Settings'

    def ready(self):
        import apps.system.signals  # noqa: F401

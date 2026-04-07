from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Export Prometheus metrics (placeholder)"

    def handle(self, *args, **options):
        self.stdout.write("Metrics export is available via /api/health endpoint.")
        self.stdout.write(self.style.SUCCESS("Done."))

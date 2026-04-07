from django.core.management.base import BaseCommand
from apps.reports.services.analytical_service import AnalyticalService

class Command(BaseCommand):
    help = 'Runs the analytical ETL pipeline to build snapshots and facts from operational data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Target date in YYYY-MM-DD format (defaults to today)',
        )

    def handle(self, *args, **options):
        target_date = options.get('date')
        self.stdout.write(self.style.NOTICE(f"Starting ETL pipeline for {target_date or 'today'}..."))
        
        try:
            AnalyticalService.run_etl_pipeline(target_date)
            self.stdout.write(self.style.SUCCESS("Successfully completed ETL pipeline."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"ETL pipeline failed: {str(e)}"))
            raise e

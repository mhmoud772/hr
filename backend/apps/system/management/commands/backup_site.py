import os
import subprocess
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Backup PostgreSQL database and media files."

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", default="backups", help="Directory to store backups")
        parser.add_argument("--no-media", action="store_true", help="Skip media files backup")

    def handle(self, *args, **options):
        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        db_file = output_dir / f"db_{timestamp}.sql"
        media_file = output_dir / f"media_{timestamp}.tar.gz"

        db_name = settings.DATABASES["default"]["NAME"]
        db_user = settings.DATABASES["default"]["USER"]
        db_host = settings.DATABASES["default"]["HOST"]
        db_port = settings.DATABASES["default"]["PORT"]
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.DATABASES["default"]["PASSWORD"]

        self.stdout.write(f"Backing up database to {db_file}")
        try:
            subprocess.run(
                [
                    "pg_dump",
                    "-h",
                    db_host,
                    "-p",
                    str(db_port),
                    "-U",
                    db_user,
                    "-Fc",
                    "-f",
                    str(db_file),
                    db_name,
                ],
                check=True,
                env=env,
            )
        except Exception as exc:
            raise CommandError(f"Database backup failed: {exc}") from exc

        if not options["no_media"]:
            media_root = Path(settings.MEDIA_ROOT)
            if media_root.exists():
                self.stdout.write(f"Packing media to {media_file}")
                subprocess.run(["tar", "-czf", str(media_file), "-C", str(media_root.parent), media_root.name], check=True)
            else:
                self.stdout.write("MEDIA_ROOT not found; skipping media backup.")

        self.stdout.write(self.style.SUCCESS("Backup completed."))

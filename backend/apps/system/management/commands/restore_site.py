import os
import subprocess
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Restore PostgreSQL database and media files from backups."

    def add_arguments(self, parser):
        parser.add_argument("--db-file", required=True, help="pg_dump file to restore (.sql/.dump)")
        parser.add_argument("--media-archive", help="Media tar.gz archive to restore")
        parser.add_argument("--drop", action="store_true", help="Drop existing schema before restore")

    def handle(self, *args, **options):
        db_file = Path(options["db_file"])
        if not db_file.exists():
            raise CommandError(f"DB file {db_file} not found")

        db_name = settings.DATABASES["default"]["NAME"]
        db_user = settings.DATABASES["default"]["USER"]
        db_host = settings.DATABASES["default"]["HOST"]
        db_port = settings.DATABASES["default"]["PORT"]
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.DATABASES["default"]["PASSWORD"]

        if options["drop"]:
            self.stdout.write("Dropping public schema...")
            subprocess.run(
                ["psql", "-h", db_host, "-p", str(db_port), "-U", db_user, "-d", db_name, "-c", "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"],
                check=True,
                env=env,
            )

        self.stdout.write(f"Restoring database from {db_file}")
        subprocess.run(
            ["pg_restore", "-h", db_host, "-p", str(db_port), "-U", db_user, "-d", db_name, str(db_file)],
            check=True,
            env=env,
        )

        media_archive = options.get("media_archive")
        if media_archive:
            archive_path = Path(media_archive)
            if not archive_path.exists():
                raise CommandError(f"Media archive {archive_path} not found")
            media_root = Path(settings.MEDIA_ROOT)
            media_root.mkdir(parents=True, exist_ok=True)
            self.stdout.write(f"Restoring media from {archive_path}")
            subprocess.run(["tar", "-xzf", str(archive_path), "-C", str(media_root.parent)], check=True)

        self.stdout.write(self.style.SUCCESS("Restore completed."))

import os
import subprocess
import shutil
from datetime import datetime, timedelta
from django.conf import settings
from pathlib import Path
from shared.logging import get_service_logger

logger = get_service_logger("backup")

class BackupService:
    """
    Service for automated database backups and retention management.
    """

    @staticmethod
    def get_backup_dir():
        backup_dir = settings.BASE_DIR / "backups"
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir, exist_ok=True)
        return backup_dir

    @staticmethod
    def perform_backup():
        """
        Performs a full DB backup using pg_dump.
        Note: Requires pg_dump to be in the system PATH.
        """
        db_settings = settings.DATABASES.get("default")
        if not db_settings or "postgresql" not in db_settings.get("ENGINE", ""):
            logger.error("Backup failed: Only PostgreSQL is supported.")
            return None

        db_name = db_settings.get("NAME")
        db_user = db_settings.get("USER")
        db_pass = db_settings.get("PASSWORD")
        db_host = db_settings.get("HOST")
        db_port = db_settings.get("PORT")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"hr_backup_{timestamp}.sql.gz"
        filepath = BackupService.get_backup_dir() / filename

        logger.info("Starting database backup", database=db_name, target=filename)

        # Set environment variable for password to avoid interactive prompt
        env = os.environ.copy()
        env["PGPASSWORD"] = str(db_pass)

        try:
            # Command: pg_dump -h host -p port -U user dbname | gzip > filepath
            # We use a shell-like pipeline for gzip
            cmd = f"pg_dump -h {db_host} -p {db_port} -U {db_user} {db_name} | gzip > \"{filepath}\""

            # Since I'm on Windows (per user information), I should check if gzip is available.
            # If not, I'll use a direct file dump.
            if os.name == 'nt':
                # Simplified for Windows if gzip isn't there
                cmd = f"pg_dump -h {db_host} -p {db_port} -U {db_user} {db_name} --file=\"{filepath.with_suffix('')}\""

            result = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True)

            if result.returncode == 0:
                logger.info("Backup completed successfully", path=str(filepath))
                BackupService.cleanup_old_backups()
                return str(filepath)
            else:
                logger.error("Backup failed", error=result.stderr)
                return None
        except Exception as e:
            logger.error("Backup exception", error=str(e))
            return None

    @staticmethod
    def cleanup_old_backups(days=7):
        """
        Deletes backups older than 'days'.
        """
        backup_dir = BackupService.get_backup_dir()
        cutoff = datetime.now() - timedelta(days=days)

        for file in os.listdir(backup_dir):
            filepath = backup_dir / file
            if os.path.isfile(filepath):
                file_time = datetime.fromtimestamp(os.path.getctime(filepath))
                if file_time < cutoff:
                    os.remove(filepath)
                    logger.info("Deleted old backup", file=file)

    @staticmethod
    def get_backup_list():
        """
        Returns a list of all available backups with metadata.
        """
        backup_dir = BackupService.get_backup_dir()
        backups = []
        for file in os.listdir(backup_dir):
            filepath = backup_dir / file
            stat = os.stat(filepath)
            backups.append({
                "filename": file,
                "size": round(stat.st_size / (1024 * 1024), 2), # MB
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            })
        return sorted(backups, key=lambda x: x["created_at"], reverse=True)

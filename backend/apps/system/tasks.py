import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="apps.system.tasks.task_nightly_backup")
def task_nightly_backup():
    """Run the nightly database backup."""
    from apps.system.services.backup_service import BackupService

    logger.info("Starting nightly backup task")
    result = BackupService.perform_backup()
    if result:
        logger.info("Nightly backup completed: %s", result)
    else:
        logger.error("Nightly backup failed")
    return result


@shared_task(name="apps.system.tasks.run_scheduled_device_time_sync_task")
def run_scheduled_device_time_sync_task():
    """Sync time on all online devices."""
    from apps.devices.models import Device

    logger.info("Starting scheduled device time sync")
    devices = Device.objects.filter(status="online")
    synced = 0

    try:
        from apps.devices.tasks import run_device_sync_time_task
    except ImportError:
        logger.warning("Device sync time task not available")
        return {"status": "skipped", "reason": "task not available"}

    for device in devices:
        try:
            run_device_sync_time_task.delay(device.id, None)
            synced += 1
        except Exception as exc:
            logger.warning("Failed to queue sync for device %s: %s", device.id, exc)

    logger.info("Scheduled device time sync complete: %d/%d queued", synced, devices.count())
    return {"status": "success", "synced": synced, "total": devices.count()}

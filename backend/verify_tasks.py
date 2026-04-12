import os
import django
from celery import Celery

# 1. Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings
from apps.reports.tasks import task_run_analytical_etl
from apps.devices.tasks import task_monitor_device_health
from apps.notifications.tasks import send_email_async
from apps.system.tasks import task_nightly_backup

def verify_celery_broker():
    print("--- 1. Broker Verification ---")
    app = Celery("hr_backend")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    broker_url = settings.CELERY_BROKER_URL
    print(f"Broker configured as: {broker_url}")
    
    try:
        from redis import Redis
        if "redis" in broker_url:
            r = Redis.from_url(broker_url)
            r.ping()
            print("SUCCESS: Redis broker is reachable.")
        else:
            print("INFO: Not using Redis broker.")
    except Exception as exc:
        print(f"WARNING: Cannot connect to broker: {exc}")

def test_task_logic(task_func, name, **kwargs):
    print(f"--- Testing {name} ---")
    try:
        # Using .apply() runs the task synchronously in the current process
        result = task_func.apply(kwargs=kwargs)
        if result.status == "SUCCESS":
            print(f"SUCCESS: {name} executed logic correctly. Result: {result.result}")
        else:
            print(f"FAILED: {name} status: {result.status}. Traceback: {result.traceback}")
    except Exception as exc:
        print(f"EXCEPTION: {name} failed with error: {exc}")

if __name__ == "__main__":
    verify_celery_broker()
    
    # 1. ETL Analytics
    test_task_logic(task_run_analytical_etl, "Analytical ETL", target_date_str="2026-04-01")
    
    # 2. Device Health Monitor
    test_task_logic(task_monitor_device_health, "Device Health Monitor")
    
    # 3. Notification Logic
    # Note: This will attempt to send a real email if configured
    test_task_logic(send_email_async, "Email Notification", subject="Test Celery", message="Celery is working", recipient_list=["test@example.com"])
    
    # 4. System Backup
    # Note: This might fail if pg_dump is not in path, but let's test the orchestration
    test_task_logic(task_nightly_backup, "Nightly Backup")
    
    print("\n--- Verification Complete ---")

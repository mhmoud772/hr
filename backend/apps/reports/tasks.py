from __future__ import annotations
from datetime import date, timedelta
from celery import shared_task
from shared.logging import get_service_logger

logger = get_service_logger("analytical_tasks")

@shared_task
def task_run_analytical_etl(target_date_str=None):
    """
    Periodic task to compute Daily KPIs and run analytical ETL.
    """
    from apps.reports.services.analytical_service import AnalyticalService
    if target_date_str:
        target_date = date.fromisoformat(target_date_str)
    else:
        # Defaults to running for today, or yesterday if run early morning? 
        # Typically run for today
        target_date = date.today()
    
    logger.info("Starting analytical ETL job", date=str(target_date))
    try:
        AnalyticalService.run_etl_pipeline(target_date)
        logger.info("Successfully finished analytical ETL job", date=str(target_date))
        return f"Analytical ETL completed for {target_date}"
    except Exception as e:
        logger.error("Failed to run analytical ETL job", error=str(e), date=str(target_date))
        raise

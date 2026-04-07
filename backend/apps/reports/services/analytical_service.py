import logging
from shared.logging import get_service_logger
from datetime import date, datetime, timedelta
from django.db import models
from django.db.models import Count

# Import operational models ONLY for ETL purposes
from apps.attendance.models import Attendance
from apps.employees.models import Employee, Leave, Department
# Import reports models for serving
from apps.reports.models import (
    AnalyticalMetric, 
    DailyDashboardSnapshot, 
    DepartmentDistributionSnapshot, 
    SystemActivityFact
)

logger = get_service_logger("analytical_service")

class AnalyticalService:
    """
    Central service for computing and retrieving system-wide KPIs and snapshots.
    Strictly separates data serving (Analytical store) from data aggregation (OLTP store).
    """

    # --- Data Serving Methods (Query Analytical Store ONLY) ---

    @staticmethod
    def get_dashboard_stats(days_range=30):
        """
        Retrieves the latest dashboard KPIs and trends from the analytical store.
        Does NOT touch operational tables (Employee, Attendance, etc.).
        """
        today = date.today()
        
        # Get the most recent snapshot
        latest_snap = DailyDashboardSnapshot.objects.order_by("-date").first()
        
        if not latest_snap:
            return AnalyticalService._get_empty_stats()

        # Get department distribution (use same date as latest snapshot)
        dept_dist = DepartmentDistributionSnapshot.objects.filter(date=latest_snap.date)
        department_distribution = [
            {"name": d.department_name, "value": d.employee_count} for d in dept_dist
        ]

        # Get recent activities (Facts)
        recent_acts = SystemActivityFact.objects.order_by("-time")[:10]
        recent_activities = [
            {
                "id": a.activity_id, 
                "name": a.employee_name, 
                "action": a.action, 
                "time": a.time.isoformat(), 
                "type": a.activity_type
            }
            for a in recent_acts
        ]

        # Get attendance trends
        start_date = today - timedelta(days=days_range)
        history_snaps = DailyDashboardSnapshot.objects.filter(
            date__gte=start_date, 
            date__lte=today
        ).order_by("date")
        
        attendance_stats = [
            {"day": s.date.isoformat(), "present": s.present_today, "absent": s.absent_today} 
            for s in history_snaps
        ]

        return {
            "totalEmployees": latest_snap.total_employees,
            "presentToday": latest_snap.present_today,
            "absentToday": latest_snap.absent_today,
            "pendingLeaves": latest_snap.pending_leaves,
            "criticalLeaves": latest_snap.critical_leaves,
            "adherenceRate": latest_snap.adherence_rate,
            "averageLateMinutes": latest_snap.average_late_minutes,
            "attendanceStats": attendance_stats,
            "departmentDistribution": department_distribution,
            "recentActivities": recent_activities,
            # Redundant keys for UI compatibility
            "departmentStats": department_distribution,
            "activityFeed": recent_activities,
        }

    @staticmethod
    def get_attendance_trends(days=30):
        alias = AnalyticalService.get_metrics_database_status()["selected"]
        from apps.reports.models import DailyDashboardSnapshot
        trend_metrics = DailyDashboardSnapshot.objects.using(alias).filter(
            date__gte=date.today() - timedelta(days=days)
        ).order_by("date")
        return [{"date": metric.date.isoformat(), "rate": metric.adherence_rate} for metric in trend_metrics]

    @staticmethod
    def get_ai_context_snapshot():
        """
        Returns a simplified JSON snapshot of the system state for LLM context.
        """
        stats = AnalyticalService.get_dashboard_stats()
        return {
            "headcount": stats.get("totalEmployees", 0),
            "attendance": {
                "present": stats.get("presentToday", 0),
                "absent": stats.get("absentToday", 0),
                "rate": stats.get("adherenceRate", 0),
            },
            "leaves": {
                "pending": stats.get("pendingLeaves", 0),
                "critical": stats.get("criticalLeaves", 0),
            },
            "departments": stats.get("departmentDistribution", [])
        }

    # --- ETL / Data Aggregation Methods (Touch OLTP and Analytical Store) ---

    @classmethod
    def run_etl_pipeline(cls, target_date_str=None):
        """
        Executes the ETL pipeline to build snapshots/facts from operational data.
        Target date defaults to today.
        """
        if isinstance(target_date_str, date):
            target_date = target_date_str
        elif target_date_str:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        else:
            target_date = date.today()

        logger.info(f"Running ETL pipeline for {target_date}")

        # 1. Aggregate Core Metrics from OLTP
        stats = cls._compute_daily_metrics(target_date)
        
        # 2. Persist Snapshot
        DailyDashboardSnapshot.objects.update_or_create(
            date=target_date,
            defaults=stats
        )

        # 3. Aggregate Department Distribution
        cls._refresh_department_distribution(target_date)

        # 4. Aggregate Activity Facts
        cls._refresh_activity_facts(target_date)

        # 5. Legacy Metric storage (optional, for backward compatibility)
        cls._update_analytical_metrics(target_date, stats)

        logger.info(f"ETL pipeline completed for {target_date}")

    @staticmethod
    def _compute_daily_metrics(target_date):
        """Internal helper to aggregate operational data."""
        total_employees = Employee.objects.filter(status="active").count()
        present_today = Attendance.objects.filter(date=target_date, status__in=["present", "late"]).count()
        current_leaves = Leave.objects.filter(
            status="approved", 
            start_date__lte=target_date, 
            end_date__gte=target_date
        ).count()
        
        absent_today = max(total_employees - present_today - current_leaves, 0)
        pending_leaves = Leave.objects.filter(status="pending").count()
        
        # Critical = pending > 2 days
        critical_leaves = Leave.objects.filter(
            status="pending", 
            created_at__date__lte=target_date - timedelta(days=2)
        ).count()
        
        # 30-day Adherence Rate
        window_start = target_date - timedelta(days=30)
        history = Attendance.objects.filter(date__gte=window_start, date__lte=target_date)
        total_count = history.count()
        present_count = history.filter(status__in=["present", "late"]).count()
        adherence_rate = round((present_count / total_count) * 100, 1) if total_count else 0.0

        # Late minutes (avg)
        late_records = Attendance.objects.filter(date=target_date, status="late", check_in__isnull=False)
        total_late_min = 0
        for rec in late_records:
            # Simple assumption: Shift starts at 08:00
            diff = (rec.check_in.hour * 60 + rec.check_in.minute) - 480
            if diff > 0: total_late_min += diff
        
        avg_late = round(total_late_min / late_records.count(), 1) if late_records.exists() else 0.0

        return {
            "total_employees": total_employees,
            "present_today": present_today,
            "absent_today": absent_today,
            "pending_leaves": pending_leaves,
            "critical_leaves": critical_leaves,
            "adherence_rate": adherence_rate,
            "average_late_minutes": avg_late,
        }

    @staticmethod
    def _refresh_department_distribution(target_date):
        DepartmentDistributionSnapshot.objects.filter(date=target_date).delete()
        departments = Department.objects.annotate(count=Count("employee"))
        for dept in departments:
            DepartmentDistributionSnapshot.objects.create(
                date=target_date,
                department_name=dept.name,
                employee_count=dept.count,
            )

    @staticmethod
    def _refresh_activity_facts(target_date):
        # Refresh facts for the target date
        SystemActivityFact.objects.filter(date=target_date).delete()
        
        # Attendance Facts
        attendance = Attendance.objects.filter(date=target_date).select_related("employee")[:50]
        for item in attendance:
            SystemActivityFact.objects.create(
                date=target_date,
                activity_id=f"attendance-{item.id}",
                employee_name=item.employee.name,
                action="سجل حضورًا" if item.status in {"present", "late"} else "سُجل غيابًا",
                time=item.created_at,
                activity_type="attendance"
            )

        # Leave Facts
        leaves = Leave.objects.filter(updated_at__date=target_date).select_related("employee")[:50]
        for item in leaves:
            SystemActivityFact.objects.create(
                date=target_date,
                activity_id=f"leave-{item.id}",
                employee_name=item.employee.name,
                action={
                    "pending": "قُدم طلب إجازة",
                    "approved": "تمت الموافقة على طلب الإجازة",
                    "rejected": "تم رفض طلب الإجازة",
                }.get(item.status, "تم تحديث طلب الإجازة"),
                time=item.updated_at,
                activity_type="leave"
            )

    @staticmethod
    def _update_analytical_metrics(target_date, stats):
        AnalyticalMetric.objects.update_or_create(
            metric_type="headcount", period_start=target_date, period_end=target_date,
            defaults={"value": float(stats["total_employees"])}
        )
        AnalyticalMetric.objects.update_or_create(
            metric_type="attendance_rate", period_start=target_date, period_end=target_date,
            defaults={"value": float(stats["adherence_rate"])}
        )

    @staticmethod
    def get_metrics_database_status():
        """Check connectivity to the analytical database."""
        try:
            from django.db import connections
            conn = connections["analytical"]
            conn.ensure_connection()
            return {"ok": True, "selected": "analytical"}
        except Exception:
            return {"ok": False, "selected": "default", "fallback": True}

    @staticmethod
    def _get_empty_stats():
        return {
            "totalEmployees": 0, "presentToday": 0, "absentToday": 0, "pendingLeaves": 0, "criticalLeaves": 0,
            "adherenceRate": 0.0, "averageLateMinutes": 0, "attendanceStats": [],
            "departmentDistribution": [], "recentActivities": [],
            "departmentStats": [], "activityFeed": [],
        }

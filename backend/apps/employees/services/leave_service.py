from datetime import date

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.employees.models import Leave, LeaveApproval, LeaveBalance
from shared.logging import StructuredLogger
from shared.system import get_settings

logger = StructuredLogger(__name__)


class LeaveService:
    @staticmethod
    def create_leave_request(employee, leave_type, start_date, end_date, reason="", requested_by=None):
        overlaps = Leave.objects.filter(
            employee=employee,
            status__in=["pending", "approved"],
        ).filter(Q(start_date__lte=end_date) & Q(end_date__gte=start_date))
        if overlaps.exists():
            raise ValueError("Overlapping leave request already exists.")

        settings_obj = get_settings()
        leave_settings = (settings_obj.leave_settings or {}) if settings_obj else {}
        min_notice = int(leave_settings.get("minAdvanceNotice", 0))
        if min_notice > 0 and (start_date - date.today()).days < min_notice:
            raise ValueError(f"Leave requests require at least {min_notice} days advance notice.")

        balance = LeaveBalance.objects.filter(employee=employee, leave_type=leave_type).first()
        days_requested = (end_date - start_date).days + 1
        if balance and balance.total_days > 0:
            if (balance.used_days + days_requested) > balance.total_days:
                raise ValueError("Insufficient leave balance.")

        with transaction.atomic():
            leave = Leave.objects.create(
                employee=employee,
                leave_type=leave_type,
                start_date=start_date,
                end_date=end_date,
                days=days_requested,
                reason=reason,
                status="pending",
                requested_by=requested_by,
            )

            if not leave_settings.get("requireApproval", True):
                LeaveService.approve_leave(leave, user=requested_by, comment="Auto-approved")

            logger.info(
                "Leave request created",
                employee=employee.employee_code,
                leave_id=leave.id,
                days=days_requested,
            )
            return leave

    @staticmethod
    def approve_leave(leave, user, comment=""):
        if leave.status != "pending":
            raise ValueError("Only pending leave requests can be approved.")

        with transaction.atomic():
            leave.status = "approved"
            leave.approved_by = user
            leave.approved_at = timezone.now()
            leave.save(update_fields=["status", "approved_by", "approved_at"])

            LeaveApproval.objects.create(
                leave=leave,
                approver=user,
                status="approved",
                comment=comment,
            )

            balance, _ = LeaveBalance.objects.get_or_create(
                employee=leave.employee,
                leave_type=leave.leave_type,
                defaults={"total_days": 0, "used_days": 0},
            )
            balance.used_days += leave.days
            balance.save(update_fields=["used_days"])

            logger.info(
                "Leave request approved",
                leave_id=leave.id,
                approver=user.username,
                new_used_days=balance.used_days,
            )
            return leave

    @staticmethod
    def reject_leave(leave, user, comment=""):
        if leave.status != "pending":
            raise ValueError("Only pending leave requests can be rejected.")

        with transaction.atomic():
            leave.status = "rejected"
            leave.rejected_by = user
            leave.rejected_at = timezone.now()
            leave.save(update_fields=["status", "rejected_by", "rejected_at"])

            LeaveApproval.objects.create(
                leave=leave,
                approver=user,
                status="rejected",
                comment=comment,
            )

            logger.info("Leave request rejected", leave_id=leave.id, rejected_by=user.username)
            return leave

    @staticmethod
    def get_employee_balances(employee):
        return LeaveBalance.objects.filter(employee=employee)

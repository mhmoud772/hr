from __future__ import annotations

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.authentication.models import AuditLog
from apps.attendance.models import Attendance, EmployeeShift, Shift
from apps.system.realtime_registry import MODEL_RESOURCES
from apps.devices.models import (
    BiometricTemplate,
    Device,
    DeviceBackupSnapshot,
    DeviceCommandApproval,
    DeviceFirmwareRollout,
    DeviceGroup,
    DevicePolicy,
)
from apps.employees.models import (
    Asset,
    Department,
    Employee,
    JobTitle,
    Leave,
    PayrollRecord,
    PerformanceReview,
    RecruitmentCandidate,
    TrainingRecord,
)
from apps.notifications.realtime import broadcast_resource_update


def _schedule_update(instance, action: str):
    resource = MODEL_RESOURCES.get(instance.__class__)
    if not resource:
        return

    transaction.on_commit(
        lambda: broadcast_resource_update(
            resource=resource,
            model=instance._meta.model_name,
            action=action,
            object_id=instance.pk,
        )
    )


@receiver(post_save, sender=Employee)
@receiver(post_save, sender=Department)
@receiver(post_save, sender=JobTitle)
@receiver(post_save, sender=Leave)
@receiver(post_save, sender=PayrollRecord)
@receiver(post_save, sender=RecruitmentCandidate)
@receiver(post_save, sender=PerformanceReview)
@receiver(post_save, sender=TrainingRecord)
@receiver(post_save, sender=Asset)
@receiver(post_save, sender=Shift)
@receiver(post_save, sender=EmployeeShift)
@receiver(post_save, sender=Attendance)
@receiver(post_save, sender=Device)
@receiver(post_save, sender=DeviceGroup)
@receiver(post_save, sender=DevicePolicy)
@receiver(post_save, sender=DeviceCommandApproval)
@receiver(post_save, sender=BiometricTemplate)
@receiver(post_save, sender=DeviceFirmwareRollout)
@receiver(post_save, sender=DeviceBackupSnapshot)
@receiver(post_save, sender=AuditLog)
def broadcast_model_save(sender, instance, created, **kwargs):
    _schedule_update(instance, "created" if created else "updated")


@receiver(post_delete, sender=Employee)
@receiver(post_delete, sender=Department)
@receiver(post_delete, sender=JobTitle)
@receiver(post_delete, sender=Leave)
@receiver(post_delete, sender=PayrollRecord)
@receiver(post_delete, sender=RecruitmentCandidate)
@receiver(post_delete, sender=PerformanceReview)
@receiver(post_delete, sender=TrainingRecord)
@receiver(post_delete, sender=Asset)
@receiver(post_delete, sender=Shift)
@receiver(post_delete, sender=EmployeeShift)
@receiver(post_delete, sender=Attendance)
@receiver(post_delete, sender=Device)
@receiver(post_delete, sender=DeviceGroup)
@receiver(post_delete, sender=DevicePolicy)
@receiver(post_delete, sender=DeviceCommandApproval)
@receiver(post_delete, sender=BiometricTemplate)
@receiver(post_delete, sender=DeviceFirmwareRollout)
@receiver(post_delete, sender=DeviceBackupSnapshot)
@receiver(post_delete, sender=AuditLog)
def broadcast_model_delete(sender, instance, **kwargs):
    _schedule_update(instance, "deleted")

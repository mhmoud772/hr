from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .middleware import get_current_user
from .models import (
    Attendance,
    AuditLog,
    Department,
    Device,
    Employee,
    JobTitle,
    Leave,
    Settings,
    Notification,
    EmployeeDocument,
    PayrollRecord,
    RecruitmentCandidate,
    PerformanceReview,
    TrainingRecord,
    Asset,
)


TRACKED_MODELS = (
    Employee,
    Attendance,
    Leave,
    Department,
    JobTitle,
    Device,
    Settings,
    EmployeeDocument,
    PayrollRecord,
    RecruitmentCandidate,
    PerformanceReview,
    TrainingRecord,
    Asset,
)


@receiver(pre_save)
def capture_changes(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS or not instance.pk:
        return
    try:
        original = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    changes = {}
    for field in instance._meta.fields:
        name = field.name
        old = getattr(original, name)
        new = getattr(instance, name)
        if old != new:
            changes[name] = {"from": str(old), "to": str(new)}
    instance._audit_changes = changes  # type: ignore[attr-defined]


@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    action = "create" if created else "update"
    changes = getattr(instance, "_audit_changes", {})
    actor = get_current_user()
    AuditLog.objects.create(
        user=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        changes=changes or {},
    )

    if sender is Leave and created:
        Notification.objects.create(
            recipient=None,
            channel="app",
            title="New leave request",
            body=f"Leave request created for {instance.employee.name}.",
            status="queued",
        )


@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    actor = get_current_user()
    AuditLog.objects.create(
        user=actor if getattr(actor, "is_authenticated", False) else None,
        action="delete",
        model_name=sender.__name__,
        object_id=str(instance.pk),
        changes={},
    )

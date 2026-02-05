from django.contrib import admin
from django.contrib.auth import get_user_model

from .models import (
    Attendance,
    Department,
    Device,
    Employee,
    JobTitle,
    Leave,
    Settings,
    AuditLog,
    Notification,
    DeviceSyncLog,
    LeaveApproval,
    LeaveAttachment,
    LeaveBalance,
    AttendanceImportLog,
)

User = get_user_model()

admin.site.register(User)
admin.site.register(Department)
admin.site.register(JobTitle)
admin.site.register(Employee)
admin.site.register(Attendance)
admin.site.register(Leave)
admin.site.register(Device)
admin.site.register(Settings)
admin.site.register(AuditLog)
admin.site.register(Notification)
admin.site.register(DeviceSyncLog)
admin.site.register(LeaveApproval)
admin.site.register(LeaveAttachment)
admin.site.register(LeaveBalance)
admin.site.register(AttendanceImportLog)

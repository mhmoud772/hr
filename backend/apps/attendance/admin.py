from django.contrib import admin
from .models import Attendance, AttendanceImportLog, Shift, EmployeeShift, BiometricLog

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status', 'check_in', 'check_out')
    list_filter = ('status', 'date')
    search_fields = ('employee__employee_code', 'employee__name')

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'grace_period_minutes')

admin.site.register(AttendanceImportLog)
admin.site.register(EmployeeShift)
admin.site.register(BiometricLog)

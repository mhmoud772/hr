from django.contrib import admin
from .models import (
    Department, JobTitle, Employee, EmployeeDocument, 
    Leave, LeaveAttachment, LeaveApproval, LeaveBalance,
    RecruitmentCandidate, PerformanceReview, TrainingRecord, Asset
)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager_name', 'employee_count')

@admin.register(JobTitle)
class JobTitleAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'level', 'employee_count')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'employee_code', 'department', 'job_title', 'status')
    list_filter = ('status', 'department', 'contract_status')
    search_fields = ('name', 'employee_code', 'email')

@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'leave_type')

admin.site.register(EmployeeDocument)
admin.site.register(LeaveAttachment)
admin.site.register(LeaveApproval)
admin.site.register(LeaveBalance)
admin.site.register(RecruitmentCandidate)
admin.site.register(PerformanceReview)
admin.site.register(TrainingRecord)
admin.site.register(Asset)

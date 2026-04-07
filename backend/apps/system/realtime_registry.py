from apps.authentication.models import AuditLog
from apps.attendance.models import Attendance, EmployeeShift, Shift
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

MODEL_RESOURCES = {
    Employee: "employees",
    Department: "departments",
    JobTitle: "jobTitles",
    Leave: "leaves",
    PayrollRecord: "payroll",
    RecruitmentCandidate: "candidates",
    PerformanceReview: "performance",
    TrainingRecord: "training",
    Asset: "assets",
    Shift: "shifts",
    EmployeeShift: "employee-shifts",
    Attendance: "attendance",
    Device: "devices",
    DeviceGroup: "devices",
    DevicePolicy: "devices",
    DeviceCommandApproval: "devices",
    BiometricTemplate: "devices",
    DeviceFirmwareRollout: "devices",
    DeviceBackupSnapshot: "devices",
    AuditLog: "auditLogs",
}

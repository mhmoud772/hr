from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Attendance,
    Department,
    Device,
    Employee,
    JobTitle,
    Leave,
    Settings,
    Notification,
    NotificationRead,
    DeviceSyncLog,
    LeaveApproval,
    LeaveAttachment,
    LeaveBalance,
    AttendanceImportLog,
    AuditLog,
    EmployeeDocument,
    BiometricLog,
    PayrollRecord,
    RecruitmentCandidate,
    PerformanceReview,
    TrainingRecord,
    Asset,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    permissions = serializers.ListField(child=serializers.CharField(), required=False)
    groups = serializers.PrimaryKeyRelatedField(many=True, queryset=Group.objects.all(), required=False)
    user_permissions = serializers.PrimaryKeyRelatedField(many=True, queryset=Permission.objects.all(), required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "name",
            "is_active",
            "last_login",
            "must_change_password",
            "permissions",
            "password",
            "groups",
            "user_permissions",
        ]

    def get_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.must_change_password = True
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
            instance.must_change_password = False
        instance.save()
        return instance


class DepartmentSerializer(serializers.ModelSerializer):
    parentId = serializers.PrimaryKeyRelatedField(source="parent", queryset=Department.objects.all(), required=False, allow_null=True)
    managerId = serializers.SlugRelatedField(
        source="manager",
        slug_field="employee_code",
        queryset=Employee.objects.all(),
        required=False,
        allow_null=True,
    )
    managerName = serializers.SerializerMethodField()
    employeeCount = serializers.SerializerMethodField()
    sortOrder = serializers.IntegerField(source="sort_order", required=False)

    class Meta:
        model = Department
        fields = ["id", "name", "parentId", "managerId", "managerName", "employeeCount", "sortOrder"]

    def get_managerName(self, obj):
        if getattr(obj, "manager", None):
            return obj.manager.name
        return obj.manager_name or ""

    def get_employeeCount(self, obj):
        if hasattr(obj, "employee_total"):
            return obj.employee_total
        return getattr(obj, "employee_count", 0)


class JobTitleSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", required=False, allow_blank=True)
    nameEn = serializers.CharField(source="name_en", required=False, allow_blank=True)
    minSalary = serializers.DecimalField(source="min_salary", max_digits=12, decimal_places=2, required=False)
    maxSalary = serializers.DecimalField(source="max_salary", max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = JobTitle
        fields = [
            "id",
            "name",
            "nameEn",
            "department",
            "level",
            "minSalary",
            "maxSalary",
            "employee_count",
            "description",
        ]

    def validate(self, attrs):
        min_salary = attrs.get("min_salary")
        max_salary = attrs.get("max_salary")
        if min_salary is not None and max_salary is not None and max_salary < min_salary:
            raise serializers.ValidationError("maxSalary must be greater than minSalary.")
        return attrs

    def create(self, validated_data):
        department_data = validated_data.pop("department", {}).get("name")
        department = None
        if department_data:
            department, _ = Department.objects.get_or_create(name=department_data)
        return JobTitle.objects.create(department=department, **validated_data)

    def update(self, instance, validated_data):
        department_data = validated_data.pop("department", {}).get("name")
        if department_data is not None:
            instance.department, _ = Department.objects.get_or_create(name=department_data)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class EmployeeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="employee_code")
    department = serializers.CharField(source="department.name", required=False, allow_blank=True)
    jobTitle = serializers.CharField(source="job_title.name", required=False, allow_blank=True)
    hireDate = serializers.DateField(source="hire_date", required=False, allow_null=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    nationality = serializers.CharField(required=False, allow_blank=True)
    birthDate = serializers.DateField(source="birth_date", required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True)
    salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    contractStatus = serializers.CharField(source="contract_status", required=False)
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "department",
            "jobTitle",
            "hireDate",
            "status",
            "avatar",
            "avatarUrl",
            "nationality",
            "birthDate",
            "address",
            "salary",
            "contractStatus",
        ]

    def create(self, validated_data):
        employee_code = validated_data.pop("employee_code")
        department_name = validated_data.pop("department", {}).get("name")
        job_title_name = validated_data.pop("job_title", {}).get("name")
        department = None
        job_title = None
        if department_name:
            department, _ = Department.objects.get_or_create(name=department_name)
        if job_title_name:
            job_title, _ = JobTitle.objects.get_or_create(name=job_title_name)
        return Employee.objects.create(
            employee_code=employee_code,
            department=department,
            job_title=job_title,
            **validated_data,
        )

    def update(self, instance, validated_data):
        if "employee_code" in validated_data:
            instance.employee_code = validated_data.pop("employee_code")
        department_name = validated_data.pop("department", {}).get("name")
        job_title_name = validated_data.pop("job_title", {}).get("name")
        if department_name is not None:
            instance.department, _ = Department.objects.get_or_create(name=department_name)
        if job_title_name is not None:
            instance.job_title, _ = JobTitle.objects.get_or_create(name=job_title_name)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate_email(self, value):
        if value and "@" not in value:
            raise serializers.ValidationError("Invalid email address.")
        return value

    def validate_phone(self, value):
        if value and not value.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise serializers.ValidationError("Invalid phone number.")
        return value

    def get_avatarUrl(self, obj):
        request = self.context.get("request")
        if not obj.avatar:
            return ""
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url


class AttendanceSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())
    checkIn = serializers.TimeField(source="check_in", required=False, allow_null=True)
    checkOut = serializers.TimeField(source="check_out", required=False, allow_null=True)
    employeeName = serializers.CharField(source="employee.name", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    workHours = serializers.SerializerMethodField()
    lateMinutes = serializers.SerializerMethodField()
    earlyLeaveMinutes = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employeeId",
            "employeeName",
            "department",
            "date",
            "status",
            "checkIn",
            "checkOut",
            "workHours",
            "lateMinutes",
            "earlyLeaveMinutes",
        ]

    def validate(self, attrs):
        check_in = attrs.get("check_in")
        check_out = attrs.get("check_out")
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError("checkOut must be after checkIn.")
        status_val = attrs.get("status") or getattr(self.instance, "status", None)
        if status_val in ["absent"] and (check_in or check_out):
            raise serializers.ValidationError("Absent records cannot have check-in/out times.")
        return attrs

    def _get_attendance_settings(self):
        settings = Settings.objects.first()
        return (settings.attendance_settings or {}) if settings else {}

    def _time_to_minutes(self, time_val):
        return time_val.hour * 60 + time_val.minute if time_val else None

    def get_workHours(self, obj):
        if not obj.check_in or not obj.check_out:
            return ""
        minutes = self._time_to_minutes(obj.check_out) - self._time_to_minutes(obj.check_in)
        if minutes < 0:
            return ""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"

    def get_lateMinutes(self, obj):
        if not obj.check_in:
            return 0
        settings = self._get_attendance_settings()
        work_start = settings.get("workStartTime")
        late_threshold = settings.get("lateThreshold")
        if not work_start:
            return 0
        from datetime import datetime
        start = datetime.strptime(work_start, "%H:%M").time()
        threshold = datetime.strptime(late_threshold, "%H:%M").time() if late_threshold else start
        threshold_minutes = self._time_to_minutes(threshold)
        check_in_minutes = self._time_to_minutes(obj.check_in)
        if check_in_minutes is None or threshold_minutes is None:
            return 0
        return max(0, check_in_minutes - threshold_minutes)

    def get_earlyLeaveMinutes(self, obj):
        if not obj.check_out:
            return 0
        settings = self._get_attendance_settings()
        work_end = settings.get("workEndTime")
        early_threshold = settings.get("earlyLeaveThreshold")
        if not work_end:
            return 0
        from datetime import datetime
        end = datetime.strptime(work_end, "%H:%M").time()
        threshold = datetime.strptime(early_threshold, "%H:%M").time() if early_threshold else end
        threshold_minutes = self._time_to_minutes(threshold)
        check_out_minutes = self._time_to_minutes(obj.check_out)
        if check_out_minutes is None or threshold_minutes is None:
            return 0
        return max(0, threshold_minutes - check_out_minutes)

class LeaveSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())
    employeeName = serializers.CharField(source="employee.name", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    leaveType = serializers.CharField(source="leave_type")
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    approvals = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = [
            "id",
            "employeeId",
            "employeeName",
            "department",
            "leaveType",
            "startDate",
            "endDate",
            "days",
            "reason",
            "status",
            "created_at",
            "updated_at",
            "approvals",
            "attachments",
        ]

    def validate(self, attrs):
        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)
        employee = attrs.get("employee") or getattr(self.instance, "employee", None)
        if start and end and end < start:
            raise serializers.ValidationError("endDate must be after startDate.")
        if start and end:
            computed_days = (end - start).days + 1
            attrs["days"] = max(1, computed_days)
        if employee and start and end:
            overlap = (
                Leave.objects.filter(employee=employee, status__in=["pending", "approved"])
                .exclude(id=getattr(self.instance, "id", None))
                .filter(start_date__lte=end, end_date__gte=start)
            )
            if overlap.exists():
                raise serializers.ValidationError("Overlapping leave request exists.")
            leave_type = attrs.get("leave_type") or getattr(self.instance, "leave_type", None)
            if leave_type:
                defaults = {"total_days": 0, "used_days": 0}
                settings = Settings.objects.first()
                if settings:
                    leave_settings = settings.leave_settings or {}
                    mapping = {
                        "annual": leave_settings.get("annualLeaveDefault"),
                        "sick": leave_settings.get("sickLeaveDefault"),
                        "emergency": leave_settings.get("emergencyLeaveDefault"),
                    }
                    total = mapping.get(leave_type)
                    if total is not None:
                        defaults["total_days"] = int(total)
                balance, _ = LeaveBalance.objects.get_or_create(
                    employee=employee,
                    leave_type=leave_type,
                    defaults=defaults,
                )
                if balance.total_days == 0 and defaults["total_days"] > 0:
                    balance.total_days = defaults["total_days"]
                    balance.save(update_fields=["total_days"])
                total = balance.total_days
                if total > 0 and (balance.used_days + (attrs.get("days") or 0)) > total:
                    raise serializers.ValidationError("Leave balance exceeded.")
        settings = Settings.objects.first()
        if settings:
            leave_settings = settings.leave_settings or {}
            min_notice = leave_settings.get("minAdvanceNotice")
            if min_notice and start:
                from datetime import date, timedelta
                min_date = date.today() + timedelta(days=int(min_notice))
                if start < min_date:
                    raise serializers.ValidationError("Leave start date violates minimum advance notice.")
        return attrs

    def get_approvals(self, obj):
        return LeaveApprovalSerializer(obj.approvals.all(), many=True).data

    def get_attachments(self, obj):
        return LeaveAttachmentSerializer(obj.attachments.all(), many=True, context=self.context).data

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["requested_by"] = request.user
        leave = Leave.objects.create(**validated_data)
        settings = Settings.objects.first()
        if settings and (settings.leave_settings or {}).get("requireApproval") is False:
            leave.status = "approved"
            leave.approved_by = request.user if request and request.user.is_authenticated else None
            leave.approved_at = timezone.now()
            leave.save(update_fields=["status", "approved_by", "approved_at"])
            balance, _ = LeaveBalance.objects.get_or_create(
                employee=leave.employee,
                leave_type=leave.leave_type,
                defaults={"total_days": 0, "used_days": 0},
            )
            balance.used_days += leave.days or 0
            balance.save(update_fields=["used_days"])
        return leave


class DeviceSerializer(serializers.ModelSerializer):
    serialNumber = serializers.CharField(source="serial_number")
    ipAddress = serializers.CharField(source="ip_address")
    lastSync = serializers.DateTimeField(source="last_sync", required=False, allow_null=True)
    lastSeen = serializers.DateTimeField(source="last_seen", required=False, allow_null=True)
    employeeCount = serializers.IntegerField(source="employee_count", required=False)

    class Meta:
        model = Device
        fields = [
            "id",
            "name",
            "serialNumber",
            "ipAddress",
            "location",
            "status",
            "lastSync",
            "lastSeen",
            "employeeCount",
        ]

    def validate_serial_number(self, value):
        if not value:
            raise serializers.ValidationError("serialNumber is required.")
        return value

    def validate(self, attrs):
        name = attrs.get("name")
        location = attrs.get("location")
        if name is not None and not str(name).strip():
            raise serializers.ValidationError("Device name is required.")
        if location is not None and not str(location).strip():
            raise serializers.ValidationError("Location is required.")
        return attrs


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())
    fileUrl = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = ["id", "employeeId", "title", "doc_type", "notes", "file", "fileUrl", "filename", "uploaded_by", "uploaded_at"]

    def get_fileUrl(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return ""
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_filename(self, obj):
        return obj.file.name.split("/")[-1] if obj.file else ""


class BiometricLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricLog
        fields = ["id", "device", "employee_code", "timestamp", "action", "raw_data"]


class PayrollRecordSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())

    class Meta:
        model = PayrollRecord
        fields = [
            "id",
            "employeeId",
            "period_start",
            "period_end",
            "base_salary",
            "allowances",
            "deductions",
            "net_salary",
            "status",
            "created_at",
        ]


class RecruitmentCandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruitmentCandidate
        fields = ["id", "name", "email", "phone", "position", "status", "source", "notes", "applied_at"]


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())
    reviewerName = serializers.SerializerMethodField()

    class Meta:
        model = PerformanceReview
        fields = ["id", "employeeId", "period", "rating", "reviewer", "reviewerName", "notes", "created_at"]

    def get_reviewerName(self, obj):
        if obj.reviewer:
            full = f"{obj.reviewer.first_name} {obj.reviewer.last_name}".strip()
            return full or obj.reviewer.username
        return ""


class TrainingRecordSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())

    class Meta:
        model = TrainingRecord
        fields = ["id", "employeeId", "title", "provider", "start_date", "end_date", "status", "notes"]


class AssetSerializer(serializers.ModelSerializer):
    assignedTo = serializers.SlugRelatedField(
        source="assigned_to",
        slug_field="employee_code",
        queryset=Employee.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Asset
        fields = ["id", "name", "serial_number", "category", "status", "assignedTo", "assigned_at", "notes"]


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = [
            "company_settings",
            "attendance_settings",
            "leave_settings",
            "notification_settings",
            "general_settings",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            "company-settings": data.get("company_settings", {}),
            "attendance-settings": data.get("attendance_settings", {}),
            "leave-settings": data.get("leave_settings", {}),
            "notification-settings": data.get("notification_settings", {}),
            "general-settings": data.get("general_settings", {}),
        }

    def to_internal_value(self, data):
        internal = {}
        if "company-settings" in data:
            internal["company_settings"] = data.get("company-settings", {})
        if "attendance-settings" in data:
            internal["attendance_settings"] = data.get("attendance-settings", {})
        if "leave-settings" in data:
            internal["leave_settings"] = data.get("leave-settings", {})
        if "notification-settings" in data:
            internal["notification_settings"] = data.get("notification-settings", {})
        if "general-settings" in data:
            internal["general_settings"] = data.get("general-settings", {})
        return internal


class NotificationSerializer(serializers.ModelSerializer):
    recipientId = serializers.PrimaryKeyRelatedField(source="recipient", queryset=User.objects.all(), required=False, allow_null=True)
    body = serializers.CharField(write_only=True, required=False, allow_blank=True)
    description = serializers.CharField(source="body", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    read = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipientId",
            "channel",
            "title",
            "body",
            "description",
            "status",
            "createdAt",
            "read",
            "type",
        ]

    def get_read(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return NotificationRead.objects.filter(notification=obj, user=request.user).exists()

    def get_type(self, obj):
        status_val = getattr(obj, "status", "")
        if status_val == "failed":
            return "error"
        if status_val == "sent":
            return "success"
        return "info"


class DeviceSyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceSyncLog
        fields = ["id", "device", "status", "message", "started_at", "finished_at"]


class AttendanceImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceImportLog
        fields = ["id", "source", "status", "message", "created_at"]


class LeaveApprovalSerializer(serializers.ModelSerializer):
    approverName = serializers.SerializerMethodField()

    class Meta:
        model = LeaveApproval
        fields = ["id", "approver", "approverName", "status", "comment", "level", "decided_at"]

    def get_approverName(self, obj):
        if obj.approver:
            full = f"{obj.approver.first_name} {obj.approver.last_name}".strip()
            return full or obj.approver.username
        return ""


class LeaveAttachmentSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    class Meta:
        model = LeaveAttachment
        fields = ["id", "filename", "url", "uploaded_at", "uploaded_by"]

    def get_filename(self, obj):
        return obj.file.name.split("/")[-1] if obj.file else ""

    def get_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return ""
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employeeId = serializers.SlugRelatedField(source="employee", slug_field="employee_code", queryset=Employee.objects.all())
    employeeName = serializers.CharField(source="employee.name", read_only=True)
    remainingDays = serializers.SerializerMethodField()

    class Meta:
        model = LeaveBalance
        fields = ["id", "employeeId", "employeeName", "leave_type", "total_days", "used_days", "remainingDays"]

    def get_remainingDays(self, obj):
        return max(0, obj.total_days - obj.used_days)


class AuditLogSerializer(serializers.ModelSerializer):
    userName = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "user", "userName", "action", "model_name", "object_id", "changes", "created_at"]

    def get_userName(self, obj):
        if obj.user:
            full = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return full or obj.user.username
        return ""

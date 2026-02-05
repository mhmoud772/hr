from datetime import timedelta
import logging

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import mixins, status, viewsets, serializers
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)

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
    EmployeeDocument,
    BiometricLog,
    PayrollRecord,
    RecruitmentCandidate,
    PerformanceReview,
    TrainingRecord,
    Asset,
)
from .serializers import (
    AttendanceSerializer,
    DepartmentSerializer,
    DeviceSerializer,
    EmployeeSerializer,
    JobTitleSerializer,
    LeaveSerializer,
    SettingsSerializer,
    UserSerializer,
    NotificationSerializer,
    DeviceSyncLogSerializer,
    LeaveApprovalSerializer,
    LeaveAttachmentSerializer,
    LeaveBalanceSerializer,
    AttendanceImportLogSerializer,
    AuditLogSerializer,
    EmployeeDocumentSerializer,
    BiometricLogSerializer,
    PayrollRecordSerializer,
    RecruitmentCandidateSerializer,
    PerformanceReviewSerializer,
    TrainingRecordSerializer,
    AssetSerializer,
)
from .permissions import RolePermission
from .models import AuditLog

User = get_user_model()

def _validate_security_policy(password: str):
    settings_obj = Settings.objects.first()
    policy = (settings_obj.general_settings or {}).get("security", {}) if settings_obj else {}
    min_len = int(policy.get("passwordMinLength") or 0)
    if min_len and len(password) < min_len:
        raise ValueError(f"Password must be at least {min_len} characters.")
    if policy.get("passwordRequireUpper") and not any(c.isupper() for c in password):
        raise ValueError("Password must include an uppercase letter.")
    if policy.get("passwordRequireNumber") and not any(c.isdigit() for c in password):
        raise ValueError("Password must include a number.")
    if policy.get("passwordRequireSymbol") and not any(not c.isalnum() for c in password):
        raise ValueError("Password must include a symbol.")


def get_employee_for_user(user):
    if not user or not user.is_authenticated:
        return None
    if getattr(user, "email", None):
        employee = Employee.objects.filter(email__iexact=user.email).first()
        if employee:
            return employee
    employee = Employee.objects.filter(employee_code=user.username).first()
    if employee:
        return employee
    # Auto-provision a minimal employee profile for self-service users.
    email = user.email or f"{user.username}@example.com"
    name = f"{user.first_name} {user.last_name}".strip() or user.username
    return Employee.objects.create(
        employee_code=user.username,
        name=name,
        email=email,
        status="active",
    )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = getattr(user, "role", "")
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["accessToken"] = data.get("access")
        data["token"] = data.get("access")
        data["user"] = UserSerializer(self.user).data
        return data


@method_decorator(ratelimit(key="ip", rate="5/m", method="POST", block=True), name="post")
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Do not leak user existence.
            return Response({"status": "ok"})

        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{base_url}/reset-password/confirm?uid={uid}&token={token}"
        subject = "Reset your password"
        message = f"Use this link to reset your password: {reset_link}"
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Password reset email failed to send.")
            return Response(
                {"detail": "Email service is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({"status": "ok"})


class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("newPassword") or request.data.get("new_password")

        if not uid or not token or not new_password:
            return Response({"detail": "Invalid payload."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
            _validate_security_policy(new_password)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        return Response({"status": "ok"})


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        name = request.data.get("name", "")
        if not username or not password:
            return Response({"detail": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            _validate_security_policy(password)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        if name:
            parts = name.split(" ", 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.save()
        user.must_change_password = False
        user.save(update_fields=["must_change_password"])
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "accessToken": str(refresh.access_token),
                "refreshToken": str(refresh),
                "token": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refreshToken")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                return Response({"detail": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "ok"})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("currentPassword")
        new_password = request.data.get("newPassword")
        if not current_password or not new_password:
            return Response({"detail": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(current_password):
            return Response({"detail": "Invalid current password"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            _validate_security_policy(new_password)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.must_change_password = False
        request.user.save(update_fields=["password", "must_change_password"])
        return Response({"status": "ok"})


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["name", "parent", "manager__employee_code"]
    search_fields = ["name", "manager__name", "manager_name"]
    ordering_fields = ["name", "id", "sort_order"]

    def get_queryset(self):
        return (
            Department.objects.all()
            .annotate(employee_total=Count("employee", distinct=True))
            .order_by("parent_id", "sort_order", "name")
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.children.exists():
            return Response(
                {"detail": "Cannot delete department with sub-departments."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Employee.objects.filter(department=instance).exists():
            return Response(
                {"detail": "Cannot delete department with assigned employees."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class JobTitleViewSet(viewsets.ModelViewSet):
    queryset = JobTitle.objects.all()
    serializer_class = JobTitleSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["name", "level", "department__name"]
    search_fields = ["name", "name_en", "department__name"]
    ordering_fields = ["name", "level"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if Employee.objects.filter(job_title=instance).exists():
            return Response(
                {"detail": "Cannot delete job title with assigned employees."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    lookup_field = "employee_code"
    lookup_url_kwarg = "employee_code"
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "department__name", "department__id", "job_title__name", "job_title__id", "contract_status"]
    search_fields = ["name", "employee_code", "email", "phone"]
    ordering_fields = ["name", "employee_code", "hire_date"]

    def get_queryset(self):
        qs = Employee.objects.select_related("department", "job_title")
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            return qs.filter(pk=employee.pk)
        return qs

    @action(detail=False, methods=["get"])
    def me(self, request):
        employee = get_employee_for_user(request.user)
        if not employee:
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(employee)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def summary(self, request, employee_code=None):
        employee = self.get_object()
        attendance = Attendance.objects.filter(employee=employee)
        leaves = Leave.objects.filter(employee=employee)
        data = {
            "attendance": {
                "present": attendance.filter(status="present").count(),
                "absent": attendance.filter(status="absent").count(),
                "late": attendance.filter(status="late").count(),
            },
            "leaves": {
                "pending": leaves.filter(status="pending").count(),
                "approved": leaves.filter(status="approved").count(),
                "rejected": leaves.filter(status="rejected").count(),
            },
        }
        return Response(data)

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        rows = [
            [
                "employee_code",
                "name",
                "email",
                "phone",
                "department",
                "job_title",
                "hire_date",
                "status",
                "nationality",
                "birth_date",
                "address",
                "salary",
                "contract_status",
            ]
        ]
        for emp in self.get_queryset():
            rows.append(
                [
                    emp.employee_code,
                    emp.name,
                    emp.email,
                    emp.phone,
                    emp.department.name if emp.department else "",
                    emp.job_title.name if emp.job_title else "",
                    emp.hire_date.isoformat() if emp.hire_date else "",
                    emp.status,
                    emp.nationality,
                    emp.birth_date.isoformat() if emp.birth_date else "",
                    emp.address,
                    str(emp.salary),
                    emp.contract_status,
                ]
            )
        import csv
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="employees.csv"'
        writer = csv.writer(response)
        writer.writerows(rows)
        return response

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file is required."}, status=status.HTTP_400_BAD_REQUEST)
        import csv
        decoded = file.read().decode("utf-8").splitlines()
        reader = csv.DictReader(decoded)
        created = 0
        updated = 0
        for row in reader:
            code = row.get("employee_code") or row.get("id")
            if not code:
                continue
            department_name = row.get("department", "")
            job_title_name = row.get("job_title", "")
            department = None
            job_title = None
            if department_name:
                department, _ = Department.objects.get_or_create(name=department_name)
            if job_title_name:
                job_title, _ = JobTitle.objects.get_or_create(name=job_title_name)
            defaults = {
                "name": row.get("name", ""),
                "email": row.get("email", ""),
                "phone": row.get("phone", ""),
                "department": department,
                "job_title": job_title,
                "status": row.get("status", "active"),
                "nationality": row.get("nationality", ""),
                "address": row.get("address", ""),
                "contract_status": row.get("contract_status", "permanent"),
            }
            hire_date = row.get("hire_date")
            birth_date = row.get("birth_date")
            salary = row.get("salary")
            if hire_date:
                defaults["hire_date"] = hire_date
            if birth_date:
                defaults["birth_date"] = birth_date
            if salary:
                defaults["salary"] = salary
            emp, created_flag = Employee.objects.update_or_create(employee_code=code, defaults=defaults)
            if created_flag:
                created += 1
            else:
                updated += 1
        return Response({"created": created, "updated": updated})


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "date", "employee__employee_code", "employee__department__id"]
    search_fields = ["employee__name", "employee__employee_code"]
    ordering_fields = ["date", "id"]

    def get_queryset(self):
        qs = Attendance.objects.select_related("employee", "employee__department")
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            qs = qs.filter(employee=employee)
        return qs

    @action(detail=False, methods=["get"])
    def summary(self, request):
        date_param = request.query_params.get("date")
        if date_param:
            qs = Attendance.objects.filter(date=date_param)
        else:
            qs = Attendance.objects.all()
        total = qs.count()
        present = qs.filter(status="present").count()
        absent = qs.filter(status="absent").count()
        late = qs.filter(status="late").count()
        return Response({
            "total": total,
            "present": present,
            "absent": absent,
            "late": late,
        })

    @action(detail=False, methods=["post"])
    def close_day(self, request):
        date_param = request.data.get("date")
        if not date_param:
            return Response({"detail": "date is required."}, status=status.HTTP_400_BAD_REQUEST)
        settings = Settings.objects.first()
        end_time = None
        if settings:
            end_str = (settings.attendance_settings or {}).get("workEndTime")
            if end_str:
                from datetime import datetime
                end_time = datetime.strptime(end_str, "%H:%M").time()
        updated = 0
        if end_time:
            updated = Attendance.objects.filter(date=date_param, check_out__isnull=True, status__in=["present", "late"]).update(check_out=end_time)
        return Response({"updated": updated})

    @action(detail=False, methods=["post"])
    def import_logs(self, request):
        source = request.data.get("source", "device")
        log = AttendanceImportLog.objects.create(source=source, status="running")
        log.status = "success"
        log.message = "Imported attendance records"
        log.save(update_fields=["status", "message"])
        serializer = AttendanceImportLogSerializer(log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def import_history(self, request):
        logs = AttendanceImportLog.objects.all()[:10]
        serializer = AttendanceImportLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        status_param = request.query_params.get("status")
        department = request.query_params.get("department")
        job_title = request.query_params.get("job_title")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        if status_param:
            qs = qs.filter(status=status_param)
        if department:
            qs = qs.filter(employee__department__id=department)
        if job_title:
            qs = qs.filter(employee__job_title__name=job_title)
        if employee_code:
            qs = qs.filter(employee__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "leave_type", "employee__employee_code", "employee__department__id"]
    search_fields = ["employee__name", "employee__employee_code", "reason"]
    ordering_fields = ["start_date", "end_date", "created_at"]

    def get_queryset(self):
        qs = Leave.objects.select_related("employee", "employee__department")
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        department = self.request.query_params.get("department")
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(end_date__lte=end)
        if department:
            qs = qs.filter(employee__department__id=department)
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            qs = qs.filter(employee=employee)
        return qs

    def _notify(self, title: str, body: str, recipient=None, template_key: str | None = None, context: dict | None = None):
        Notification.objects.create(title=title, body=body, recipient=recipient, channel="app", status="sent")
        settings_obj = Settings.objects.first()
        config = settings_obj.notification_settings if settings_obj else {}
        if config is None:
            config = {}
        if config.get("notificationsEnabled") is False:
            return

        context = context or {}

        def render_template(value: str) -> str:
            result = value or ""
            for key, val in context.items():
                result = result.replace(f"{{{{{key}}}}}", str(val))
            return result

        templates = config.get("templates") or {}
        template = templates.get(template_key, {}) if template_key else {}
        email_subject = render_template(template.get("emailSubject") or title)
        email_body = render_template(template.get("emailBody") or body)
        sms_body = render_template(template.get("smsBody") or body)

        quiet_enabled = config.get("quietHoursEnabled")
        quiet_start = config.get("quietHoursStart")
        quiet_end = config.get("quietHoursEnd")
        in_quiet_hours = False
        if quiet_enabled and quiet_start and quiet_end:
            try:
                from datetime import datetime
                start_time = datetime.strptime(str(quiet_start), "%H:%M").time()
                end_time = datetime.strptime(str(quiet_end), "%H:%M").time()
                now_time = timezone.localtime().time()
                if start_time < end_time:
                    in_quiet_hours = start_time <= now_time <= end_time
                else:
                    in_quiet_hours = now_time >= start_time or now_time <= end_time
            except Exception:
                in_quiet_hours = False

        if config.get("emailNotifications") and recipient and recipient.email:
            if in_quiet_hours:
                Notification.objects.create(
                    title=email_subject,
                    body=email_body,
                    recipient=recipient,
                    channel="email",
                    status="queued",
                )
            else:
                status_val = "sent"
                try:
                    send_mail(
                        email_subject,
                        email_body,
                        settings.DEFAULT_FROM_EMAIL,
                        [recipient.email],
                        fail_silently=False,
                    )
                except Exception:
                    status_val = "failed"
                Notification.objects.create(
                    title=email_subject,
                    body=email_body,
                    recipient=recipient,
                    channel="email",
                    status=status_val,
                )

        if config.get("smsNotifications") and recipient:
            Notification.objects.create(
                title=title,
                body=f"{sms_body} (SMS not configured)",
                recipient=recipient,
                channel="sms",
                status="queued" if in_quiet_hours else "queued",
            )

    def _ensure_balance(self, employee: Employee, leave_type: str):
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
        return balance

    def _apply_balance(self, leave: Leave):
        balance = self._ensure_balance(leave.employee, leave.leave_type)
        if balance.total_days > 0 and (balance.used_days + (leave.days or 0)) > balance.total_days:
            raise ValueError("Leave balance exceeded.")
        balance.used_days += leave.days or 0
        balance.save(update_fields=["used_days"])

    def _can_approve(self, request, leave: Leave):
        if request.user.role in ["system_admin", "admin", "hr_manager", "supervisor"]:
            if request.user.email and leave.employee.email and request.user.email == leave.employee.email:
                return False
            return True
        return False

    def _approval_level_count(self):
        settings = Settings.objects.first()
        if not settings:
            return 2
        leave_settings = settings.leave_settings or {}
        try:
            return int(leave_settings.get("approvalLevels", 2))
        except Exception:
            return 2

    def _approver_level(self, user):
        if user.role == "supervisor":
            return 1
        if user.role in ["system_admin", "admin", "hr_manager"]:
            return 2
        return None

    def perform_create(self, serializer):
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                raise serializers.ValidationError("Employee profile not found.")
            instance = serializer.save(employee=employee)
        else:
            instance = serializer.save()
        self._notify(
            "New leave request",
            f"{instance.employee.name} requested leave ({instance.leave_type}).",
            recipient=None,
            template_key="leaveRequest",
            context={"employee": instance.employee.name},
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._notify(
            "Leave updated",
            f"Leave request updated for {instance.employee.name}.",
            recipient=None,
            template_key="leaveRequest",
            context={"employee": instance.employee.name},
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status == "approved":
            return Response({"detail": "Leave already approved."}, status=status.HTTP_400_BAD_REQUEST)
        if not self._can_approve(request, leave):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        level = self._approver_level(request.user) or 1
        LeaveApproval.objects.create(
            leave=leave,
            approver=request.user,
            status="approved",
            comment=request.data.get("comment", ""),
            level=level,
        )
        total_levels = self._approval_level_count()
        should_finalize = total_levels <= 1 or level >= total_levels
        if should_finalize and request.user.role in ["system_admin", "admin", "hr_manager", "supervisor"]:
            leave.status = "approved"
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.rejected_by = None
            leave.rejected_at = None
            leave.save(update_fields=["status", "approved_by", "approved_at", "rejected_by", "rejected_at"])
            try:
                self._apply_balance(leave)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(leave)
        self._notify(
            "Leave approved",
            f"Leave approved for {leave.employee.name}.",
            recipient=leave.approved_by,
            template_key="leaveApproved",
            context={"employee": leave.employee.name},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status == "rejected":
            return Response({"detail": "Leave already rejected."}, status=status.HTTP_400_BAD_REQUEST)
        if not self._can_approve(request, leave):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        LeaveApproval.objects.create(
            leave=leave,
            approver=request.user,
            status="rejected",
            comment=request.data.get("comment", ""),
            level=2,
        )
        leave.status = "rejected"
        leave.rejected_by = request.user
        leave.rejected_at = timezone.now()
        leave.save(update_fields=["status", "rejected_by", "rejected_at"])
        serializer = self.get_serializer(leave)
        self._notify(
            "Leave rejected",
            f"Leave rejected for {leave.employee.name}.",
            recipient=leave.rejected_by,
            template_key="leaveRejected",
            context={"employee": leave.employee.name},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def attachments(self, request, pk=None):
        leave = self.get_object()
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "File is required."}, status=status.HTTP_400_BAD_REQUEST)
        attachment = LeaveAttachment.objects.create(
            leave=leave,
            file=file,
            uploaded_by=request.user if request.user.is_authenticated else None,
        )
        serializer = LeaveAttachmentSerializer(attachment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def balances(self, request):
        employee_code = request.query_params.get("employee")
        balances = LeaveBalance.objects.all()
        if employee_code:
            balances = balances.filter(employee__employee_code=employee_code)
        if getattr(request.user, "role", "") == "employee":
            employee = get_employee_for_user(request.user)
            if not employee:
                return Response([], status=status.HTTP_200_OK)
            balances = balances.filter(employee=employee)
        serializer = LeaveBalanceSerializer(balances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        status_param = request.query_params.get("status")
        leave_type = request.query_params.get("leave_type")
        department = request.query_params.get("department")
        job_title = request.query_params.get("job_title")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(end_date__lte=end)
        if status_param:
            qs = qs.filter(status=status_param)
        if leave_type:
            qs = qs.filter(leave_type=leave_type)
        if department:
            qs = qs.filter(employee__department__id=department)
        if job_title:
            qs = qs.filter(employee__job_title__name=job_title)
        if employee_code:
            qs = qs.filter(employee__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "location"]
    search_fields = ["name", "serial_number", "ip_address"]
    ordering_fields = ["name", "last_sync"]

    @action(detail=True, methods=["post"])
    def sync(self, request, pk=None):
        device = self.get_object()
        log = DeviceSyncLog.objects.create(device=device, status="running")
        # Simulate sync: update last_sync/last_seen and employee_count
        device.status = "online"
        device.last_sync = timezone.now()
        device.last_seen = timezone.now()
        device.employee_count = Employee.objects.count()
        device.save(update_fields=["status", "last_sync", "last_seen", "employee_count"])
        log.status = "success"
        log.message = "Sync completed"
        log.finished_at = timezone.now()
        log.save(update_fields=["status", "message", "finished_at"])
        return Response({"status": "ok", "device": DeviceSerializer(device).data, "log": DeviceSyncLogSerializer(log).data})

    @action(detail=True, methods=["get"])
    def sync_logs(self, request, pk=None):
        device = self.get_object()
        logs = device.sync_logs.all()[:10]
        serializer = DeviceSyncLogSerializer(logs, many=True)
        return Response(serializer.data)

    def _attendance_threshold(self):
        settings_obj = Settings.objects.first()
        attendance_settings = settings_obj.attendance_settings if settings_obj else {}
        work_start = attendance_settings.get("workStartTime") if attendance_settings else None
        late_threshold = attendance_settings.get("lateThreshold") if attendance_settings else None
        if not work_start:
            return None
        try:
            from datetime import datetime
            start = datetime.strptime(work_start, "%H:%M").time()
            threshold = datetime.strptime(late_threshold, "%H:%M").time() if late_threshold else start
            return threshold
        except Exception:
            return None

    def _apply_biometric_log(self, log_item):
        employee_code = log_item.get("employee_code") or log_item.get("employeeId") or log_item.get("employee")
        if not employee_code:
            return False
        employee = Employee.objects.filter(employee_code=employee_code).first()
        if not employee:
            return False
        timestamp = log_item.get("timestamp") or log_item.get("time")
        if not timestamp:
            return False
        try:
            from datetime import datetime
            ts = datetime.fromisoformat(str(timestamp))
        except Exception:
            return False
        action = log_item.get("action")
        if not action:
            if log_item.get("check_in"):
                action = "check_in"
            elif log_item.get("check_out"):
                action = "check_out"
        if action not in ["check_in", "check_out"]:
            return False

        BiometricLog.objects.create(
            device=self.get_object(),
            employee_code=employee_code,
            timestamp=ts,
            action=action,
            raw_data=log_item,
        )

        attendance, _created = Attendance.objects.get_or_create(
            employee=employee,
            date=ts.date(),
            defaults={"status": "present"},
        )
        if action == "check_in":
            attendance.check_in = ts.time()
            threshold = self._attendance_threshold()
            if threshold and attendance.check_in and attendance.check_in > threshold:
                attendance.status = "late"
            else:
                attendance.status = "present"
        if action == "check_out":
            attendance.check_out = ts.time()
            if attendance.status not in ["late", "present"]:
                attendance.status = "present"
        attendance.save()
        return True

    @action(detail=True, methods=["post"])
    def ingest(self, request, pk=None):
        device = self.get_object()
        logs = request.data.get("logs", [])
        if not isinstance(logs, list):
            return Response({"detail": "logs must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        created = 0
        for item in logs:
            if isinstance(item, dict) and self._apply_biometric_log(item):
                created += 1
        device.last_sync = timezone.now()
        device.last_seen = timezone.now()
        device.status = "online"
        device.save(update_fields=["last_sync", "last_seen", "status"])
        return Response({"created": created})


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.select_related("employee", "uploaded_by")
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    parser_classes = [MultiPartParser, FormParser]
    filterset_fields = ["employee__employee_code", "doc_type"]
    search_fields = ["title", "notes", "employee__name"]
    ordering_fields = ["uploaded_at", "title"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        return qs

    def perform_create(self, serializer):
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                raise serializers.ValidationError("Employee profile not found.")
            serializer.save(employee=employee, uploaded_by=self.request.user)
            return
        serializer.save(uploaded_by=self.request.user if self.request.user.is_authenticated else None)


class SettingsViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = SettingsSerializer
    permission_classes = [IsAuthenticated, RolePermission]

    def _has_section_permission(self, request, section: str) -> bool:
        user_permissions = getattr(request.user, "permissions", None) or []
        if not user_permissions:
            return True
        if section in ["company-settings", "general-settings"]:
            return "settings" in user_permissions
        if section == "attendance-settings":
            return "attendance" in user_permissions or "settings" in user_permissions
        if section == "leave-settings":
            return "leaves" in user_permissions or "settings" in user_permissions
        if section == "notification-settings":
            return "notifications" in user_permissions or "settings" in user_permissions
        return "settings" in user_permissions

    def get_object(self):
        settings, _created = Settings.objects.get_or_create(id=1)
        return settings

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        if any(
            key in request.data
            for key in ["company-settings", "general-settings", "attendance-settings", "leave-settings", "notification-settings"]
        ):
            for key in request.data.keys():
                if key in ["company-settings", "general-settings", "attendance-settings", "leave-settings", "notification-settings"]:
                    if not self._has_section_permission(request, key):
                        return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["channel", "status", "recipient"]
    search_fields = ["title", "body"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = Notification.objects.all()
        user = self.request.user
        role = getattr(user, "role", "")
        if role == "employee":
            qs = qs.filter(Q(recipient=user) | Q(recipient__isnull=True))
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.channel == "email" and instance.recipient and instance.recipient.email:
            status_val = "sent"
            try:
                send_mail(
                    instance.title,
                    instance.body,
                    settings.DEFAULT_FROM_EMAIL,
                    [instance.recipient.email],
                    fail_silently=False,
                )
            except Exception:
                status_val = "failed"
            instance.status = status_val
            instance.save(update_fields=["status"])
        if instance.channel == "sms":
            instance.status = "queued"
            instance.save(update_fields=["status"])

    @action(detail=False, methods=["post"])
    def mark_read(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset().filter(id__in=ids)
        reads = [NotificationRead(notification=item, user=request.user) for item in qs]
        NotificationRead.objects.bulk_create(reads, ignore_conflicts=True)
        return Response({"updated": qs.count()})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        qs = self.get_queryset()
        existing = set(
            NotificationRead.objects.filter(user=request.user, notification__in=qs)
            .values_list("notification_id", flat=True)
        )
        reads = [
            NotificationRead(notification=item, user=request.user)
            for item in qs
            if item.id not in existing
        ]
        if reads:
            NotificationRead.objects.bulk_create(reads, ignore_conflicts=True)
        return Response({"updated": len(reads)})

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        read_param = request.query_params.get("read")
        if read_param is not None:
            read_val = str(read_param).lower() in ["1", "true", "yes"]
            if read_val:
                qs = qs.filter(reads__user=request.user)
            else:
                qs = qs.exclude(reads__user=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["model_name", "action", "user"]
    search_fields = ["model_name", "object_id", "user__username", "user__email"]
    ordering_fields = ["created_at"]


class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.select_related("employee")
    serializer_class = PayrollRecordSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "employee__employee_code"]
    search_fields = ["employee__name", "employee__employee_code"]
    ordering_fields = ["period_start", "period_end", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        return qs

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        status_param = request.query_params.get("status")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(period_start__gte=start)
        if end:
            qs = qs.filter(period_end__lte=end)
        if status_param:
            qs = qs.filter(status=status_param)
        if employee_code:
            qs = qs.filter(employee__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class RecruitmentCandidateViewSet(viewsets.ModelViewSet):
    queryset = RecruitmentCandidate.objects.all()
    serializer_class = RecruitmentCandidateSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "position"]
    search_fields = ["name", "email", "phone", "position"]
    ordering_fields = ["applied_at", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", "") == "employee":
            return qs.none()
        return qs

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        status_param = request.query_params.get("status")
        position = request.query_params.get("position")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(applied_at__date__gte=start)
        if end:
            qs = qs.filter(applied_at__date__lte=end)
        if status_param:
            qs = qs.filter(status=status_param)
        if position:
            qs = qs.filter(position__icontains=position)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related("employee", "reviewer")
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["employee__employee_code", "period"]
    search_fields = ["employee__name", "period"]
    ordering_fields = ["created_at", "period"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        return qs

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        period = request.query_params.get("period")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)
        if period:
            qs = qs.filter(period__icontains=period)
        if employee_code:
            qs = qs.filter(employee__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class TrainingRecordViewSet(viewsets.ModelViewSet):
    queryset = TrainingRecord.objects.select_related("employee")
    serializer_class = TrainingRecordSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["employee__employee_code", "status"]
    search_fields = ["employee__name", "title", "provider"]
    ordering_fields = ["start_date", "end_date"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        return qs

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        status_param = request.query_params.get("status")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(end_date__lte=end)
        if status_param:
            qs = qs.filter(status=status_param)
        if employee_code:
            qs = qs.filter(employee__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("assigned_to")
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["status", "category", "assigned_to__employee_code"]
    search_fields = ["name", "serial_number", "category"]
    ordering_fields = ["name", "status"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "role", "") == "employee":
            employee = get_employee_for_user(self.request.user)
            if not employee:
                return qs.none()
            return qs.filter(assigned_to=employee)
        return qs

    @action(detail=False, methods=["get"])
    def report(self, request):
        status_param = request.query_params.get("status")
        category = request.query_params.get("category")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category__icontains=category)
        if employee_code:
            qs = qs.filter(assigned_to__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filterset_fields = ["role", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["username", "email", "last_login", "id"]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user_id = response.data.get("id")
        group_ids = request.data.get("groups", [])
        if user_id and group_ids:
            User.objects.filter(id=user_id).first().groups.set(group_ids)
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    resource_name = "dashboard"

    def get(self, request):
        range_param = request.query_params.get("range", "week")
        now = timezone.now().date()
        if range_param == "today":
            start_date = now
        elif range_param == "month":
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=7)

        attendance_qs = Attendance.objects.filter(date__gte=start_date, date__lte=now)
        attendance_stats = []
        days = (now - start_date).days
        for i in range(days + 1):
            day = start_date + timedelta(days=i)
            present = attendance_qs.filter(date=day, status="present").count()
            absent = attendance_qs.filter(date=day, status="absent").count()
            attendance_stats.append({"day": day.isoformat(), "present": present, "absent": absent})

        present_count = attendance_qs.filter(status="present").count()
        absent_count = attendance_qs.filter(status="absent").count()
        total_attendance = present_count + absent_count
        adherence_rate = round((present_count / total_attendance) * 100, 2) if total_attendance else 0

        settings = Settings.objects.first()
        attendance_settings = settings.attendance_settings if settings else {}
        work_start = attendance_settings.get("workStartTime")
        late_threshold = attendance_settings.get("lateThreshold")
        threshold_time = None
        if work_start:
            try:
                from datetime import datetime
                threshold_time = datetime.strptime(late_threshold or work_start, "%H:%M").time()
            except Exception:
                threshold_time = None
        late_minutes_total = 0
        late_records = attendance_qs.filter(check_in__isnull=False)
        late_count = 0
        if threshold_time:
            for record in late_records:
                check_in = record.check_in
                if check_in and (check_in > threshold_time):
                    minutes = (check_in.hour * 60 + check_in.minute) - (threshold_time.hour * 60 + threshold_time.minute)
                    late_minutes_total += minutes
                    late_count += 1
        average_late_minutes = round(late_minutes_total / late_count, 2) if late_count else 0

        department_distribution = (
            Employee.objects.values("department__name")
            .annotate(value=Count("id"))
            .order_by("department__name")
        )
        department_distribution = [
            {"name": item["department__name"] or "Unassigned", "value": item["value"]}
            for item in department_distribution
        ]

        recent_attendance = Attendance.objects.order_by("-created_at")[:5]
        recent_leaves = Leave.objects.order_by("-created_at")[:5]
        activities = []
        for item in recent_attendance:
            activities.append({
                "id": f"attendance-{item.id}",
                "name": item.employee.name,
                "action": "Checked in" if item.status == "present" else "Attendance update",
                "time": item.created_at.isoformat(),
                "type": "attendance",
            })
        for item in recent_leaves:
            activities.append({
                "id": f"leave-{item.id}",
                "name": item.employee.name,
                "action": f"Leave {item.status}",
                "time": item.created_at.isoformat(),
                "type": "leave",
            })
        activities = sorted(activities, key=lambda x: x["time"], reverse=True)[:10]

        critical_leaves = Leave.objects.filter(status="pending", start_date__lte=now + timedelta(days=3)).count()

        data = {
            "totalEmployees": Employee.objects.count(),
            "presentToday": Attendance.objects.filter(date=now, status="present").count(),
            "absentToday": Attendance.objects.filter(date=now, status="absent").count(),
            "pendingLeaves": Leave.objects.filter(status="pending").count(),
            "criticalLeaves": critical_leaves,
            "adherenceRate": adherence_rate,
            "averageLateMinutes": average_late_minutes,
            "attendanceStats": attendance_stats,
            "departmentDistribution": department_distribution,
            "recentActivities": activities,
        }
        return Response(data)


class BiometricDataView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    resource_name = "devices"

    def get(self, request, device_id):
        logs = BiometricLog.objects.filter(device_id=device_id)[:50]
        serializer = BiometricLogSerializer(logs, many=True)
        return Response(serializer.data)

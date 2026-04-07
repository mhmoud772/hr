import logging
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Department, JobTitle, Employee, EmployeeDocument, 
    Leave, LeaveAttachment, LeaveApproval, LeaveBalance,
    RecruitmentCandidate, PerformanceReview, TrainingRecord, Asset, PayrollRecord
)
from .serializers import (
    DepartmentSerializer, JobTitleSerializer, EmployeeSerializer, 
    EmployeeDocumentSerializer, LeaveSerializer, LeaveBalanceSerializer,
    PayrollRecordSerializer, PerformanceReviewSerializer, AssetSerializer,
    TrainingRecordSerializer, RecruitmentCandidateSerializer
)
from .services.employee_service import EmployeeService
from apps.authentication.permissions import RolePermission

logger = logging.getLogger(__name__)


def _is_full_access_role(user):
    return getattr(user, "role", "") in {"system_admin", "admin", "hr_manager"}

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

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("department", "job_title").order_by("employee_code", "id")
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'department', 'job_title']
    search_fields = ['name', 'employee_code', 'email']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _is_full_access_role(user):
            return qs
        if getattr(user, "role", "") == "employee":
            employee = get_employee_for_user(user)
            if not employee:
                return qs.none()
            return qs.filter(pk=employee.pk)
        if getattr(user, "role", "") == "supervisor":
            dept_scope = EmployeeService.get_department_scope_for_user(user)
            if dept_scope is None:
                return qs.none()
            return qs.filter(department__in=dept_scope)
        return qs.none()

    @action(detail=False, methods=["get"])
    def me(self, request):
        employee = get_employee_for_user(request.user)
        if not employee:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(employee).data)

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        employee = self.get_object()
        return Response(EmployeeService.get_employee_summary(employee))

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.select_related("employee", "employee__department").order_by("-created_at", "-id")
    serializer_class = LeaveSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filterset_fields = ['status', 'employee']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _is_full_access_role(user):
            return qs
        if getattr(user, "role", "") == "employee":
            employee = get_employee_for_user(user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        if getattr(user, "role", "") == "supervisor":
            dept_scope = EmployeeService.get_department_scope_for_user(user)
            if dept_scope is None:
                return qs.none()
            return qs.filter(employee__department__in=dept_scope)
        return qs.none()

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = "approved"
        leave.approved_by = request.user
        leave.approved_at = timezone.now()
        leave.rejected_by = None
        leave.rejected_at = None
        leave.save(update_fields=["status", "approved_by", "approved_at", "rejected_by", "rejected_at", "updated_at"])
        LeaveApproval.objects.create(
            leave=leave,
            approver=request.user,
            status="approved",
            comment=request.data.get("comment", ""),
        )
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = "rejected"
        leave.rejected_by = request.user
        leave.rejected_at = timezone.now()
        leave.approved_by = None
        leave.approved_at = None
        leave.save(update_fields=["status", "rejected_by", "rejected_at", "approved_by", "approved_at", "updated_at"])
        LeaveApproval.objects.create(
            leave=leave,
            approver=request.user,
            status="rejected",
            comment=request.data.get("comment", ""),
        )
        return Response(self.get_serializer(leave).data)

class JobTitleViewSet(viewsets.ModelViewSet):
    queryset = JobTitle.objects.select_related("department").all()
    serializer_class = JobTitleSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["level", "department"]
    search_fields = ["name", "name_en", "description", "department__name"]
    ordering_fields = ["name", "level", "employee_count", "department__name"]

class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.select_related("employee")
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class TrainingRecordViewSet(viewsets.ModelViewSet):
    queryset = TrainingRecord.objects.select_related("employee")
    serializer_class = TrainingRecordSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related("employee", "reviewer")
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("assigned_to")
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.select_related("employee")
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class TrainingRecordViewSet(viewsets.ModelViewSet):
    queryset = TrainingRecord.objects.select_related("employee")
    serializer_class = TrainingRecordSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related("employee", "reviewer")
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("assigned_to")
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
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

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filterset_fields = ['employee', 'leave_type']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _is_full_access_role(user):
            return qs
        if getattr(user, "role", "") == "employee":
            employee = get_employee_for_user(user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        if getattr(user, "role", "") == "supervisor":
            dept_scope = EmployeeService.get_department_scope_for_user(user)
            if dept_scope is None:
                return qs.none()
            return qs.filter(employee__department__in=dept_scope)
        return qs.none()


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _is_full_access_role(user):
            return qs
        if getattr(user, "role", "") == "employee":
            employee = get_employee_for_user(user)
            if not employee:
                return qs.none()
            return qs.filter(employee=employee)
        if getattr(user, "role", "") == "supervisor":
            dept_scope = EmployeeService.get_department_scope_for_user(user)
            if dept_scope is None:
                return qs.none()
            return qs.filter(employee__department__in=dept_scope)
        return qs.none()

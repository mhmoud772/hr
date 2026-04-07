from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Attendance, AttendanceImportLog, Shift, EmployeeShift, BiometricLog
from .serializers import (
    AttendanceSerializer, AttendanceImportLogSerializer, 
    ShiftSerializer, EmployeeShiftSerializer, BiometricLogSerializer
)
from apps.employees.views import get_employee_for_user
from apps.employees.services.employee_service import EmployeeService
from apps.authentication.permissions import RolePermission
from .services.attendance_service import AttendanceService

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("employee", "employee__department").order_by("-date", "-id")
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = [
        'status',
        'employee',
        'date',
        'employee__employee_code',
        'employee__department__id',
    ]
    search_fields = ['employee__name', 'employee__employee_code']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, "role", "") in {"system_admin", "admin", "hr_manager"}:
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

    @action(detail=False, methods=["get"])
    def report(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        employee_code = request.query_params.get("employee")
        qs = self.get_queryset()
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        if employee_code:
            qs = qs.filter(employee__employee_code=employee_code)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        return Response(
            AttendanceService.get_attendance_summary(
                date_param=request.query_params.get("date"),
            )
        )

    @action(detail=False, methods=["post"])
    def close_day(self, request):
        date_param = request.data.get("date") or request.query_params.get("date")
        if not date_param:
            return Response(
                {"detail": "date is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            updated = AttendanceService.close_attendance_day(date_param)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"updated": updated})

    @action(detail=False, methods=["post"])
    def import_logs(self, request):
        source = request.data.get("source") or "device"
        log = AttendanceImportLog.objects.create(
            source=source,
            status="success",
            message="Attendance import request recorded.",
        )
        return Response(
            AttendanceImportLogSerializer(log).data,
            status=status.HTTP_202_ACCEPTED,
        )

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "start_time", "end_time", "created_at"]

class EmployeeShiftViewSet(viewsets.ModelViewSet):
    queryset = EmployeeShift.objects.select_related("employee", "shift").all()
    serializer_class = EmployeeShiftSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["employee__employee_code", "shift", "employee"]
    search_fields = ["employee__name", "employee__employee_code", "shift__name"]
    ordering_fields = ["start_date", "end_date", "created_at"]

class BiometricLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BiometricLog.objects.all()
    serializer_class = BiometricLogSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    filterset_fields = ['device', 'employee_code', 'action']

class AttendanceImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceImportLog.objects.all()
    serializer_class = AttendanceImportLogSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]

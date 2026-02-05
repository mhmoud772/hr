from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceViewSet,
    DashboardSummaryView,
    DepartmentViewSet,
    DeviceViewSet,
    EmployeeViewSet,
    JobTitleViewSet,
    LeaveViewSet,
    LoginView,
    LogoutView,
    MeView,
    NotificationViewSet,
    AuditLogViewSet,
    RegisterView,
    ResetPasswordView,
    ResetPasswordConfirmView,
    ChangePasswordView,
    HealthCheckView,
    SettingsViewSet,
    UserViewSet,
    EmployeeDocumentViewSet,
    BiometricDataView,
    PayrollRecordViewSet,
    RecruitmentCandidateViewSet,
    PerformanceReviewViewSet,
    TrainingRecordViewSet,
    AssetViewSet,
)

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet)
router.register(r"attendance", AttendanceViewSet)
router.register(r"leaves", LeaveViewSet)
router.register(r"devices", DeviceViewSet)
router.register(r"departments", DepartmentViewSet)
router.register(r"job-titles", JobTitleViewSet)
router.register(r"settings", SettingsViewSet, basename="settings")
router.register(r"notifications", NotificationViewSet)
router.register(r"audit-logs", AuditLogViewSet)
router.register(r"users", UserViewSet)
router.register(r"employee-documents", EmployeeDocumentViewSet)
router.register(r"payroll", PayrollRecordViewSet)
router.register(r"recruitment", RecruitmentCandidateViewSet)
router.register(r"performance", PerformanceReviewViewSet)
router.register(r"training", TrainingRecordViewSet)
router.register(r"assets", AssetViewSet)

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/reset-password", ResetPasswordView.as_view(), name="reset-password"),
    path("auth/reset-password/confirm", ResetPasswordConfirmView.as_view(), name="reset-password-confirm"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/change-password", ChangePasswordView.as_view(), name="change-password"),
    path("health", HealthCheckView.as_view(), name="health"),
    path("dashboard/summary", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("biometric/<int:device_id>", BiometricDataView.as_view(), name="biometric-data"),
    path("", include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, JobTitleViewSet, EmployeeViewSet, 
    LeaveViewSet, LeaveBalanceViewSet, PayrollRecordViewSet, 
    RecruitmentCandidateViewSet, TrainingRecordViewSet, 
    PerformanceReviewViewSet, AssetViewSet, EmployeeDocumentViewSet
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'job-titles', JobTitleViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'leave-balances', LeaveBalanceViewSet)
router.register(r'payroll', PayrollRecordViewSet)
router.register(r'recruitment', RecruitmentCandidateViewSet)
router.register(r'training', TrainingRecordViewSet)
router.register(r'performance', PerformanceReviewViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'documents', EmployeeDocumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

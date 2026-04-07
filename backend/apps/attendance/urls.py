from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceViewSet, AttendanceImportLogViewSet, 
    ShiftViewSet, EmployeeShiftViewSet, BiometricLogViewSet
)

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'shifts', ShiftViewSet)
router.register(r'employee-shifts', EmployeeShiftViewSet)
router.register(r'biometric-logs', BiometricLogViewSet)
router.register(r'import-logs', AttendanceImportLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

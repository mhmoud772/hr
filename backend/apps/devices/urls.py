from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ADMSCDataView,
    ADMSGetRequestView,
    DeviceViewSet,
    DeviceSyncLogViewSet,
    DeviceUserMappingViewSet,
)
from .views_control import (
    DeviceTemplateViewSet,
    DeviceBackupSnapshotViewSet,
    DeviceCommandApprovalViewSet,
    DeviceCommandCenterViewSet,
    DeviceFirmwareRolloutViewSet,
    DeviceGroupViewSet,
    DevicePolicyViewSet,
)

router = DefaultRouter()
router.register(
    r"devices",
    DeviceViewSet,
    basename="device",
)
router.register(
    r"device-groups",
    DeviceGroupViewSet,
    basename="device-group",
)
router.register(
    r"device-policies",
    DevicePolicyViewSet,
    basename="device-policy",
)
router.register(
    r"device-user-mappings",
    DeviceUserMappingViewSet,
    basename="device-user-mapping",
)
router.register(
    r"device-sync-logs",
    DeviceSyncLogViewSet,
    basename="device-sync-log",
)
router.register(
    r"biometric-templates",
    DeviceTemplateViewSet,
    basename="biometric-template",
)
router.register(
    r"device-templates",
    DeviceTemplateViewSet,
    basename="device-template",
)
router.register(
    r"device-approvals",
    DeviceCommandApprovalViewSet,
    basename="device-approval",
)
router.register(
    r"device-command-approvals",
    DeviceCommandApprovalViewSet,
    basename="device-command-approval",
)
router.register(
    r"device-firmware-rollouts",
    DeviceFirmwareRolloutViewSet,
    basename="device-firmware-rollout",
)
router.register(
    r"device-backup-snapshots",
    DeviceBackupSnapshotViewSet,
    basename="device-backup-snapshot",
)
router.register(
    r"device-backups",
    DeviceBackupSnapshotViewSet,
    basename="device-backup",
)
router.register(
    r"device-command-center",
    DeviceCommandCenterViewSet,
    basename="device-command-center",
)

urlpatterns = [
    # ADMS Protocol (ZKTeco push)
    path("iclock/cdata", ADMSCDataView.as_view(), name="adms-cdata"),
    path(
        "iclock/getrequest",
        ADMSGetRequestView.as_view(),
        name="adms-get-request",
    ),

    # ViewSets
    path("", include(router.urls)),
]

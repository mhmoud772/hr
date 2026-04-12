from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.devices.models import Device, DeviceCommandApproval, DeviceFirmwareRollout, DeviceGroup, DevicePolicy, DeviceSyncLog

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class DevicesFreeTextBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="devices_free_text_admin",
            password="Admin12345!",
            role="system_admin",
            email="devices-free-text-admin@example.com",
        )
        self.client.force_authenticate(user=self.admin)

        self.group = DeviceGroup.objects.create(
            name="\u0645\u062c\u0645\u0648\u0639\u0629 \u0627\u0644\u0628\u0648\u0627\u0628\u0629",
            name_en="Gate Group",
            description="\u0648\u0635\u0641 \u0639\u0631\u0628\u064a",
            description_en="English description",
        )
        self.policy = DevicePolicy.objects.create(
            name="\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062d\u0636\u0648\u0631",
            name_en="Attendance Policy",
            description="\u0648\u0635\u0641 \u0639\u0631\u0628\u064a",
            description_en="English policy description",
        )
        self.device = Device.objects.create(
            name="\u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064a\u0629",
            name_en="Front Gate",
            serial_number="DEV-FREE-001",
            ip_address="10.20.30.40",
            location="\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u0631\u0626\u064a\u0633\u064a",
            location_en="Headquarters",
            group=self.group,
            policy=self.policy,
        )
        self.approval = DeviceCommandApproval.objects.create(
            command="reboot",
            reason="\u0635\u064a\u0627\u0646\u0629 \u062f\u0648\u0631\u064a\u0629",
            reason_en="Routine maintenance",
            requested_by=self.admin,
        )
        self.approval.target_devices.add(self.device)
        self.rollout = DeviceFirmwareRollout.objects.create(
            target_version="2.0.1",
            device_group=self.group,
            notes="\u062a\u062f\u0631\u064a\u062c \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0634\u0647\u0627\u062f\u0629.",
            notes_en="Staged firmware rollout.",
            requested_by=self.admin,
        )
        self.sync_log = DeviceSyncLog.objects.create(
            device=self.device,
            command="sync",
            reason="\u0645\u0637\u0627\u0628\u0642\u0629 \u0628\u062f\u0648\u0646 \u0634\u0628\u0643\u0629",
            reason_en="Offline synchronization",
            status="success",
            message="Sync completed",
            requested_by=self.admin,
        )

    def test_device_free_text_endpoints_return_localized_english_fields(self):
        approvals_response = self.client.get("/api/device-command-approvals/", HTTP_ACCEPT_LANGUAGE="en")
        rollouts_response = self.client.get("/api/device-firmware-rollouts/", HTTP_ACCEPT_LANGUAGE="en")
        logs_response = self.client.get("/api/device-sync-logs/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(approvals_response.status_code, status.HTTP_200_OK)
        self.assertEqual(rollouts_response.status_code, status.HTTP_200_OK)
        self.assertEqual(logs_response.status_code, status.HTTP_200_OK)

        self.assertEqual(_results(approvals_response.data)[0]["reason"], "Routine maintenance")
        self.assertEqual(_results(rollouts_response.data)[0]["notes"], "Staged firmware rollout.")
        self.assertEqual(_results(logs_response.data)[0]["reason"], "Offline synchronization")
        self.assertEqual(_results(logs_response.data)[0]["message"], "Sync completed")

    def test_device_sync_logs_return_localized_arabic_message(self):
        response = self.client.get("/api/device-sync-logs/", HTTP_ACCEPT_LANGUAGE="ar")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["message"], "اكتملت المزامنة بنجاح.")

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.devices.models import Device, DeviceBackupSnapshot, DeviceGroup, DevicePolicy

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class DeviceBackupsBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="backups_admin",
            password="Admin12345!",
            role="system_admin",
            email="backups-admin@example.com",
        )
        self.client.force_authenticate(user=self.admin)

        self.group = DeviceGroup.objects.create(
            name="مجموعة البوابة",
            name_en="Gate Group",
            description="وصف عربي للمجموعة",
            description_en="English group description",
        )
        self.policy = DevicePolicy.objects.create(
            name="سياسة الحضور",
            name_en="Attendance Policy",
            description="وصف عربي للسياسة",
            description_en="English policy description",
        )
        self.device = Device.objects.create(
            name="البوابة الأمامية",
            name_en="Front Gate",
            serial_number="DEV-BACKUP-001",
            ip_address="10.20.30.40",
            location="المقر الرئيسي",
            location_en="Headquarters",
            group=self.group,
            policy=self.policy,
        )
        self.backup = DeviceBackupSnapshot.objects.create(
            name="نسخة احتياطية للبوابة",
            name_en="Front Gate Backup",
            scope="single",
            device=self.device,
            device_group=self.group,
            created_by=self.admin,
            payload={"devices": []},
        )

    def test_device_backups_list_returns_localized_english_name(self):
        response = self.client.get("/api/device-backups/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["name"], "Front Gate Backup")
        self.assertEqual(item["scope"], "single")

    def test_device_backups_search_matches_english_translation(self):
        response = self.client.get("/api/device-backups/", {"search": "Front Gate Backup"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["name"], "Front Gate Backup")

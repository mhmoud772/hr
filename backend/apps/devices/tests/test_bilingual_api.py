from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.devices.models import Device, DeviceGroup, DevicePolicy

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class DevicesBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="devices_admin",
            password="Admin12345!",
            role="system_admin",
            email="devices-admin@example.com",
        )
        self.client.force_authenticate(user=self.admin)

        self.group = DeviceGroup.objects.create(
            name="مجموعة البوابات",
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
            serial_number="DEV-API-001",
            ip_address="10.20.30.40",
            location="المقر الرئيسي",
            location_en="Headquarters",
            group=self.group,
            policy=self.policy,
        )

    def test_devices_list_returns_localized_english_fields(self):
        response = self.client.get("/api/devices/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["name"], "Front Gate")
        self.assertEqual(item["location"], "Headquarters")

    def test_device_groups_and_policies_return_localized_english_fields(self):
        groups_response = self.client.get("/api/device-groups/", HTTP_ACCEPT_LANGUAGE="en")
        policies_response = self.client.get("/api/device-policies/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(groups_response.status_code, status.HTTP_200_OK)
        self.assertEqual(policies_response.status_code, status.HTTP_200_OK)
        group_item = _results(groups_response.data)[0]
        policy_item = _results(policies_response.data)[0]
        self.assertEqual(group_item["name"], "Gate Group")
        self.assertEqual(group_item["description"], "English group description")
        self.assertEqual(policy_item["name"], "Attendance Policy")
        self.assertEqual(policy_item["description"], "English policy description")

    def test_device_search_matches_english_translation(self):
        response = self.client.get("/api/devices/", {"search": "Headquarters"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["name"], "Front Gate")

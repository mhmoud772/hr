import hashlib
from contextlib import contextmanager
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.attendance.models import Attendance, BiometricLog
from apps.authentication.models import AuditLog
from apps.devices.models import (
    BiometricTemplate,
    BiometricTemplateDistribution,
    Device,
    DeviceBackupSnapshot,
    DeviceCommandApproval,
    DeviceSyncLog,
    DeviceUserMapping,
)
from apps.employees.models import Employee
from apps.devices.utils.security import decrypt_comm_key, is_encrypted_comm_key
from apps.devices.utils.zk_service import DeviceConnectionError
from apps.devices.services import zk_service

User = get_user_model()


class DeviceAutoSyncTimeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin_device",
            password="Admin12345!",
            role="admin",
        )
        self.client.force_authenticate(user=self.user)

    def _payload(self, serial="SN-AUTO-1"):
        return {
            "name": "Front Gate Device",
            "serialNumber": serial,
            "ipAddress": "192.168.1.120",
            "port": 4370,
            "commKey": "0",
            "modelName": "ZKTeco F22",
            "location": "HQ Entrance",
        }

    def _create_device(self, serial="SN-UPD-1"):
        return Device.objects.create(
            name="Office Device",
            serial_number=serial,
            ip_address="192.168.1.10",
            port=4370,
            comm_key="1234",
            model="ZKTeco K40",
            location="Office 1",
            status="offline",
        )

    @patch("apps.devices.views_control.zk_service.sync_time")
    def test_create_device_auto_syncs_time_on_success(self, sync_time_mock):
        response = self.client.post(reverse("device-list"), self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sync_time_mock.assert_called_once()

        device = Device.objects.get(serial_number="SN-AUTO-1")
        self.assertEqual(device.status, "online")
        self.assertIsNotNone(device.last_sync)
        self.assertIsNotNone(device.last_seen)

        log = DeviceSyncLog.objects.filter(device=device).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, "success")

        self.assertTrue(is_encrypted_comm_key(device.comm_key))
        self.assertEqual(decrypt_comm_key(device.comm_key), "0")

    @patch("apps.devices.services.zk_service.sync_time", side_effect=DeviceConnectionError("network down"))
    def test_create_device_keeps_successful_creation_when_auto_sync_fails(self, _sync_time_mock):
        response = self.client.post(reverse("device-list"), self._payload(serial="SN-AUTO-2"), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        device = Device.objects.get(serial_number="SN-AUTO-2")
        self.assertEqual(device.status, "offline")
        self.assertIsNone(device.last_sync)
        self.assertIsNone(device.last_seen)

        log = DeviceSyncLog.objects.filter(device=device).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, "failed")
        self.assertIn("Unable to reach device", log.message)

    @patch("apps.devices.views_control.zk_service.sync_time")
    def test_update_device_connection_settings_auto_syncs_time(self, sync_time_mock):
        device = self._create_device(serial="SN-UPD-2")
        url = reverse("device-detail", args=[device.id])
        payload = {
            "name": device.name,
            "serialNumber": device.serial_number,
            "ipAddress": "192.168.1.11",
            "port": device.port,
            "commKey": device.comm_key,
            "modelName": device.model,
            "location": device.location,
            "status": device.status,
            "employeeCount": device.employee_count,
        }

        response = self.client.put(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sync_time_mock.assert_called_once()

        device.refresh_from_db()
        self.assertEqual(device.ip_address, "192.168.1.11")
        self.assertEqual(device.status, "online")
        self.assertIsNotNone(device.last_sync)
        self.assertIsNotNone(device.last_seen)

        log = DeviceSyncLog.objects.filter(device=device).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, "success")
        self.assertIn("settings update", log.message)

    @patch("apps.devices.views_control.zk_service.sync_time")
    def test_update_device_without_connection_change_does_not_auto_sync(self, sync_time_mock):
        device = self._create_device(serial="SN-UPD-3")
        url = reverse("device-detail", args=[device.id])
        payload = {
            "name": "Office Device Renamed",
            "serialNumber": device.serial_number,
            "ipAddress": device.ip_address,
            "port": device.port,
            "commKey": device.comm_key,
            "modelName": device.model,
            "location": device.location,
            "status": device.status,
            "employeeCount": device.employee_count,
        }

        response = self.client.put(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sync_time_mock.assert_not_called()

        device.refresh_from_db()
        self.assertEqual(device.name, "Office Device Renamed")
        self.assertEqual(device.status, "offline")
        self.assertFalse(DeviceSyncLog.objects.filter(device=device).exists())

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @patch("apps.devices.tasks.zk_service.pull_logs")
    def test_sync_endpoint_handles_datetime_in_raw_data(self, pull_logs_mock):
        device = self._create_device(serial="SN-SYNC-1")
        Employee.objects.create(
            name="Device Employee",
            employee_code="E1001",
            email="device.employee@example.com",
        )
        ts = datetime(2026, 2, 13, 16, 28, 52)
        pull_logs_mock.return_value = [
            {
                "employee_code": "E1001",
                "timestamp": ts,
                "action": "check_in",
                "raw": {"record_time": ts},
            }
        ]

        response = self.client.post(f"/api/devices/{device.id}/sync/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data.get("status"), "queued")

        biometric = BiometricLog.objects.filter(device=device, employee_code="E1001").first()
        self.assertIsNotNone(biometric)
        self.assertEqual(biometric.action, "check_in")
        self.assertIsInstance(biometric.raw_data.get("timestamp"), str)
        self.assertIsInstance(biometric.raw_data.get("raw", {}).get("record_time"), str)

        sync_log = DeviceSyncLog.objects.filter(device=device).first()
        self.assertIsNotNone(sync_log)
        self.assertEqual(sync_log.status, "success")

    @patch("socket.create_connection")
    def test_live_list_marks_device_online(self, create_connection_mock):
        device = self._create_device(serial="SN-LIVE-1")
        create_connection_mock.return_value = Mock()

        response = self.client.get("/api/devices/?live=1")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        device.refresh_from_db()
        self.assertEqual(device.status, "online")
        self.assertIsNotNone(device.last_seen)

    @patch("socket.create_connection", side_effect=OSError("unreachable"))
    def test_live_list_marks_device_offline(self, _create_connection_mock):
        device = self._create_device(serial="SN-LIVE-2")
        device.status = "online"
        device.last_seen = timezone.now()
        device.save(update_fields=["status", "last_seen"])

        response = self.client.get("/api/devices/?live=1")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        device.refresh_from_db()
        self.assertEqual(device.status, "offline")

    @override_settings(DEVICE_HEARTBEAT_TIMEOUT_SECONDS=30)
    def test_live_list_marks_stale_heartbeat_device_offline(self):
        device = self._create_device(serial="SN-HB-STALE-1")
        device.status = "online"
        device.last_seen = timezone.now()
        device.last_heartbeat = timezone.now() - timedelta(seconds=120)
        device.save(update_fields=["status", "last_seen", "last_heartbeat"])

        response = self.client.get("/api/devices/?live=1")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        device.refresh_from_db()
        self.assertEqual(device.status, "offline")

    def test_ingest_deduplicates_same_biometric_event(self):
        device = self._create_device(serial="SN-INGEST-1")
        Employee.objects.create(
            name="Ingest Employee",
            employee_code="E2001",
            email="ingest.employee@example.com",
        )
        payload = {
            "logs": [
                {"employee_code": "E2001", "timestamp": "2026-02-13T08:15:00", "action": "check_in"},
                {"employee_code": "E2001", "timestamp": "2026-02-13T08:15:00", "action": "check_in"},
            ]
        }

        response = self.client.post(f"/api/devices/{device.id}/ingest/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("created"), 1)
        self.assertEqual(BiometricLog.objects.filter(device=device, employee_code="E2001").count(), 1)

    def test_ingest_resolves_employee_via_device_user_mapping(self):
        device = self._create_device(serial="SN-INGEST-MAP-1")
        employee = Employee.objects.create(
            name="Mapped Employee",
            employee_code="E4001",
            email="mapped.employee@example.com",
        )
        DeviceUserMapping.objects.create(device=device, employee=employee, device_user_id="9")
        payload = {
            "logs": [
                {"employee_code": "9", "timestamp": "2026-02-14T08:15:00", "action": "check_in"},
            ]
        }

        response = self.client.post(f"/api/devices/{device.id}/ingest/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("created"), 1)
        biometric = BiometricLog.objects.filter(device=device, employee_code="E4001").first()
        self.assertIsNotNone(biometric)
        self.assertEqual(biometric.raw_data.get("device_user_id"), "9")
        self.assertEqual(biometric.raw_data.get("resolved_employee_code"), "E4001")
        self.assertTrue(Attendance.objects.filter(employee=employee).exists())

    def test_ingest_uses_first_and_last_punch_across_devices(self):
        morning_device = self._create_device(serial="SN-INGEST-FIRST-1")
        evening_device = self._create_device(serial="SN-INGEST-LAST-1")
        employee = Employee.objects.create(
            name="Cross Device Employee",
            employee_code="E4100",
            email="cross.device.employee@example.com",
        )

        late_first = {
            "logs": [
                {"employee_code": "E4100", "timestamp": "2026-02-14T17:45:00", "action": "check_out"},
            ]
        }
        early_second = {
            "logs": [
                {"employee_code": "E4100", "timestamp": "2026-02-14T08:05:00", "action": "check_out"},
            ]
        }

        first_response = self.client.post(f"/api/devices/{evening_device.id}/ingest/", late_first, format="json")
        second_response = self.client.post(f"/api/devices/{morning_device.id}/ingest/", early_second, format="json")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        attendance = Attendance.objects.get(employee=employee, date=datetime(2026, 2, 14).date())
        self.assertEqual(attendance.check_in, datetime(2026, 2, 14, 8, 5, 0).time())
        self.assertEqual(attendance.check_out, datetime(2026, 2, 14, 17, 45, 0).time())

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @patch("apps.devices.tasks.zk_service.push_template", return_value=True)
    @patch("apps.devices.tasks.zk_service.pull_templates")
    def test_pull_template_command_captures_and_auto_distributes(self, pull_templates_mock, _push_template_mock):
        source = self._create_device(serial="SN-TPL-SRC-1")
        target = self._create_device(serial="SN-TPL-TGT-1")
        employee = Employee.objects.create(
            name="Template Employee",
            employee_code="E5100",
            email="template.employee@example.com",
        )
        pull_templates_mock.return_value = [
            {
                "employee_code": employee.employee_code,
                "template_type": "fingerprint",
                "template_index": 0,
                "template_data": "tpl-binary-001",
            }
        ]

        response = self.client.post(
            "/api/device-command-center/queue/",
            {
                "command": "pull_template",
                "deviceIds": [str(source.id)],
                "payload": {
                    "employeeCode": employee.employee_code,
                    "templateType": "fingerprint",
                    "templateIndex": 0,
                    "targetDeviceIds": [str(target.id)],
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("queued"), 1)
        template = BiometricTemplate.objects.filter(employee=employee, source_device=source).first()
        self.assertIsNotNone(template)
        self.assertEqual(template.template_index, 0)
        self.assertEqual(template.template_type, "fingerprint")
        self.assertEqual(
            BiometricTemplateDistribution.objects.filter(template=template, device=target, status="success").count(),
            1,
        )

    @patch("apps.devices.views.run_device_sync_task.delay")
    def test_sync_endpoint_queues_task(self, delay_mock):
        delay_mock.return_value = Mock(id="task-123")
        device = self._create_device(serial="SN-QUEUE-1")

        response = self.client.post(f"/api/devices/{device.id}/sync/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data.get("status"), "queued")
        self.assertEqual(response.data.get("taskId"), "task-123")
        args, kwargs = delay_mock.call_args
        self.assertEqual(args[0], device.id)
        self.assertIsInstance(args[1], int)
        self.assertEqual(kwargs, {"limit": None})
        self.assertTrue(DeviceSyncLog.objects.filter(device=device, id=args[1]).exists())
        self.assertTrue(
            AuditLog.objects.filter(model_name="DeviceCommand", object_id=str(args[1]), action="create").exists()
        )

    @patch("apps.devices.views.run_device_sync_task.delay")
    def test_bulk_command_queues_multiple_devices(self, delay_mock):
        delay_mock.return_value = Mock(id="task-bulk")
        device_a = self._create_device(serial="SN-BULK-1")
        device_b = self._create_device(serial="SN-BULK-2")

        response = self.client.post(
            "/api/devices/bulk-command/",
            {"deviceIds": [str(device_a.id), str(device_b.id)], "command": "sync"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("queued"), 2)
        self.assertEqual(delay_mock.call_count, 2)

    @override_settings(DEVICE_INLINE_TASK_FALLBACK_ON_QUEUE_ERROR=True)
    @patch("apps.devices.views.run_device_sync_task.apply")
    @patch("apps.devices.views.run_device_sync_task.delay")
    def test_sync_endpoint_falls_back_to_inline_execution_when_queue_fails(self, delay_mock, apply_mock):
        delay_mock.side_effect = RuntimeError("redis unavailable")
        apply_mock.return_value = Mock(id="inline-1", failed=lambda: False, result={"status": "ok"})
        device = self._create_device(serial="SN-INLINE-1")

        response = self.client.post(f"/api/devices/{device.id}/sync/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "executed_inline")
        self.assertTrue(response.data.get("inline"))
        delay_mock.assert_called_once()
        apply_mock.assert_called_once()

    @patch("apps.devices.views.run_device_sync_time_task.delay")
    def test_sync_time_command_for_adms_device_is_queued_for_getrequest(self, delay_mock):
        device = Device.objects.create(
            name="ADMS Pull Device",
            serial_number="SN-ADMS-CMD-1",
            ip_address="192.168.1.88",
            port=4370,
            comm_key="",
            model="iFace950 Plus",
            location="Gate 1",
            status="offline",
            connection_mode="adms",
        )

        queue_response = self.client.post(f"/api/devices/{device.id}/sync-time/", {}, format="json")

        self.assertEqual(queue_response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(queue_response.data.get("status"), "queued_adms")
        self.assertEqual(queue_response.data.get("channel"), "adms")
        delay_mock.assert_not_called()

        poll_response = self.client.get("/api/iclock/getrequest?SN=SN-ADMS-CMD-1")
        body = poll_response.content.decode().strip()

        self.assertEqual(poll_response.status_code, status.HTTP_200_OK)
        self.assertIn("SET OPTION DATETIME=", body)
        self.assertNotEqual(body, "OK")

        log = DeviceSyncLog.objects.filter(device=device, command="sync_time").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, "success")

    def test_health_report_returns_summary(self):
        self._create_device(serial="SN-HR-1")
        self._create_device(serial="SN-HR-2")

        response = self.client.get("/api/devices/health-report/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        summary = response.data.get("summary", {})
        self.assertGreaterEqual(summary.get("totalDevices", 0), 2)
        self.assertIn("averageFailureRatePercent", summary)

    def test_sync_time_requires_sensitive_permission_for_hr_manager(self):
        manager = User.objects.create_user(
            username="hr_manager_device",
            password="Admin12345!",
            role="hr_manager",
        )
        self.client.force_authenticate(user=manager)
        device = self._create_device(serial="SN-PERM-1")

        response = self.client.post(f"/api/devices/{device.id}/sync-time/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_heartbeat_creates_device_by_serial(self):
        payload = {
            "serialNumber": "SN-HB-1",
            "ipAddress": "192.168.1.200",
            "port": 4370,
            "modelName": "ZKTeco K40",
            "location": "North Gate",
        }

        response = self.client.post("/api/devices/heartbeat/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "ok")
        self.assertTrue(response.data.get("created"))

        device = Device.objects.get(serial_number="SN-HB-1")
        self.assertEqual(device.status, "online")
        self.assertEqual(device.ip_address, "192.168.1.200")
        self.assertEqual(device.location, "North Gate")
        self.assertIsNotNone(device.last_seen)
        self.assertIsNotNone(device.last_heartbeat)

    @patch("apps.devices.views_control.zk_service.sync_time")
    def test_create_device_rejects_duplicate_serial_number(self, _sync_time_mock):
        payload = self._payload(serial="SN-DUP-1")
        first = self.client.post(reverse("device-list"), payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        payload2 = {
            **payload,
            "name": "Other Device",
            "ipAddress": "192.168.1.121",
            "location": "Another Site",
        }
        second = self.client.post(reverse("device-list"), payload2, format="json")

        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Device.objects.filter(serial_number="SN-DUP-1").count(), 1)

    def test_heartbeat_updates_existing_device_to_offline_using_serial(self):
        device = self._create_device(serial="SN-HB-2")
        device.status = "online"
        device.last_seen = timezone.now()
        device.save(update_fields=["status", "last_seen"])

        response = self.client.post(
            "/api/devices/heartbeat/",
            {"serialNumber": "SN-HB-2", "status": "offline"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "ok")
        self.assertFalse(response.data.get("created"))

        device.refresh_from_db()
        self.assertEqual(device.serial_number, "SN-HB-2")
        self.assertEqual(device.status, "offline")
        self.assertIsNotNone(device.last_heartbeat)

    @patch("apps.devices.views.zk_service.discover_device_identity")
    def test_discover_endpoint_returns_serial_and_model(self, discover_mock):
        discover_mock.return_value = {
            "serial_number": "SN-DISC-1",
            "model_name": "ZKTeco F22",
            "device_name": "Front Gate",
        }

        response = self.client.post(
            "/api/devices/discover/",
            {"ipAddress": "192.168.1.120", "port": 4370, "commKey": "0"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "ok")
        self.assertEqual(response.data.get("serialNumber"), "SN-DISC-1")
        self.assertEqual(response.data.get("modelName"), "ZKTeco F22")
        self.assertEqual(response.data.get("deviceName"), "Front Gate")

    @patch("apps.devices.views.zk_service.discover_device_identity")
    def test_test_connection_endpoint_returns_reachable(self, discover_mock):
        discover_mock.return_value = {
            "serial_number": "sn-test-1",
            "model_name": "ZKTeco F18",
            "device_name": "Test Device",
        }

        response = self.client.post(
            "/api/devices/test-connection/",
            {"ipAddress": "192.168.1.10", "port": 4370, "commKey": "0"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("reachable"))
        self.assertEqual(response.data.get("serialNumber"), "SN-TEST-1")

    @patch("apps.devices.views.zk_service.discover_device_identity")
    def test_test_connection_endpoint_returns_401_for_auth_failure(self, discover_mock):
        discover_mock.side_effect = DeviceConnectionError("Unauthenticated")

        response = self.client.post(
            "/api/devices/test-connection/",
            {"ipAddress": "192.168.1.10", "port": 4370, "commKey": "9999"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data.get("reachable"))
        self.assertEqual(response.data.get("code"), "DEVICE_AUTH_FAILED")
        self.assertIn("Comm Key", response.data.get("detail", ""))

    @patch("apps.devices.views.zk_service.discover_device_identity")
    def test_discover_endpoint_returns_401_for_auth_failure(self, discover_mock):
        discover_mock.side_effect = DeviceConnectionError("authentication failed")

        response = self.client.post(
            "/api/devices/discover/",
            {"ipAddress": "192.168.1.120", "port": 4370, "commKey": "9999"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get("code"), "DEVICE_AUTH_FAILED")
        self.assertIn("Comm Key", response.data.get("detail", ""))

    def test_discover_endpoint_rejects_missing_ip(self):
        response = self.client.post("/api/devices/discover/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ipAddress is required", response.data.get("detail", ""))


class ADMSPushTests(APITestCase):
    def test_adms_attlog_auto_registers_device_and_ingests_logs(self):
        Employee.objects.create(
            name="ADMS Employee",
            employee_code="E3001",
            email="adms.employee@example.com",
        )
        payload = (
            "PIN=E3001\tDateTime=2026-02-13 08:00:00\tStatus=0\n"
            "PIN=E3001\tDateTime=2026-02-13 17:00:00\tStatus=1\n"
        )

        response = self.client.post(
            "/api/iclock/cdata?SN=sn-adms-1&table=ATTLOG",
            data=payload,
            content_type="text/plain",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.content.decode().strip(), "OK")

        device = Device.objects.get(serial_number="SN-ADMS-1")
        self.assertEqual(device.status, "online")
        self.assertIsNotNone(device.last_heartbeat)
        self.assertEqual(BiometricLog.objects.filter(device=device, employee_code="E3001").count(), 2)

        attendance = Attendance.objects.get(employee__employee_code="E3001", date=datetime(2026, 2, 13).date())
        self.assertEqual(attendance.check_in, datetime(2026, 2, 13, 8, 0, 0).time())
        self.assertEqual(attendance.check_out, datetime(2026, 2, 13, 17, 0, 0).time())

    def test_adms_attlog_uses_first_and_last_punch_even_if_rows_are_out_of_order(self):
        Employee.objects.create(
            name="ADMS Window Employee",
            employee_code="E3010",
            email="adms.window@example.com",
        )
        payload = (
            "PIN=E3010\tDateTime=2026-02-13 17:30:00\tStatus=1\n"
            "PIN=E3010\tDateTime=2026-02-13 08:10:00\tStatus=1\n"
            "PIN=E3010\tDateTime=2026-02-13 12:00:00\tStatus=0\n"
        )

        response = self.client.post(
            "/api/iclock/cdata?SN=SN-ADMS-WINDOW-1&table=ATTLOG",
            data=payload,
            content_type="text/plain",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        attendance = Attendance.objects.get(employee__employee_code="E3010", date=datetime(2026, 2, 13).date())
        self.assertEqual(attendance.check_in, datetime(2026, 2, 13, 8, 10, 0).time())
        self.assertEqual(attendance.check_out, datetime(2026, 2, 13, 17, 30, 0).time())

    def test_adms_attlog_is_idempotent_for_duplicate_rows(self):
        Employee.objects.create(
            name="ADMS Duplicate",
            employee_code="E3002",
            email="adms.duplicate@example.com",
        )
        Device.objects.create(
            name="ADMS Existing",
            serial_number="SN-ADMS-2",
            ip_address="192.168.1.50",
            port=4370,
            comm_key="",
            location="Site A",
            status="offline",
        )
        payload = "E3002\t2026-02-13 08:15:00\t0\t0\t0\n"

        first = self.client.post(
            "/api/iclock/cdata?SN=SN-ADMS-2&table=ATTLOG",
            data=payload,
            content_type="text/plain",
        )
        second = self.client.post(
            "/api/iclock/cdata?SN=SN-ADMS-2&table=ATTLOG",
            data=payload,
            content_type="text/plain",
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(BiometricLog.objects.filter(device__serial_number="SN-ADMS-2", employee_code="E3002").count(), 1)

    @override_settings(ADMS_SHARED_SECRET="secret-123")
    def test_adms_shared_secret_is_enforced(self):
        denied = self.client.get("/api/iclock/cdata?SN=SN-SEC-1")
        allowed = self.client.get("/api/iclock/cdata?SN=SN-SEC-1&token=secret-123")

        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertTrue(Device.objects.filter(serial_number="SN-SEC-1").exists())

    @override_settings(ADMS_AUTO_REGISTER=False)
    def test_adms_rejects_unknown_serial_when_auto_register_disabled(self):
        response = self.client.get("/api/iclock/cdata?SN=SN-NO-AUTO")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_adms_getrequest_marks_device_online(self):
        device = Device.objects.create(
            name="ADMS Poll Device",
            serial_number="SN-GETREQ-1",
            ip_address="192.168.1.60",
            port=4370,
            comm_key="",
            location="Site B",
            status="offline",
        )

        response = self.client.get("/api/iclock/getrequest?SN=SN-GETREQ-1")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        device.refresh_from_db()
        self.assertEqual(device.status, "online")
        self.assertIsNotNone(device.last_heartbeat)


class ZKServiceEmployeePushTests(APITestCase):
    def test_push_employee_uses_employee_code_as_device_name_by_default(self):
        device = Mock()
        sdk = Mock()
        sdk.users = Mock()

        @contextmanager
        def fake_connect(_device):
            yield "pyzkaccess", sdk

        employee = Mock(employee_code="E9001", name="موظف عربي")
        with patch("apps.devices.services.zk_service._connect", fake_connect):
            zk_service.push_employee(device, employee)

        sdk.users.set.assert_called_once()
        kwargs = sdk.users.set.call_args.kwargs
        self.assertEqual(kwargs.get("pin"), "E9001")
        self.assertEqual(kwargs.get("name"), "E9001")


class DeviceApiAliasTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin_device_alias",
            password="Admin12345!",
            role="admin",
        )
        self.client.force_authenticate(user=self.user)
        self.device = Device.objects.create(
            name="Alias Device",
            serial_number="SN-ALIAS-1",
            ip_address="192.168.1.210",
            port=4370,
            comm_key="0",
            model="ZKTeco F22",
            location="HQ",
            status="online",
        )

    def test_device_command_approvals_alias_lists_and_approves(self):
        approval = DeviceCommandApproval.objects.create(
            command="sync_time",
            payload={},
            reason="Alias approval",
            status="pending",
            requested_by=self.user,
        )
        approval.target_devices.add(self.device)

        list_response = self.client.get("/api/device-command-approvals/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data.get("count"), 1)
        self.assertEqual(list_response.data["results"][0]["id"], approval.id)

        approve_response = self.client.post(
            f"/api/device-command-approvals/{approval.id}/approve/",
            {"executeNow": False},
            format="json",
        )

        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        approval.refresh_from_db()
        self.assertEqual(approval.status, "approved")
        self.assertEqual(approve_response.data.get("status"), "approved")

    def test_device_templates_alias_lists_existing_templates(self):
        employee = Employee.objects.create(
            name="Template Alias Employee",
            employee_code="E-TPL-ALIAS",
            email="template.alias@example.com",
        )
        template = BiometricTemplate.objects.create(
            employee=employee,
            source_device=self.device,
            template_type="fingerprint",
            template_index=0,
            template_data="template-bytes",
            template_hash=hashlib.sha256(b"template-bytes").hexdigest(),
        )

        response = self.client.get("/api/device-templates/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("count"), 1)
        self.assertEqual(response.data["results"][0]["id"], template.id)
        self.assertEqual(response.data["results"][0]["employeeCode"], employee.employee_code)

    def test_device_backups_alias_lists_and_restores_snapshot(self):
        snapshot = DeviceBackupSnapshot.objects.create(
            name="Alias Backup",
            scope="single",
            device=self.device,
            payload={
                "devices": [
                    {
                        "serial_number": self.device.serial_number,
                        "name": "Restored Alias Device",
                        "ip_address": "192.168.1.211",
                        "port": 4370,
                        "model": "ZKTeco F22",
                        "firmware_version": "1.0.1",
                        "platform": "ZMM220",
                        "location": "Restored HQ",
                        "connection_mode": "sdk",
                        "is_primary_enrollment": True,
                    }
                ]
            },
            created_by=self.user,
        )
        self.device.name = "Mutated Device"
        self.device.location = "Mutated Location"
        self.device.ip_address = "192.168.1.250"
        self.device.save(update_fields=["name", "location", "ip_address"])

        list_response = self.client.get("/api/device-backups/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data.get("count"), 1)
        self.assertEqual(list_response.data["results"][0]["id"], snapshot.id)

        restore_response = self.client.post(f"/api/device-backups/{snapshot.id}/restore/", {}, format="json")

        self.assertEqual(restore_response.status_code, status.HTTP_200_OK)
        self.assertEqual(restore_response.data.get("status"), "ok")
        self.assertEqual(restore_response.data.get("restoredDevices"), 1)

        self.device.refresh_from_db()
        self.assertEqual(self.device.name, "Restored Alias Device")
        self.assertEqual(self.device.location, "Restored HQ")
        self.assertEqual(self.device.ip_address, "192.168.1.211")

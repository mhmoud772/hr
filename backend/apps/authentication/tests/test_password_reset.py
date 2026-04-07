import re
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.authentication.models import PasswordResetOTP

User = get_user_model()


class PasswordResetFlowTests(APITestCase):
    def setUp(self):
        self.email = "user@example.com"
        self.password = "Oldpass123!"
        self.user = User.objects.create_user(
            username="user1",
            email=self.email,
            password=self.password,
        )

    def test_request_and_confirm_password_reset(self):
        response = self.client.post(
            "/api/auth/reset-password",
            {"email": self.email},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "ok")

        self.assertEqual(len(mail.outbox), 1)
        otp = PasswordResetOTP.objects.filter(user=self.user).first()
        self.assertIsNotNone(otp)

        code_match = re.search(r"(\d{6})", mail.outbox[0].body)
        self.assertIsNotNone(code_match)
        code = code_match.group(1)

        new_password = "Newpass123!"
        response = self.client.post(
            "/api/auth/reset-password/confirm",
            {"email": self.email, "token": code, "newPassword": new_password},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "ok")

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))
        otp.refresh_from_db()
        self.assertIsNotNone(otp.used_at)

    def test_invalid_code_increments_attempts(self):
        otp = PasswordResetOTP.objects.create(
            user=self.user,
            code_hash=make_password("123456"),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            "/api/auth/reset-password/confirm",
            {"email": self.email, "token": "000000", "newPassword": "Another123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        otp.refresh_from_db()
        self.assertEqual(otp.attempts, 1)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.password))

    def test_expired_code_is_rejected(self):
        otp = PasswordResetOTP.objects.create(
            user=self.user,
            code_hash=make_password("123456"),
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        response = self.client.post(
            "/api/auth/reset-password/confirm",
            {"email": self.email, "token": "123456", "newPassword": "Another123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        otp.refresh_from_db()
        self.assertIsNotNone(otp.used_at)

import json
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from webauthn.helpers import bytes_to_base64url

from apps.authentication.models import WebAuthnCredential

User = get_user_model()


class WebAuthnTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="passkey_user",
            password="Pass12345!",
            email="passkey@example.com",
        )
        login = self.client.post(
            "/api/auth/login",
            {"username": "passkey_user", "password": "Pass12345!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['accessToken']}")

    @patch("apps.authentication.services.auth_service.options_to_json")
    @patch("apps.authentication.services.auth_service.generate_registration_options")
    def test_webauthn_register_begin_returns_public_key_options(
        self,
        mock_generate_registration_options,
        mock_options_to_json,
    ):
        mock_generate_registration_options.return_value = SimpleNamespace(challenge=b"register-challenge")
        mock_options_to_json.return_value = json.dumps(
            {
                "challenge": "cmVnaXN0ZXItY2hhbGxlbmdl",
                "rp": {"name": "HR Companion", "id": "localhost"},
            }
        )

        response = self.client.post("/api/auth/webauthn/register/begin", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("publicKey", response.data)
        self.assertEqual(response.data["publicKey"]["rp"]["name"], "HR Companion")

    @patch("apps.authentication.services.auth_service.verify_registration_response")
    @patch("apps.authentication.services.auth_service.options_to_json")
    @patch("apps.authentication.services.auth_service.generate_registration_options")
    def test_webauthn_register_finish_persists_credential(
        self,
        mock_generate_registration_options,
        mock_options_to_json,
        mock_verify_registration_response,
    ):
        mock_generate_registration_options.return_value = SimpleNamespace(challenge=b"register-challenge")
        mock_options_to_json.return_value = json.dumps({"challenge": "cmVnaXN0ZXItY2hhbGxlbmdl"})
        mock_verify_registration_response.return_value = SimpleNamespace(
            credential_id=b"credential-id-1",
            credential_public_key=b"public-key-1",
            sign_count=7,
            credential_backed_up=True,
        )

        begin = self.client.post("/api/auth/webauthn/register/begin", {}, format="json")
        self.assertEqual(begin.status_code, status.HTTP_200_OK)

        finish = self.client.post(
            "/api/auth/webauthn/register/finish",
            {
                "id": "credential-id-1",
                "rawId": "credential-id-1",
                "type": "public-key",
                "response": {
                    "clientDataJSON": "abc",
                    "attestationObject": "def",
                },
            },
            format="json",
        )

        self.assertEqual(finish.status_code, status.HTTP_201_CREATED)
        credential = WebAuthnCredential.objects.get(user=self.user)
        self.assertEqual(credential.credential_id, bytes_to_base64url(b"credential-id-1"))
        self.assertEqual(credential.public_key, bytes_to_base64url(b"public-key-1"))
        self.assertEqual(credential.sign_count, 7)

    @patch("apps.authentication.services.auth_service.verify_authentication_response")
    @patch("apps.authentication.services.auth_service.options_to_json")
    @patch("apps.authentication.services.auth_service.generate_authentication_options")
    def test_webauthn_authentication_finish_returns_auth_payload(
        self,
        mock_generate_authentication_options,
        mock_options_to_json,
        mock_verify_authentication_response,
    ):
        credential_id = bytes_to_base64url(b"credential-id-2")
        public_key = bytes_to_base64url(b"public-key-2")
        WebAuthnCredential.objects.create(
            user=self.user,
            credential_id=credential_id,
            public_key=public_key,
            sign_count=2,
        )
        mock_generate_authentication_options.return_value = SimpleNamespace(challenge=b"auth-challenge")
        mock_options_to_json.return_value = json.dumps({"challenge": "YXV0aC1jaGFsbGVuZ2U"})
        mock_verify_authentication_response.return_value = SimpleNamespace(
            new_sign_count=9,
            credential_backed_up=True,
        )

        begin = self.client.post(
            "/api/auth/webauthn/authenticate/begin",
            {"username": self.user.username},
            format="json",
        )
        self.assertEqual(begin.status_code, status.HTTP_200_OK)

        finish = self.client.post(
            "/api/auth/webauthn/authenticate/finish",
            {
                "username": self.user.username,
                "id": credential_id,
                "rawId": credential_id,
                "type": "public-key",
                "response": {
                    "clientDataJSON": "abc",
                    "authenticatorData": "def",
                    "signature": "ghi",
                    "userHandle": None,
                },
            },
            format="json",
        )

        self.assertEqual(finish.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", finish.data)
        self.assertIn("refreshToken", finish.data)
        self.assertEqual(finish.data["user"]["username"], self.user.username)

        updated = WebAuthnCredential.objects.get(user=self.user, credential_id=credential_id)
        self.assertEqual(updated.sign_count, 9)

from django.conf import settings
import json
from urllib.parse import urlparse
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
import pyotp
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from apps.authentication.models import WebAuthnCredential
from shared.logging import get_service_logger
from shared.system import get_settings

User = get_user_model()
logger = get_service_logger("auth")


class AuthService:
    """
    Handles authentication, registration, password reset, and MFA logic.
    """

    WEBAUTHN_CACHE_TIMEOUT_SECONDS = 300

    @staticmethod
    def _webauthn_cache_key(flow: str, subject: str) -> str:
        normalized = str(subject or "").strip().lower()
        return f"webauthn:{flow}:{normalized}"

    @staticmethod
    def _webauthn_origins():
        raw_origins = [getattr(settings, "FRONTEND_URL", "")] + list(
            getattr(settings, "CORS_ALLOWED_ORIGINS", []) or []
        )
        origins = []
        for raw_origin in raw_origins:
            parsed = urlparse(str(raw_origin or "").strip())
            if not parsed.scheme or not parsed.netloc:
                continue
            normalized = f"{parsed.scheme}://{parsed.netloc}"
            if normalized not in origins:
                origins.append(normalized)
        return origins or ["http://localhost:5173"]

    @staticmethod
    def _webauthn_rp_id() -> str:
        override = str(getattr(settings, "WEBAUTHN_RP_ID", "") or "").strip()
        if override:
            return override
        parsed = urlparse(AuthService._webauthn_origins()[0])
        return parsed.hostname or "localhost"

    @staticmethod
    def _webauthn_rp_name() -> str:
        override = str(getattr(settings, "WEBAUTHN_RP_NAME", "") or "").strip()
        return override or "HR Companion"

    @staticmethod
    def _credential_descriptors_for_user(user):
        return [
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(credential.credential_id))
            for credential in user.webauthn_credentials.all()
        ]

    @staticmethod
    def webauthn_registration_begin(user):
        options = generate_registration_options(
            rp_id=AuthService._webauthn_rp_id(),
            rp_name=AuthService._webauthn_rp_name(),
            user_id=str(user.id).encode("utf-8"),
            user_name=user.username,
            user_display_name=user.get_full_name() or user.username,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
            exclude_credentials=AuthService._credential_descriptors_for_user(user),
        )
        cache.set(
            AuthService._webauthn_cache_key("register", str(user.id)),
            bytes_to_base64url(options.challenge),
            timeout=AuthService.WEBAUTHN_CACHE_TIMEOUT_SECONDS,
        )
        return {"publicKey": json.loads(options_to_json(options))}

    @staticmethod
    def webauthn_registration_finish(user, credential_payload):
        challenge = cache.get(AuthService._webauthn_cache_key("register", str(user.id)))
        if not challenge:
            raise ValueError("Registration challenge expired. Please try again.")

        verified = verify_registration_response(
            credential=credential_payload,
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=AuthService._webauthn_rp_id(),
            expected_origin=AuthService._webauthn_origins(),
            require_user_verification=False,
        )

        credential_id = bytes_to_base64url(verified.credential_id)
        credential, _created = WebAuthnCredential.objects.update_or_create(
            credential_id=credential_id,
            defaults={
                "user": user,
                "public_key": bytes_to_base64url(verified.credential_public_key),
                "sign_count": verified.sign_count,
                "backed_up": verified.credential_backed_up,
            },
        )
        cache.delete(AuthService._webauthn_cache_key("register", str(user.id)))
        logger.info("WebAuthn credential registered", username=user.username, credential_id=credential_id)
        return credential

    @staticmethod
    def webauthn_authentication_begin(username: str):
        user = User.objects.filter(username__iexact=str(username or "").strip(), is_active=True).first()
        if not user or not user.webauthn_credentials.exists():
            raise ValueError("Security key sign-in is not available for this account.")

        options = generate_authentication_options(
            rp_id=AuthService._webauthn_rp_id(),
            allow_credentials=AuthService._credential_descriptors_for_user(user),
            user_verification=UserVerificationRequirement.PREFERRED,
        )
        cache.set(
            AuthService._webauthn_cache_key("authenticate", user.username),
            bytes_to_base64url(options.challenge),
            timeout=AuthService.WEBAUTHN_CACHE_TIMEOUT_SECONDS,
        )
        return {"publicKey": json.loads(options_to_json(options))}

    @staticmethod
    def webauthn_authentication_finish(username: str, credential_payload):
        normalized_username = str(username or "").strip()
        user = User.objects.filter(username__iexact=normalized_username, is_active=True).first()
        if not user:
            raise ValueError("Invalid security key authentication request.")

        challenge = cache.get(AuthService._webauthn_cache_key("authenticate", user.username))
        if not challenge:
            raise ValueError("Authentication challenge expired. Please try again.")

        credential_id = str(
            credential_payload.get("rawId") or credential_payload.get("id") or ""
        ).strip()
        stored_credential = user.webauthn_credentials.filter(credential_id=credential_id).first()
        if not stored_credential:
            raise ValueError("Security key not registered for this account.")

        verified = verify_authentication_response(
            credential=credential_payload,
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=AuthService._webauthn_rp_id(),
            expected_origin=AuthService._webauthn_origins(),
            credential_public_key=base64url_to_bytes(stored_credential.public_key),
            credential_current_sign_count=stored_credential.sign_count,
            require_user_verification=False,
        )

        stored_credential.sign_count = verified.new_sign_count
        stored_credential.backed_up = verified.credential_backed_up
        stored_credential.save(update_fields=["sign_count", "backed_up"])
        cache.delete(AuthService._webauthn_cache_key("authenticate", user.username))
        logger.info("WebAuthn authentication succeeded", username=user.username)
        return user

    @staticmethod
    def validate_security_policy(password: str):
        settings_obj = get_settings()
        policy = (settings_obj.general_settings or {}).get("security", {}) if settings_obj else {}
        min_len = int(policy.get("passwordMinLength") or 0)
        if min_len and len(password) < min_len:
            raise ValueError(f"Password must be at least {min_len} characters.")
        if policy.get("passwordRequireUpper") and not any(c.isupper() for c in password):
            raise ValueError("Password must include an uppercase letter.")
        if policy.get("passwordRequireNumber") and not any(c.isdigit() for c in password):
            raise ValueError("Password must include a number.")
        if policy.get("passwordRequireSymbol") and not any(not c.isalnum() for c in password):
            raise ValueError("Password must include a symbol.")

    @staticmethod
    def register_user(username, password, name=None):
        if User.objects.filter(username=username).exists():
            raise ValueError("User already exists.")

        AuthService.validate_security_policy(password)

        user = User.objects.create_user(username=username, password=password)
        if name:
            parts = name.split(" ", 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.save()

        user.must_change_password = False
        user.save(update_fields=["must_change_password"])
        logger.info("New user registered", username=username)
        return user

    @staticmethod
    def request_password_reset(email):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return

        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{base_url}/reset-password/confirm?uid={uid}&token={token}"

        send_mail(
            "Reset your password",
            f"Use this link to reset your password: {reset_link}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        logger.info("Password reset request sent", email=email)

    @staticmethod
    def confirm_password_reset(uid, token, new_password):
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            raise ValueError("Invalid token.")

        if not PasswordResetTokenGenerator().check_token(user, token):
            raise ValueError("Invalid token.")

        validate_password(new_password, user=user)
        AuthService.validate_security_policy(new_password)

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        logger.info("Password reset confirmed", username=user.username)

    @staticmethod
    def change_password(user, current_password, new_password):
        if not user.check_password(current_password):
            raise ValueError("Invalid current password.")

        AuthService.validate_security_policy(new_password)

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        logger.info("User changed password", username=user.username)

    @staticmethod
    def setup_mfa(user):
        if not user.mfa_secret:
            user.mfa_secret = pyotp.random_base32()
            user.save(update_fields=["mfa_secret"])
        totp = pyotp.TOTP(user.mfa_secret)
        otpauth_url = totp.provisioning_uri(
            name=user.email or user.username,
            issuer_name="HR Companion",
        )
        return user.mfa_secret, otpauth_url

    @staticmethod
    def enable_mfa(user, code):
        if not user.mfa_secret:
            raise ValueError("MFA setup not started.")
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(code, valid_window=1):
            raise ValueError("Invalid code.")
        user.mfa_enabled = True
        user.save(update_fields=["mfa_enabled"])
        logger.info("MFA enabled", username=user.username)

    @staticmethod
    def disable_mfa(user):
        user.mfa_enabled = False
        user.mfa_secret = ""
        user.save(update_fields=["mfa_enabled", "mfa_secret"])
        logger.info("MFA disabled", username=user.username)

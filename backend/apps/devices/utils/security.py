import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

logger = logging.getLogger(__name__)

COMM_KEY_ENCRYPTED_PREFIX = "enc::"


def _derive_fernet_key() -> bytes:
    configured = str(getattr(settings, "COMM_KEY_ENCRYPTION_KEY", "") or "").strip()
    if configured:
        try:
            key_bytes = configured.encode("utf-8")
            Fernet(key_bytes)
            return key_bytes
        except Exception:
            logger.warning("Invalid COMM_KEY_ENCRYPTION_KEY. Falling back to SECRET_KEY-derived key.")

    secret = str(getattr(settings, "SECRET_KEY", "") or "")
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet() -> Fernet:
    return Fernet(_derive_fernet_key())


def is_encrypted_comm_key(value: str | None) -> bool:
    text = str(value or "")
    return text.startswith(COMM_KEY_ENCRYPTED_PREFIX)


def encrypt_comm_key(value: str | None) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if is_encrypted_comm_key(text):
        return text
    token = _fernet().encrypt(text.encode("utf-8")).decode("utf-8")
    return f"{COMM_KEY_ENCRYPTED_PREFIX}{token}"


def decrypt_comm_key(value: str | None) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if not is_encrypted_comm_key(text):
        return text

    token = text[len(COMM_KEY_ENCRYPTED_PREFIX) :]
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        logger.warning("Failed to decrypt comm key token. Using empty value.")
        return ""
    except Exception:
        logger.exception("Unexpected error while decrypting comm key.")
        return ""

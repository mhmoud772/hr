from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("system_admin", "System Admin"),
        ("hr_manager", "HR Manager"),
        ("supervisor", "Supervisor"),
        ("employee", "Employee"),
        ("admin", "Admin"),
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="employee")
    must_change_password = models.BooleanField(default=False)
    permissions_list = models.JSONField(default=list, blank=True) # Renamed to avoid confusion with internal permissions
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True)
    mfa_backup_codes = models.JSONField(default=list, blank=True)
    roles_list = models.ManyToManyField("Role", related_name="users", blank=True)

    class Meta:
        db_table = 'auth_user_custom' # Temporary until we handle migrations properly

    @property
    def permissions(self):
        """
        Backward-compatible alias for legacy code paths that still expect
        `user.permissions` instead of `user.permissions_list`.
        """
        return list(self.permissions_list or [])

    @permissions.setter
    def permissions(self, value):
        self.permissions_list = list(value or [])

    @property
    def roles(self):
        """
        Backward-compatible alias for legacy code paths that still expect
        `user.roles` instead of `user.roles_list`.
        """
        return self.roles_list

    def save(self, *args, **kwargs):
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            mapped_update_fields = []
            for field_name in update_fields:
                if field_name == "permissions":
                    mapped_update_fields.append("permissions_list")
                elif field_name != "roles":
                    mapped_update_fields.append(field_name)
            if mapped_update_fields:
                kwargs["update_fields"] = mapped_update_fields
            else:
                kwargs.pop("update_fields")
        return super().save(*args, **kwargs)


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_otps")
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"], name="auth_pwr_user_idx"),
            models.Index(fields=["expires_at"], name="auth_pwr_exp_idx"),
        ]


class Permission(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    name_en = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    description_en = models.TextField(blank=True)

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

    def get_localized_description(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.description_en:
            return self.description_en
        return self.description

    def __str__(self):
        return self.code


class Role(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    name_en = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name="roles", blank=True)

    def get_localized_name(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.name_en:
            return self.name_en
        return self.name

    def get_localized_description(self, language: str | None = None) -> str:
        if (language or "").lower().startswith("en") and self.description_en:
            return self.description_en
        return self.description

    def __str__(self):
        return self.name


class WebAuthnCredential(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="webauthn_credentials")
    credential_id = models.CharField(max_length=200, unique=True)
    public_key = models.TextField()
    sign_count = models.PositiveIntegerField(default=0)
    transports = models.JSONField(default=list, blank=True)
    backed_up = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Credential {self.credential_id}"


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    )
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64)
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

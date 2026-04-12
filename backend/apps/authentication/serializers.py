from django.contrib.auth import get_user_model
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AuditLog, Permission as AppPermission, Role
from .permissions import (
    get_effective_permission_codes,
    get_role_permission_codes,
    permission_mode_for_user,
)

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    def _resolve_language(self) -> str:
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"

    class Meta:
        model = AppPermission
        fields = ["id", "code", "name", "name_en", "description", "description_en"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["description"] = instance.get_localized_description(language)
        return data


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=AppPermission.objects.all(),
        source="permissions",
    )

    class Meta:
        model = Role
        fields = ["id", "name", "name_en", "description", "description_en", "permissions", "permission_ids"]

    def _resolve_language(self) -> str:
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"

    def create(self, validated_data):
        perms = validated_data.pop("permissions", [])
        role = super().create(validated_data)
        role.permissions.set(perms)
        return role

    def update(self, instance, validated_data):
        perms = validated_data.pop("permissions", None)
        role = super().update(instance, validated_data)
        if perms is not None:
            role.permissions.set(perms)
        return role

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["description"] = instance.get_localized_description(language)
        return data


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    role_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Role.objects.all(),
        required=False,
        source="roles",
    )
    permissions = serializers.ListField(child=serializers.CharField(), required=False)
    role_permissions = serializers.SerializerMethodField()
    effective_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "name",
            "is_active",
            "last_login",
            "must_change_password",
            "mfa_enabled",
            "password",
            "permissions",
            "role_ids",
            "role_permissions",
            "effective_permissions",
        ]

    @extend_schema_field(serializers.CharField())
    def get_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_role_permissions(self, obj):
        return sorted(get_role_permission_codes(obj))

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_effective_permissions(self, obj):
        return sorted(get_effective_permission_codes(obj))

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        explicit_permissions = validated_data.pop("permissions", None)
        roles = validated_data.pop("roles", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.must_change_password = True
        if explicit_permissions is not None:
            user.permissions = explicit_permissions
        user.save()
        if roles is not None:
            user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        explicit_permissions = validated_data.pop("permissions", None)
        roles = validated_data.pop("roles", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if explicit_permissions is not None:
            instance.permissions = explicit_permissions
        if password:
            instance.set_password(password)
            instance.must_change_password = False
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["role"] = getattr(user, "role", "employee")
        token["permission_mode"] = permission_mode_for_user(user)
        token["permissions"] = sorted(get_effective_permission_codes(user))
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["accessToken"] = data.pop("access")
        data["refreshToken"] = data.pop("refresh")
        data["user"] = UserSerializer(self.user).data
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = "__all__"


class AuthPayloadSerializer(serializers.Serializer):
    accessToken = serializers.CharField()
    refreshToken = serializers.CharField()
    user = UserSerializer()


class LoginResponseSerializer(AuthPayloadSerializer):
    pass


class TokenRefreshResponseSerializer(serializers.Serializer):
    accessToken = serializers.CharField()
    refreshToken = serializers.CharField(required=False)


class SetupStatusResponseSerializer(serializers.Serializer):
    requiresSetup = serializers.BooleanField()
    setupCompleted = serializers.BooleanField()
    hasUsers = serializers.BooleanField()
    hasAdmin = serializers.BooleanField()


class RegisterRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)


class InitialSetupRequestSerializer(serializers.Serializer):
    class AdminSerializer(serializers.Serializer):
        username = serializers.CharField()
        email = serializers.EmailField()
        password = serializers.CharField(write_only=True)
        name = serializers.CharField(required=False, allow_blank=True)

    admin = AdminSerializer()
    company = serializers.DictField(required=False)


class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordConfirmRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    newPassword = serializers.CharField(write_only=True)


class ChangePasswordRequestSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True)


class MFASetupResponseSerializer(serializers.Serializer):
    secret = serializers.CharField()
    otpauth_url = serializers.URLField()


class MFAEnableRequestSerializer(serializers.Serializer):
    code = serializers.CharField()


class WebAuthnRegisterFinishRequestSerializer(serializers.Serializer):
    id = serializers.CharField()
    rawId = serializers.CharField()
    type = serializers.CharField()
    attestationObject = serializers.CharField()
    clientDataJSON = serializers.CharField()


class WebAuthnAuthenticateBeginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()


class WebAuthnAuthenticateFinishRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    id = serializers.CharField()
    rawId = serializers.CharField()
    type = serializers.CharField()
    authenticatorData = serializers.CharField()
    clientDataJSON = serializers.CharField()
    signature = serializers.CharField()
    userHandle = serializers.CharField(required=False, allow_null=True)

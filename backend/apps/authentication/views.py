import re
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_filters.rest_framework import DjangoFilterBackend
from django_ratelimit.decorators import ratelimit
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import AuditLog, PasswordResetOTP, Permission, Role
from .serializers import (
    AuditLogSerializer,
    CustomTokenObtainPairSerializer,
    PermissionSerializer,
    RoleSerializer,
    UserSerializer,
    LoginResponseSerializer,
    TokenRefreshResponseSerializer,
    SetupStatusResponseSerializer,
    RegisterRequestSerializer,
    InitialSetupRequestSerializer,
    AuthPayloadSerializer,
    ResetPasswordRequestSerializer,
    ResetPasswordConfirmRequestSerializer,
    ChangePasswordRequestSerializer,
    MFASetupResponseSerializer,
    MFAEnableRequestSerializer,
    WebAuthnRegisterFinishRequestSerializer,
    WebAuthnAuthenticateBeginRequestSerializer,
    WebAuthnAuthenticateFinishRequestSerializer,
)
from .permissions import RolePermission
from .services.auth_service import AuthService
from shared.logging import get_service_logger
from shared.system import get_or_create_settings, get_settings
from drf_spectacular.utils import extend_schema, inline_serializer

User = get_user_model()
logger = get_service_logger("auth")


def _is_setup_completed() -> bool:
    has_users = User.objects.exists()
    has_admin = User.objects.filter(role__in=["system_admin", "admin", "hr_manager"], is_active=True).exists()
    settings_obj = get_settings()
    general = (settings_obj.general_settings or {}) if settings_obj else {}
    return bool(general.get("setupCompleted")) or (has_users and has_admin)


def _auth_payload_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "accessToken": str(refresh.access_token),
        "refreshToken": str(refresh),
        "user": UserSerializer(user).data,
    }


def _split_name(name: str):
    parts = str(name or "").strip().split(" ", 1)
    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""
    return first_name, last_name


def _build_unique_username_from_email(email: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_]+", "_", email.split("@", 1)[0]).strip("_") or "user"
    candidate = base
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        suffix += 1
        candidate = f"{base}_{suffix}"
    return candidate


class CustomTokenRefreshView(TokenRefreshView):
    @extend_schema(responses={200: TokenRefreshResponseSerializer})
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            data["accessToken"] = data.pop("access")
            response.data = data
        return response


@method_decorator(ratelimit(key="ip", rate="5/m", method="POST", block=True), name="post")
@extend_schema(responses={200: LoginResponseSerializer})
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=inline_serializer("LogoutRequest", fields={"refreshToken": serializers.CharField()}),
        responses={200: inline_serializer("LogoutResponseStatus", fields={"status": serializers.CharField()})},
    )
    def post(self, request):
        refresh_token = request.data.get("refreshToken")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                return Response({"detail": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "ok"})


class SetupStatusView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: SetupStatusResponseSerializer})
    def get(self, request):
        has_users = User.objects.exists()
        has_admin = User.objects.filter(role__in=["system_admin", "admin", "hr_manager"], is_active=True).exists()
        settings_obj = get_settings()
        general = (settings_obj.general_settings or {}) if settings_obj else {}
        setup_completed = bool(general.get("setupCompleted")) or (has_users and has_admin)
        return Response({
            "requiresSetup": not setup_completed,
            "setupCompleted": setup_completed,
            "hasUsers": has_users,
            "hasAdmin": has_admin,
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterRequestSerializer, responses={201: AuthPayloadSerializer})
    def post(self, request):
        if not _is_setup_completed():
            return Response(
                {"detail": "Initial setup is required.", "code": "SETUP_REQUIRED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = str(request.data.get("username") or "").strip()
        password = str(request.data.get("password") or "")
        name = str(request.data.get("name") or "").strip()
        email = str(request.data.get("email") or "").strip()

        if not username or not password:
            return Response({"detail": "username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = AuthService.register_user(username=username, password=password, name=name or None)
            if email:
                user.email = email
                user.save(update_fields=["email"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(_auth_payload_for_user(user), status=status.HTTP_201_CREATED)


class InitialSetupView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    @extend_schema(request=InitialSetupRequestSerializer, responses={201: AuthPayloadSerializer})
    def post(self, request):
        if _is_setup_completed():
            return Response({"detail": "Initial setup already completed."}, status=status.HTTP_409_CONFLICT)

        admin_data = request.data.get("admin") or {}
        username = str(admin_data.get("username") or "").strip()
        email = str(admin_data.get("email") or "").strip()
        password = str(admin_data.get("password") or "")
        name = str(admin_data.get("name") or "").strip()

        if not username or not email or not password:
            return Response(
                {"detail": "admin.username, admin.email, and admin.password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name, last_name = _split_name(name)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role="system_admin",
            first_name=first_name,
            last_name=last_name,
            is_active=True,
        )
        user.must_change_password = False
        user.save(update_fields=["must_change_password"])

        settings_obj, _ = get_or_create_settings()
        company = request.data.get("company") or {}
        general_settings = dict(settings_obj.general_settings or {})
        general_settings["setupCompleted"] = True
        if company:
            general_settings["company"] = company
        settings_obj.general_settings = general_settings
        settings_obj.save(update_fields=["general_settings"])

        return Response(_auth_payload_for_user(user), status=status.HTTP_201_CREATED)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=ResetPasswordRequestSerializer,
        responses={200: inline_serializer("ResetPasswordStatusResponse", fields={"status": serializers.CharField()})},
    )
    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user:
            code = f"{secrets.randbelow(1_000_000):06d}"
            PasswordResetOTP.objects.create(
                user=user,
                code_hash=make_password(code),
                expires_at=timezone.now() + timedelta(minutes=10),
                ip_address=request.META.get("REMOTE_ADDR") or None,
                user_agent=str(request.META.get("HTTP_USER_AGENT") or "")[:255],
            )
            send_mail(
                "Reset your password",
                f"Your verification code is {code}",
                None,
                [user.email],
                fail_silently=False,
            )
        return Response({"status": "ok"})


class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=ResetPasswordConfirmRequestSerializer,
        responses={200: inline_serializer("ResetPasswordConfirmStatusResponse", fields={"status": serializers.CharField()})},
    )
    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        token = str(request.data.get("token") or "").strip()
        new_password = str(request.data.get("newPassword") or request.data.get("new_password") or "")

        if not email or not token or not new_password:
            return Response({"detail": "email, token, and newPassword are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        otp = PasswordResetOTP.objects.filter(user=user, used_at__isnull=True).order_by("-created_at").first()
        if not otp:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        if otp.expires_at <= timezone.now():
            otp.used_at = timezone.now()
            otp.save(update_fields=["used_at"])
            return Response({"detail": "Token expired."}, status=status.HTTP_400_BAD_REQUEST)

        if otp.attempts >= 5:
            return Response({"detail": "Too many attempts."}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(token, otp.code_hash):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            AuthService.validate_security_policy(new_password)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        otp.used_at = timezone.now()
        otp.save(update_fields=["used_at"])
        return Response({"status": "ok"})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ChangePasswordRequestSerializer,
        responses={200: inline_serializer("ChangePasswordStatusResponse", fields={"status": serializers.CharField()})},
    )
    def post(self, request):
        current_password = str(request.data.get("currentPassword") or request.data.get("current_password") or "")
        new_password = str(request.data.get("newPassword") or request.data.get("new_password") or "")
        try:
            AuthService.change_password(request.user, current_password, new_password)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "ok"})


class MFASetupView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MFASetupResponseSerializer})
    def post(self, request):
        secret, otpauth_url = AuthService.setup_mfa(request.user)
        return Response({"secret": secret, "otpauth_url": otpauth_url})


class MFAEnableView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=MFAEnableRequestSerializer,
        responses={200: inline_serializer("MFAEnableStatusResponse", fields={"status": serializers.CharField()})},
    )
    def post(self, request):
        code = str(request.data.get("code") or "").strip()
        try:
            AuthService.enable_mfa(request.user, code)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "ok"})


class MFADisableView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: inline_serializer("MFADisableStatusResponse", fields={"status": serializers.CharField()})})
    def post(self, request):
        AuthService.disable_mfa(request.user)
        return Response({"status": "ok"})


class WebAuthnRegisterBeginView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: inline_serializer("WebAuthnRegisterBeginResponse", fields={"challenge": serializers.CharField(), "user": serializers.DictField(), "pubKeyCredParams": serializers.ListField(child=serializers.DictField()), "timeout": serializers.IntegerField(), "attestation": serializers.CharField(), "excludeCredentials": serializers.ListField(child=serializers.DictField(), required=False), "authenticatorSelection": serializers.DictField(required=False)})}
    )
    def post(self, request):
        return Response(AuthService.webauthn_registration_begin(request.user))


class WebAuthnRegisterFinishView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=WebAuthnRegisterFinishRequestSerializer,
        responses={201: inline_serializer("WebAuthnRegisterFinishResponse", fields={"status": serializers.CharField(), "credentialId": serializers.CharField()})},
    )
    def post(self, request):
        try:
            credential = AuthService.webauthn_registration_finish(request.user, request.data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "status": "ok",
                "credentialId": credential.credential_id,
            },
            status=status.HTTP_201_CREATED,
        )


class WebAuthnAuthenticateBeginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=WebAuthnAuthenticateBeginRequestSerializer,
        responses={200: inline_serializer("WebAuthnAuthenticateBeginResponse", fields={"challenge": serializers.CharField(), "timeout": serializers.IntegerField(), "rpId": serializers.CharField(), "allowCredentials": serializers.ListField(child=serializers.DictField())})}
    )
    def post(self, request):
        username = str(request.data.get("username") or "").strip()
        if not username:
            return Response({"detail": "username is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            options = AuthService.webauthn_authentication_begin(username)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(options)


class WebAuthnAuthenticateFinishView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=WebAuthnAuthenticateFinishRequestSerializer, responses={200: AuthPayloadSerializer})
    def post(self, request):
        username = str(request.data.get("username") or "").strip()
        if not username:
            return Response({"detail": "username is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = AuthService.webauthn_authentication_finish(username, request.data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_auth_payload_for_user(user), status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, RolePermission]

    def get_queryset(self):
        if self.request.user.role in ["system_admin", "admin"]:
            return User.objects.all().order_by("-id")
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        request=inline_serializer(
            "InviteRequest",
            fields={
                "emails": serializers.ListField(child=serializers.EmailField()),
                "role": serializers.CharField(required=False),
            },
        ),
        responses={
            200: inline_serializer(
                "InviteResponse",
                fields={
                    "status": serializers.CharField(),
                    "requested": serializers.IntegerField(),
                    "invited": serializers.IntegerField(),
                    "createdUsers": serializers.IntegerField(),
                    "existingUsers": serializers.IntegerField(),
                    "invalidEmails": serializers.ListField(child=serializers.EmailField()),
                    "results": serializers.ListField(
                        child=inline_serializer(
                            "InviteResult",
                            fields={
                                "email": serializers.EmailField(),
                                "userId": serializers.CharField(),
                                "username": serializers.CharField(),
                                "created": serializers.BooleanField(),
                            },
                        )
                    ),
                },
            )
        },
    )
    @action(detail=False, methods=["post"])
    def invite(self, request):
        raw_emails = request.data.get("emails") or []
        if isinstance(raw_emails, str):
            raw_emails = [item.strip() for item in raw_emails.split(",") if item.strip()]

        role = str(request.data.get("role") or "employee").strip() or "employee"
        invalid_emails = []
        results = []
        invited = 0
        created_users = 0
        existing_users = 0

        for email in raw_emails:
            candidate = str(email or "").strip().lower()
            try:
                validate_email(candidate)
            except ValidationError:
                invalid_emails.append(candidate)
                continue

            user = User.objects.filter(email__iexact=candidate).first()
            created = False
            if not user:
                created = True
                user = User.objects.create_user(
                    username=_build_unique_username_from_email(candidate),
                    email=candidate,
                    role=role,
                )
                user.set_unusable_password()
                user.must_change_password = True
                user.save(update_fields=["password", "must_change_password"])
                created_users += 1
            else:
                existing_users += 1

            from apps.notifications.models import Notification

            Notification.objects.create(
                recipient=user,
                channel="email",
                title="دعوة إلى رفيق الموارد البشرية",
                title_en="HR Companion invitation",
                body="تمت دعوتك إلى نظام رفيق الموارد البشرية.",
                body_en="You have been invited to HR Companion.",
                status="sent",
            )
            invited += 1
            results.append(
                {
                    "email": candidate,
                    "userId": str(user.id),
                    "username": user.username,
                    "created": created,
                }
            )

        return Response(
            {
                "status": "ok",
                "requested": len(raw_emails),
                "invited": invited,
                "createdUsers": created_users,
                "existingUsers": existing_users,
                "invalidEmails": invalid_emails,
                "results": results,
                }
            )


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.order_by("id")
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "name_en", "description", "description_en"]
    ordering_fields = ["name", "name_en"]


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.order_by("id")
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "name_en", "description", "description_en"]
    ordering_fields = ["code", "name", "name_en"]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["model_name", "action", "user"]
    search_fields = ["model_name", "object_id", "user__username", "user__first_name", "user__last_name"]
    ordering_fields = ["created_at", "action", "model_name"]

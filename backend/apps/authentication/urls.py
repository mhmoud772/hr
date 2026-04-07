from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RoleViewSet, PermissionViewSet, AuditLogViewSet,
    LoginView, CustomTokenRefreshView, LogoutView, MeView, SetupStatusView,
    RegisterView, InitialSetupView, ResetPasswordView, ResetPasswordConfirmView,
    ChangePasswordView, MFASetupView, MFAEnableView, MFADisableView,
    WebAuthnRegisterBeginView, WebAuthnRegisterFinishView,
    WebAuthnAuthenticateBeginView, WebAuthnAuthenticateFinishView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/refresh', CustomTokenRefreshView.as_view(), name='refresh'),
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/initial-setup', InitialSetupView.as_view(), name='initial-setup'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/me', MeView.as_view(), name='me'),
    path('auth/setup-status', SetupStatusView.as_view(), name='setup-status'),
    path('auth/reset-password', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/reset-password/confirm', ResetPasswordConfirmView.as_view(), name='reset-password-confirm'),
    path('auth/change-password', ChangePasswordView.as_view(), name='change-password'),
    path('auth/mfa/setup', MFASetupView.as_view(), name='mfa-setup'),
    path('auth/mfa/enable', MFAEnableView.as_view(), name='mfa-enable'),
    path('auth/mfa/disable', MFADisableView.as_view(), name='mfa-disable'),
    path('auth/webauthn/register/begin', WebAuthnRegisterBeginView.as_view(), name='webauthn-register-begin'),
    path('auth/webauthn/register/finish', WebAuthnRegisterFinishView.as_view(), name='webauthn-register-finish'),
    path('auth/webauthn/authenticate/begin', WebAuthnAuthenticateBeginView.as_view(), name='webauthn-auth-begin'),
    path('auth/webauthn/authenticate/finish', WebAuthnAuthenticateFinishView.as_view(), name='webauthn-auth-finish'),
    path('', include(router.urls)),
]

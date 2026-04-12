from __future__ import annotations

import json
import logging
from urllib import error as urllib_error
from urllib import request as urllib_request

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

from apps.notifications.models import Notification
from shared.system import get_settings

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_email_async(self, subject: str, message: str, recipient_list: list[str]):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        recipient_list,
        fail_silently=False,
    )


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_bulk_notifications(self, payloads: list[dict]):
    if not isinstance(payloads, list):
        return {"processed": 0, "sent": 0, "failed": 0, "results": []}

    settings_obj = get_settings()
    notification_settings = settings_obj.notification_settings if settings_obj else {}
    if not isinstance(notification_settings, dict):
        notification_settings = {}

    notifications_enabled = notification_settings.get("notificationsEnabled", True) is not False
    email_enabled = bool(notification_settings.get("emailNotifications", True))
    sms_enabled = bool(notification_settings.get("smsNotifications", False))

    sms_webhook_url = str(getattr(settings, "NOTIFICATION_SMS_WEBHOOK_URL", "") or "").strip()
    push_webhook_url = str(getattr(settings, "NOTIFICATION_PUSH_WEBHOOK_URL", "") or "").strip()
    webhook_bearer = str(getattr(settings, "NOTIFICATION_WEBHOOK_BEARER_TOKEN", "") or "").strip()
    webhook_timeout = max(1, int(getattr(settings, "NOTIFICATION_WEBHOOK_TIMEOUT_SECONDS", 10) or 10))

    headers = {"Content-Type": "application/json"}
    if webhook_bearer:
        headers["Authorization"] = f"Bearer {webhook_bearer}"

    def post_webhook(url: str, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        req = urllib_request.Request(url=url, data=body, headers=headers, method="POST")
        with urllib_request.urlopen(req, timeout=webhook_timeout) as resp:
            status_code = int(getattr(resp, "status", 200) or 200)
            response_body = resp.read().decode("utf-8", errors="ignore")
        return status_code, response_body

    summary = {
        "processed": 0,
        "sent": 0,
        "failed": 0,
        "results": [],
    }

    for index, item in enumerate(payloads):
        summary["processed"] += 1
        if not isinstance(item, dict):
            summary["failed"] += 1
            summary["results"].append(
                {
                    "index": index,
                    "status": "failed",
                    "error": "Payload item must be an object.",
                }
            )
            continue

        channel = str(item.get("channel") or "app").strip().lower()
        title = str(item.get("title") or "Notification").strip()[:255] or "Notification"
        title_en = str(item.get("title_en") or item.get("titleEn") or "").strip()[:255]
        body = str(item.get("body") or "").strip()
        body_en = str(item.get("body_en") or item.get("bodyEn") or "").strip()
        recipient_id = item.get("recipientId") or item.get("recipient_id")
        recipient = User.objects.filter(id=recipient_id).first() if recipient_id else None
        status_value = "failed"
        error_message = ""

        try:
            if channel == "app":
                Notification.objects.create(
                    recipient=recipient,
                    channel="app",
                    title=title,
                    title_en=title_en,
                    body=body,
                    body_en=body_en,
                    status="sent",
                )
                status_value = "sent"
            elif channel == "email":
                email = str(item.get("email") or (recipient.email if recipient else "")).strip()
                if not notifications_enabled or not email_enabled:
                    error_message = "Email notifications are disabled."
                elif not email:
                    error_message = "Email address is missing."
                else:
                    send_mail(
                        title,
                        body,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                    status_value = "sent"
                Notification.objects.create(
                    recipient=recipient,
                    channel="email",
                    title=title,
                    title_en=title_en,
                    body=body,
                    body_en=body_en,
                    status=status_value if status_value == "sent" else "failed",
                )
            elif channel == "sms":
                phone = str(item.get("phone") or item.get("phoneNumber") or "").strip()
                if not notifications_enabled or not sms_enabled:
                    error_message = "SMS notifications are disabled."
                elif not sms_webhook_url:
                    error_message = "SMS webhook URL is not configured."
                elif not phone:
                    error_message = "Phone number is missing."
                else:
                    status_code, response_body = post_webhook(
                        sms_webhook_url,
                        {
                            "channel": "sms",
                            "to": phone,
                            "title": title,
                            "body": body,
                            "recipientId": str(recipient.id) if recipient else "",
                        },
                    )
                    if 200 <= status_code < 300:
                        status_value = "sent"
                    else:
                        error_message = f"SMS provider returned HTTP {status_code}: {response_body}"

                Notification.objects.create(
                    recipient=recipient,
                    channel="sms",
                    title=title,
                    title_en=title_en,
                    body=body,
                    body_en=body_en,
                    status=status_value if status_value == "sent" else "failed",
                )
            elif channel == "push":
                push_token = str(item.get("pushToken") or item.get("token") or "").strip()
                if not notifications_enabled:
                    error_message = "Notifications are disabled."
                elif not push_webhook_url:
                    error_message = "Push webhook URL is not configured."
                elif not push_token:
                    error_message = "Push token is missing."
                else:
                    status_code, response_body = post_webhook(
                        push_webhook_url,
                        {
                            "channel": "push",
                            "to": push_token,
                            "title": title,
                            "body": body,
                            "data": item.get("data") or {},
                            "recipientId": str(recipient.id) if recipient else "",
                        },
                    )
                    if 200 <= status_code < 300:
                        status_value = "sent"
                    else:
                        error_message = f"Push provider returned HTTP {status_code}: {response_body}"
            else:
                error_message = f"Unsupported notification channel '{channel}'."
        except urllib_error.HTTPError as exc:
            error_message = f"Provider HTTP error: {exc.code}"
            logger.exception("Notification provider HTTP error")
        except urllib_error.URLError as exc:
            error_message = f"Provider network error: {exc.reason}"
            logger.exception("Notification provider network error")
        except Exception as exc:
            error_message = str(exc)
            logger.exception("Unexpected notification delivery failure")

        if status_value == "sent":
            summary["sent"] += 1
        else:
            summary["failed"] += 1

        summary["results"].append(
            {
                "index": index,
                "channel": channel,
                "recipientId": str(recipient.id) if recipient else "",
                "status": status_value,
                "error": error_message,
            }
        )

    return summary


@shared_task(bind=True, max_retries=3)
def send_notification_async(self, notification_id):
    try:
        notification = Notification.objects.select_related("recipient").get(pk=notification_id)
        if notification.status != "queued":
            return f"Notification {notification_id} is already processed."

        if notification.channel == "email" and notification.recipient and notification.recipient.email:
            send_mail(
                notification.title,
                notification.body,
                settings.DEFAULT_FROM_EMAIL,
                [notification.recipient.email],
                fail_silently=False,
            )

        notification.status = "sent"
        notification.save(update_fields=["status"])
        return f"Notification {notification_id} sent successfully."
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)

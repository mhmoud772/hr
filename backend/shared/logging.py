import json
import logging
from datetime import datetime

from django.conf import settings


class StructuredLogger:
    """
    Shared structured logger for domain services.
    """

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def _log(self, level: int, message: str, **kwargs):
        def serialize(obj):
            from datetime import date, datetime

            if isinstance(obj, (date, datetime)):
                return obj.isoformat()
            return str(obj)

        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            "level": logging.getLevelName(level),
            **{key: serialize(value) for key, value in kwargs.items()},
        }
        if settings.DEBUG:
            extra_str = " | ".join(f"{key}={serialize(value)}" for key, value in kwargs.items())
            self.logger.log(level, f"{message} {f'({extra_str})' if extra_str else ''}")
        else:
            self.logger.log(level, json.dumps(log_data))

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log(logging.ERROR, message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)

    def exception(self, message: str, **kwargs):
        self.logger.exception(message, extra=kwargs)


def get_service_logger(service_name: str) -> StructuredLogger:
    return StructuredLogger(f"apps.services.{service_name}")

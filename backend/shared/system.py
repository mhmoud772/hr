from __future__ import annotations

from django.core.cache import cache

from apps.system.models import Settings


DEFAULT_SETTINGS_CACHE_KEY = "settings:primary"


def get_settings(*, cache_key: str | None = None, timeout: int = 300) -> Settings | None:
    if cache_key:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

    settings_obj = Settings.objects.first()
    if cache_key and settings_obj is not None:
        cache.set(cache_key, settings_obj, timeout=timeout)
    return settings_obj


def get_or_create_settings(*, cache_key: str | None = None, timeout: int = 300) -> tuple[Settings, bool]:
    settings_obj, created = Settings.objects.get_or_create(id=1)
    if cache_key:
        cache.set(cache_key, settings_obj, timeout=timeout)
    return settings_obj, created


def invalidate_settings_cache(*cache_keys: str):
    keys = cache_keys or (DEFAULT_SETTINGS_CACHE_KEY,)
    for key in keys:
        cache.delete(key)

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from urllib.parse import quote

from django.core.cache import cache

_COUNTER_PREFIX = "auth_access:obs:counter"
_LATENCY_PREFIX = "auth_access:obs:latency"


def _counter_key(name: str, label: str) -> str:
    safe_label = quote(str(label), safe="")
    return f"{_COUNTER_PREFIX}:{name}:{safe_label}"


def _latency_key(endpoint: str, stat: str) -> str:
    safe_endpoint = quote(str(endpoint), safe="")
    return f"{_LATENCY_PREFIX}:{safe_endpoint}:{stat}"


def _increment_cache_key(key: str, amount: int = 1):
    cache.add(key, 0)
    try:
        cache.incr(key, amount)
    except ValueError:
        cache.set(key, amount, None)


def increment_counter(name: str, label: str, amount: int = 1):
    _increment_cache_key(_counter_key(name, label), amount)


def observe_latency_ms(endpoint: str, elapsed_ms: float):
    elapsed_int = max(0, int(round(elapsed_ms)))
    _increment_cache_key(_latency_key(endpoint, "count"), 1)
    _increment_cache_key(_latency_key(endpoint, "sum"), elapsed_int)

    max_key = _latency_key(endpoint, "max")
    current_max = cache.get(max_key, 0) or 0
    if elapsed_int > current_max:
        cache.set(max_key, elapsed_int, None)


def record_login_result(result: str, error_code: str | None = None):
    normalized_result = "success" if result == "SUCCESS" else "fail"
    increment_counter("login_total", normalized_result)
    if error_code:
        increment_counter("login_error_total", error_code)


def record_policy_deny(error_code: str):
    increment_counter("policy_deny_total", error_code)


def record_audit_event(module: str, action: str, result: str):
    normalized_result = "success" if result == "SUCCESS" else "fail"
    increment_counter("audit_event_total", normalized_result)
    increment_counter("audit_event_by_module_total", module)
    increment_counter("audit_event_by_action_total", action)


def _read_counter_group(name: str, labels: list[str]) -> dict[str, int]:
    payload = {}
    for label in labels:
        payload[label] = int(cache.get(_counter_key(name, label), 0) or 0)
    return payload


def _read_policy_deny_totals() -> dict[str, int]:
    denies = defaultdict(int)
    keys_method = getattr(cache, "keys", None)
    keys = keys_method(f"{_COUNTER_PREFIX}:policy_deny_total:*") if keys_method else []
    for key in keys:
        code = key.split(":")[-1]
        denies[code] = int(cache.get(key, 0) or 0)
    return dict(denies)


def _decode_component(value: str) -> str:
    return value.replace("%2F", "/")


def _read_latency_snapshot() -> dict[str, dict[str, float]]:
    result = {}
    keys_method = getattr(cache, "keys", None)
    keys = keys_method(f"{_LATENCY_PREFIX}:*:count") if keys_method else []

    for count_key in keys:
        parts = count_key.split(":")
        encoded_endpoint = parts[-2]
        endpoint = _decode_component(encoded_endpoint)

        count = int(cache.get(_latency_key(endpoint, "count"), 0) or 0)
        if count <= 0:
            continue
        total = int(cache.get(_latency_key(endpoint, "sum"), 0) or 0)
        max_value = int(cache.get(_latency_key(endpoint, "max"), 0) or 0)
        result[endpoint] = {
            "count": count,
            "avgMs": round(total / count, 2),
            "maxMs": max_value,
        }

    return result


def _build_alerts(metrics: dict) -> list[dict]:
    alerts = []

    login_success = metrics["authAccessLoginTotal"]["success"]
    login_fail = metrics["authAccessLoginTotal"]["fail"]
    login_total = login_success + login_fail
    fail_ratio = (login_fail / login_total) if login_total else 0
    alerts.append(
        {
            "id": "auth-access-login-failure-ratio",
            "severity": "high",
            "status": "triggered" if login_total >= 5 and fail_ratio >= 0.25 else "ok",
            "threshold": "failureRatio >= 25% (window parcial en cache, min 5 intents)",
            "current": {
                "loginTotal": login_total,
                "failureRatio": round(fail_ratio, 4),
            },
        }
    )

    policy_total = metrics["authAccessPolicyDenyTotal"]["total"]
    alerts.append(
        {
            "id": "auth-access-policy-deny-spike",
            "severity": "medium",
            "status": "triggered" if policy_total >= 3 else "ok",
            "threshold": "policyDenyTotal >= 3",
            "current": {"policyDenyTotal": policy_total},
        }
    )

    high_latency_endpoints = [
        endpoint
        for endpoint, values in metrics["authAccessEndpointLatencyMs"].items()
        if values.get("avgMs", 0) >= 350 or values.get("maxMs", 0) >= 800
    ]
    alerts.append(
        {
            "id": "auth-access-critical-latency",
            "severity": "high",
            "status": "triggered" if high_latency_endpoints else "ok",
            "threshold": "avgMs >= 350 or maxMs >= 800 por endpoint crítico",
            "current": {"endpoints": high_latency_endpoints},
        }
    )

    return alerts


def build_observability_snapshot() -> dict:
    login_totals = _read_counter_group("login_total", ["success", "fail"])
    policy_denies = _read_policy_deny_totals()
    audit_totals = _read_counter_group("audit_event_total", ["success", "fail"])
    latency = _read_latency_snapshot()

    metrics = {
        "authAccessLoginTotal": login_totals,
        "authAccessPolicyDenyTotal": {
            "total": sum(policy_denies.values()),
            "byCode": policy_denies,
        },
        "authAccessAuditEventsTotal": audit_totals,
        "authAccessEndpointLatencyMs": latency,
    }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "alerts": _build_alerts(metrics),
    }

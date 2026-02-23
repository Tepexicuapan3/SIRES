---
name: error-handling-patterns
description: Use when designing error contracts, retries, and fallback behavior across backend and frontend.
---

# Error Handling Patterns

Design error handling as a system, not as scattered try/catch blocks.

## When to Use

- Defining API error contracts
- Handling backend domain/infrastructure failures
- Normalizing frontend API errors
- Adding retry/backoff/fallback strategies
- Standardizing logs and observability for failures

## Principles

1. **Classify errors**
   - Validation/auth/permission/not-found/conflict/rate-limit/internal
2. **Keep contracts stable**
   - Use stable machine-readable `code` values
3. **Preserve context**
   - Attach request id, domain entity ids, and causal metadata
4. **Do not leak internals**
   - User-facing `message` should be safe
5. **Handle at the right layer**
   - Domain raises semantic errors, transport maps to HTTP

## Recommended API Error Shape

```json
{
  "code": "USER_NOT_FOUND",
  "message": "User not found",
  "status": 404,
  "timestamp": "2026-02-19T12:30:00Z",
  "details": {
    "userId": "123"
  },
  "requestId": "req-abc-123"
}
```

## Django/DRF Pattern

```python
from dataclasses import dataclass
from rest_framework import status
from rest_framework.response import Response

@dataclass
class DomainError(Exception):
    code: str
    message: str
    http_status: int
    details: dict | None = None


def map_error_to_response(error: Exception, request_id: str | None = None) -> Response:
    if isinstance(error, DomainError):
        payload = {
            "code": error.code,
            "message": error.message,
            "status": error.http_status,
            "details": error.details or {},
            "requestId": request_id,
        }
        return Response(payload, status=error.http_status)

    payload = {
        "code": "INTERNAL_ERROR",
        "message": "Unexpected error",
        "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "requestId": request_id,
    }
    return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

## Frontend Normalization Pattern

```typescript
export type ApiError = {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  requestId?: string;
};

export function normalizeApiError(input: unknown): ApiError {
  const fallback: ApiError = {
    code: "INTERNAL_ERROR",
    message: "Unexpected error",
    status: 500,
  };

  if (!input || typeof input !== "object") return fallback;

  const data = input as Partial<ApiError>;
  return {
    code: typeof data.code === "string" ? data.code : fallback.code,
    message: typeof data.message === "string" ? data.message : fallback.message,
    status: typeof data.status === "number" ? data.status : fallback.status,
    details: typeof data.details === "object" ? data.details : undefined,
    requestId: typeof data.requestId === "string" ? data.requestId : undefined,
  };
}
```

## Retry and Fallback Rules

- Retry only transient failures (timeouts, 429, temporary network issues)
- Never retry validation/auth errors blindly
- Use exponential backoff with limits
- Add idempotency keys for retriable writes
- Define explicit fallback behavior for read paths

## Checklist

- Error codes are documented and stable
- HTTP status mapping is consistent
- Frontend consumes normalized error shape only
- Logs include request and domain correlation ids
- Tests cover unhappy paths and edge cases

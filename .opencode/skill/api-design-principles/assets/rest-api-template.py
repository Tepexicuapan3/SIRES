"""
Production-ready REST API template using FastAPI.
Includes pagination, filtering, error handling, and best practices.
"""

from datetime import datetime, timezone
from enum import Enum
from math import ceil
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException, Path, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field


app = FastAPI(
    title="REST API Template",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# Security middleware
# IMPORTANT: replace these values in production.
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "*.localhost",
        # "api.example.com",
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # "https://example.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def utc_now() -> datetime:
    """Return a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    status: UserStatus = UserStatus.ACTIVE


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, exclude=True)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[UserStatus] = None


class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[List[ErrorDetail]] = None


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail

    if isinstance(detail, dict):
        message = str(detail.get("message", "Error"))
        details = detail.get("details")
    else:
        message = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTPException",
            message=message,
            details=details,
        ).model_dump(mode="json"),
    )


@app.get("/api/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/users", response_model=PaginatedResponse, tags=["Users"])
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[UserStatus] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None, min_length=1),
) -> PaginatedResponse:
    """List users with pagination and optional filtering."""

    total = 100
    start = (page - 1) * page_size
    end = min(start + page_size, total)

    items: List[User] = []

    for i in range(start, end):
        user_status = status_filter or UserStatus.ACTIVE
        user = User(
            id=str(i + 1),
            email=f"user{i + 1}@example.com",
            name=f"User {i + 1}",
            status=user_status,
            created_at=utc_now(),
            updated_at=utc_now(),
        )

        if search and search.lower() not in user.name.lower() and search.lower() not in user.email.lower():
            continue

        items.append(user)

    return PaginatedResponse(
        items=[item.model_dump(mode="json") for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size),
    )


@app.post(
    "/api/users",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
)
async def create_user(user: UserCreate) -> User:
    """Create a new user."""

    now = utc_now()

    return User(
        id="123",
        email=user.email,
        name=user.name,
        status=user.status,
        created_at=now,
        updated_at=now,
    )


@app.get("/api/users/{user_id}", response_model=User, tags=["Users"])
async def get_user(
    user_id: str = Path(..., min_length=1, description="User ID"),
) -> User:
    """Get user by ID."""

    if user_id == "999":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "User not found",
                "details": [
                    {
                        "field": "id",
                        "message": user_id,
                        "code": "not_found",
                    }
                ],
            },
        )

    now = utc_now()

    return User(
        id=user_id,
        email="user@example.com",
        name="User Name",
        status=UserStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )


@app.patch("/api/users/{user_id}", response_model=User, tags=["Users"])
async def update_user(
    update: UserUpdate,
    user_id: str = Path(..., min_length=1, description="User ID"),
) -> User:
    """Partially update user."""

    existing = await get_user(user_id)
    update_data = update.model_dump(exclude_unset=True)

    updated_user = existing.model_copy(update=update_data)
    updated_user.updated_at = utc_now()

    return updated_user


@app.delete(
    "/api/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Users"],
)
async def delete_user(
    user_id: str = Path(..., min_length=1, description="User ID"),
) -> Response:
    """Delete user."""

    await get_user(user_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "rest-api-template:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
    )
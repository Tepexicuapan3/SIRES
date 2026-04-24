"""
Django settings — SISEM + SIRES unificado.
"""



import json
import os
import sys
from datetime import timedelta
from pathlib import Path

from celery.schedules import crontab
from corsheaders.defaults import default_headers
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent
POSTAL_CODES_FILE_PATH = BASE_DIR / "storage" / "catalogs" / "codigos_postales.txt"
# Agrega BASE_DIR al path para que 'cont' sea importable
sys.path.insert(0, str(BASE_DIR))
from cont import decrypt_password


def _get_oracle_password() -> str:
    try:
        with open(BASE_DIR / "config.json", "r", encoding="utf-8") as f:
            cfg = json.load(f)
        enc = bytes.fromhex(cfg["oracle"]["password_encrypted"])
        iv = bytes.fromhex(cfg["oracle"]["iv"])
        return decrypt_password(enc, iv)
    except Exception:
        return os.environ.get("ORACLE_PASSWORD", "")


SECRET_KEY = config(
    "SECRET_KEY",
    default="django-insecure-_n@vgo%v8a9+b#2ywbwea_k0++f6e44=$2)kjd$d&*gi*jbl4)",
)

DEBUG = config("DEBUG", default=True, cast=bool)

ALLOW_ALL_HOSTS = config("ALLOW_ALL_HOSTS", default=False, cast=bool)
if ALLOW_ALL_HOSTS:
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [
        host.strip()
        for host in str(
            config(
                "ALLOWED_HOSTS",
                default="localhost,127.0.0.1,0.0.0.0,backend,sires-backend,host.docker.internal,50.192.43.35",
            )
        ).split(",")
        if host.strip()
    ]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "channels",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    # Local apps
    "apps.authentication",
    "apps.recepcion",
    "apps.somatometria",
    "apps.consulta_medica",
    "apps.catalogos",
    "apps.administracion",
    "apps.realtime",
    "apps.farmacia",
    'apps.recepcion.routers',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "apps.administracion.middleware.request_id.RequestIDMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "middlewares.auth.JWTAuthenticationMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ── Oracle ────────────────────────────────────────────────────────────────────
ORACLE_CONFIG = {
    "user": config("ORACLE_USER", default="SERMED"),
    "password": _get_oracle_password(),
    "host": config("ORACLE_HOST", default="11.121.252.12"),
    "port": config("ORACLE_PORT", default="1526"),
    "service_name": config("ORACLE_SERVICE", default="NOMINAP"),
    "instant_client_dir": config(
        "ORACLE_INSTANT_CLIENT", default=r"C:\oracle\instantclient_11_2"
    ),
}

# ── Databases ─────────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("POSTGRES_NAME", default="sermed"),
        "USER": config("POSTGRES_USER", default="sermed"),
        "PASSWORD": config("POSTGRES_PASSWORD", default="112233"),
        "HOST": config("POSTGRES_HOST", default="50.192.41.223"),
        "PORT": config("POSTGRES_PORT", default="5432"),
        "OPTIONS": {"client_encoding": "UTF8"},
    },
    "expedientes": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("EXPEDIENTES_NAME", default="sermed"),
        "USER": config("EXPEDIENTES_USER", default="sermed"),
        "PASSWORD": config("EXPEDIENTES_PASSWORD", default="112233"),
        "HOST": config("EXPEDIENTES_HOST", default="50.192.43.35"),
        "PORT": config("EXPEDIENTES_PORT", default="5432"),
        "OPTIONS": {"client_encoding": "UTF8"},
    },
}

if "test" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

DATABASE_ROUTERS = [
    "routers.ExpedientesRouter",
    "apps.recepcion.routers.RecepcionCitasRouter",
]

# ── Channels ──────────────────────────────────────────────────────────────────
if "test" in sys.argv:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
else:
    CHANNEL_REDIS_URL = config("CHANNEL_REDIS_URL", default="redis://redis:6379/1")
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [CHANNEL_REDIS_URL],
            },
        }
    }

# ── Celery ────────────────────────────────────────────────────────────────────
CELERY_BEAT_SCHEDULE = {
    "citas-recordatorios-24h": {
        "task": "apps.recepcion.tasks.enviar_recordatorios_proximos",
        "schedule": crontab(hour=8, minute=0),
    },
    "citas-generar-slots": {
        "task": "apps.recepcion.tasks.generar_slots_todos_medicos",
        "schedule": crontab(hour=1, minute=0, day_of_week=1),
    },
    "citas-marcar-no-asistio": {
        "task": "apps.recepcion.tasks.marcar_no_asistio",
        "schedule": crontab(minute=0),
    },
}

# ── Citas ─────────────────────────────────────────────────────────────────────
CITAS_LOGO_PATH = BASE_DIR / "frontend" / "public" / "icons" / "Logobueno.png"
CITAS_BASE_URL = config("CITAS_BASE_URL", default="https://sires.metro.cdmx.gob.mx")

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Mexico_City"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "EXCEPTION_HANDLER": "apps.administracion.exceptions.custom_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "USER_ID_FIELD": "id_usuario",
}

# ── CORS / CSRF ───────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in str(
        config(
            "CORS_ALLOWED_ORIGINS",
            default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
        )
    ).split(",")
    if origin.strip()
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$",
    r"^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$",
    r"^http://172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in str(
        config(
            "CSRF_TRUSTED_ORIGINS",
            default="http://localhost:5173,http://127.0.0.1:5173",
        )
    ).split(",")
    if origin.strip()
]

WS_ALLOW_ALL_ORIGINS = config("WS_ALLOW_ALL_ORIGINS", default=False, cast=bool)
WS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in str(config("WS_ALLOWED_ORIGINS", default="")).split(",")
    if origin.strip()
]

CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-request-id",
    "x-csrf-token",
]

CORS_EXPOSE_HEADERS = [
    "X-Request-ID",
    "X-Auth-Revision",
]

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_USE_SSL = config("EMAIL_USE_SSL", default=False, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default=EMAIL_HOST_USER)
EMAIL_TIMEOUT = config("EMAIL_TIMEOUT", default=10, cast=int)

# ── SISEM branding ────────────────────────────────────────────────────────────
SISEM_LOGIN_URL = config("SISEM_LOGIN_URL", default="http://localhost:5173/login")
SISEM_SUPPORT_EMAIL = config(
    "SISEM_SUPPORT_EMAIL",
    default=DEFAULT_FROM_EMAIL or "soporte@sisem.local",
)
ALLOW_USER_CREATE_WITHOUT_EMAIL = config(
    "ALLOW_USER_CREATE_WITHOUT_EMAIL", default=False, cast=bool
)

# ── RBAC feature flags ────────────────────────────────────────────────────────
RBAC_READ_S1_ENABLED = config("RBAC_READ_S1_ENABLED", default=False, cast=bool)
RBAC_READ_SLICE_SOURCE = config("RBAC_READ_SLICE_SOURCE", default="auto")
RBAC_ROLE_MUTATION_S2_ENABLED = config(
    "RBAC_ROLE_MUTATION_S2_ENABLED", default=False, cast=bool
)
RBAC_ROLE_PERMISSION_S3_ENABLED = config(
    "RBAC_ROLE_PERMISSION_S3_ENABLED", default=False, cast=bool
)

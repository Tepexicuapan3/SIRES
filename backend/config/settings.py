"""
Django settings for config project.
"""
import json
import sys
import os
from datetime import timedelta
from pathlib import Path

from corsheaders.defaults import default_headers
from decouple import config

from celery.schedules import crontab

BASE_DIR = Path(__file__).resolve().parent.parent

# Agrega BASE_DIR al path para que 'cont' sea importable
sys.path.insert(0, str(BASE_DIR))
from cont import decrypt_password

def _get_oracle_password() -> str:
    try:
        with open(BASE_DIR / "config.json", "r", encoding='utf-8') as f:
            cfg = json.load(f)
        enc = bytes.fromhex(cfg["oracle"]["password_encrypted"])
        iv  = bytes.fromhex(cfg["oracle"]["iv"])
        return decrypt_password(enc, iv)
    except Exception:
        return os.environ.get('ORACLE_PASSWORD', '')

SECRET_KEY = config(
    'SECRET_KEY',
    default='django-insecure-_n@vgo%v8a9+b#2ywbwea_k0++f6e44=$2)kjd$d&*gi*jbl4)',
)

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOW_ALL_HOSTS = config('ALLOW_ALL_HOSTS', default=False, cast=bool)
if ALLOW_ALL_HOSTS:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = [
        host.strip()
        for host in str(
            config(
                'ALLOWED_HOSTS',
                default='localhost,127.0.0.1,0.0.0.0,backend,sires-backend,host.docker.internal, 50.192.43.35',
            )
        ).split(',')
        if host.strip()
    ]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'apps.authentication',
    'apps.recepcion',
    'apps.somatometria',
    'apps.consulta_medica',
    'apps.catalogos',
    'apps.administracion',
    'apps.realtime',
    'apps.recetas',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middlewares.auth.JWTAuthenticationMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

'''ORACLE_CONFIG = {
    'user':         config('ORACLE_USER', default='SERMED'),
    'password':     _get_oracle_password(),
    'host':         config('ORACLE_HOST', default='11.121.252.12'),
    'port':         config('ORACLE_PORT', default='1526'),
    'service_name': config('ORACLE_SERVICE', default='NOMINAP'),
}'''
ORACLE_CONFIG = {
    'user':              config('ORACLE_USER',           default='SERMED'),
    'password':          _get_oracle_password(),
    'host':              config('ORACLE_HOST',           default='11.121.252.12'),
    'port':              config('ORACLE_PORT',           default='1526'),
    'service_name':      config('ORACLE_SERVICE',        default='NOMINAP'),
    'instant_client_dir': config('ORACLE_INSTANT_CLIENT', default=r'C:\oracle\instantclient_11_2'),
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     config('POSTGRES_NAME',     default='sermed'),
        'USER':     config('POSTGRES_USER',     default='sermed'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='112233'),
        'HOST':     config('POSTGRES_HOST',     default='50.192.41.223'),
        'PORT':     config('POSTGRES_PORT',     default='5432'),
        'OPTIONS':  {'client_encoding': 'UTF8'},
    },
    'expedientes': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     config('EXPEDIENTES_NAME',     default='sermed'),
        'USER':     config('EXPEDIENTES_USER',     default='sermed'),
        'PASSWORD': config('EXPEDIENTES_PASSWORD', default='112233'),
        'HOST':     config('EXPEDIENTES_HOST',     default='50.192.43.35'),
        'PORT':     config('EXPEDIENTES_PORT',     default='5432'),
        'OPTIONS':  {'client_encoding': 'UTF8'},
    },
}

if 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

DATABASE_ROUTERS = ['routers.ExpedientesRouter',
                    'apps.recepcion.routers.RecepcionCitasRouter' 
]

# ── CITAS — configuración específica del módulo ── (agregar al final) ─────────
CITAS_LOGO_PATH = BASE_DIR / "frontend" / "public" / "icons" / "Logobueno.png"  # ← NUEVO
CITAS_BASE_URL  = config("CITAS_BASE_URL", default="https://sires.metro.cdmx.gob.mx")  # ← NUEVO


# ── CELERY BEAT ── (agregar si no existe) ─────────────────────────────────────
CELERY_BEAT_SCHEDULE = {
    # ── citas médicas ─────────────────────────────────────────────────────────
    "citas-recordatorios-24h": {                                               # ← NUEVO
        "task": "apps.recepcion.tasks.enviar_recordatorios_proximos",
        "schedule": crontab(hour=8, minute=0),
    },
    "citas-generar-slots": {                                                   # ← NUEVO
        "task": "apps.recepcion.tasks.generar_slots_todos_medicos",
        "schedule": crontab(hour=1, minute=0, day_of_week=1),  # lunes
    },
    "citas-marcar-no-asistio": {                                               # ← NUEVO
        "task": "apps.recepcion.tasks.marcar_no_asistio",
        "schedule": crontab(minute=0),   # cada hora
    },
}



AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    "EXCEPTION_HANDLER": "apps.administracion.exceptions.custom_exception_handler",
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'USER_ID_FIELD': 'id_usuario',
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in str(
        config(
            'CORS_ALLOWED_ORIGINS',
            default='http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173',
        )
    ).split(',')
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
            'CSRF_TRUSTED_ORIGINS',
            default='http://localhost:5173,http://127.0.0.1:5173',
        )
    ).split(',')
    if origin.strip()
]

WS_ALLOW_ALL_ORIGINS = config('WS_ALLOW_ALL_ORIGINS', default=False, cast=bool)
WS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in str(config('WS_ALLOWED_ORIGINS', default='')).split(',')
    if origin.strip()
]

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-request-id',
    'x-csrf-token',
]

CORS_EXPOSE_HEADERS = [
    'X-Request-ID',
    'X-Auth-Revision',
]

EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)
EMAIL_TIMEOUT = config('EMAIL_TIMEOUT', default=10, cast=int)
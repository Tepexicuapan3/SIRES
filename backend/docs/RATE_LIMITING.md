# Rate Limiting y Proteccion contra DDoS - Guia de Implementacion

## Resumen Ejecutivo

Este documento describe la arquitectura e implementacion de un sistema de rate limiting robusto para proteger los endpoints de autenticacion de SIRES contra ataques de fuerza bruta y DDoS.

---

## Indice

1. [Problema Actual](#problema-actual)
2. [Arquitectura Propuesta](#arquitectura-propuesta)
3. [Implementacion con Redis](#implementacion-con-redis)
4. [Configuracion de Endpoints](#configuracion-de-endpoints)
5. [Codigos de Error](#codigos-de-error)
6. [Integracion con el Sistema Actual](#integracion-con-el-sistema-actual)
   - [Migracion del Bloqueo de MySQL a Redis](#migracion-del-bloqueo-de-mysql-a-redis)
   - [Migrar OTP a Redis](#migrar-otp-a-redis)
7. [Testing](#testing)
8. [Monitoreo y Alertas](#monitoreo-y-alertas)

---

## Problema Actual

### Situacion Diagnosticada

El sistema actual tiene las siguientes vulnerabilidades:

| Problema                 | Gravedad | Descripcion                                                                |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| Bloqueo solo por usuario | ALTA     | Un atacante puede probar passwords en usuarios diferentes sin consecuencia |
| Sin rate limit por IP    | ALTA     | No hay limite de requests por segundo desde una misma IP                   |
| Bloqueo fijo de 5 min    | MEDIA    | No hay escalado exponencial, el atacante solo espera 5 min                 |
| OTP en memoria RAM       | MEDIA    | Se pierde si el servidor reinicia                                          |
| Redis no utilizado       | MEDIA    | Ya esta configurado en docker-compose pero no se usa                       |

### Vector de Ataque Actual

```
Atacante                                   Backend
    |                                         |
    |-- POST /auth/login (user1, pass1) ----->|  OK (intento 1)
    |-- POST /auth/login (user2, pass1) ----->|  OK (sin limite!)
    |-- POST /auth/login (user3, pass1) ----->|  OK (sin limite!)
    |-- ... 10,000 requests/segundo ...------>|  SERVER DOWN
```

---

## Arquitectura Propuesta

### Defensa en Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 1: NGINX/TRAEFIK                    │
│              Rate limit bruto por IP (opcional)             │
│                  100 req/min global a /auth/*               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      CAPA 2: REDIS                          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ IP Rate Limit   │  │ IP Failed       │  │ User Failed │ │
│  │ (sliding window)│  │ Attempts        │  │ Attempts    │ │
│  │                 │  │                 │  │             │ │
│  │ 10 req/min      │  │ 15 fails = 15m  │  │ 5 fails=5m  │ │
│  │ por IP a login  │  │ 30 fails = 1h   │  │ 10 fails=15m│ │
│  │                 │  │ 50 fails = 24h  │  │ 15 fails=1h │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     CAPA 3: MYSQL                           │
│            Auditoria permanente + bloqueo grave             │
│         (solo para casos que requieren intervencion)        │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Validacion

```python
def login_endpoint(request):
    ip = get_client_ip(request)
    username = request.json.get("usuario")

    # PASO 1: Verificar rate limit por IP (sliding window)
    if rate_limiter.is_ip_rate_limited(ip):
        return {"code": "TOO_MANY_REQUESTS"}, 429

    # PASO 2: Verificar si la IP esta bloqueada
    if rate_limiter.is_ip_blocked(ip):
        return {"code": "IP_BLOCKED"}, 403

    # PASO 3: Verificar si el usuario esta bloqueado
    if rate_limiter.is_user_blocked(username):
        return {"code": "USER_LOCKED"}, 423

    # PASO 4: Intentar login
    result, error = login_usecase.execute(username, password, ip)

    if error == "INVALID_CREDENTIALS":
        # Registrar fallo por IP y por usuario
        rate_limiter.record_failed_attempt(ip, username)
        return {"code": "INVALID_CREDENTIALS"}, 401

    # Login exitoso - resetear contadores del usuario
    rate_limiter.reset_user_attempts(username)
    return result, 200
```

---

## Implementacion con Redis

### Dependencias

```bash
pip install redis flask-limiter
```

Agregar a `requirements.txt`:

```
redis==5.0.1
flask-limiter==3.5.0
```

### Estructura de Archivos

```
backend/src/infrastructure/
├── rate_limiting/
│   ├── __init__.py
│   ├── redis_client.py      # Conexion a Redis
│   ├── rate_limiter.py      # Servicio principal
│   └── decorators.py        # Decoradores para Flask
```

### Archivo: redis_client.py

```python
"""
Conexion centralizada a Redis para rate limiting y OTP.
"""
import redis
import os
from typing import Optional

class RedisClient:
    _instance: Optional[redis.Redis] = None

    @classmethod
    def get_instance(cls) -> redis.Redis:
        if cls._instance is None:
            cls._instance = redis.Redis(
                host=os.getenv("REDIS_HOST", "redis"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True
            )
        return cls._instance

    @classmethod
    def health_check(cls) -> bool:
        try:
            return cls.get_instance().ping()
        except redis.ConnectionError:
            return False


# Singleton para importar directamente
redis_client = RedisClient.get_instance()
```

### Archivo: rate_limiter.py

```python
"""
Servicio de Rate Limiting con Redis.

Estrategia de proteccion en 3 niveles:
1. Rate limit por IP (sliding window) - Previene flood de requests
2. Bloqueo por IP (intentos fallidos) - Previene ataques distribuidos
3. Bloqueo por Usuario (intentos fallidos) - Previene ataques dirigidos

Autor: Equipo de Seguridad SIRES
"""
import time
from typing import Tuple, Optional
from .redis_client import redis_client

class RateLimiter:

    # =====================================================
    # CONFIGURACION - Ajustar segun necesidades
    # =====================================================

    # Rate limiting por IP (requests por minuto)
    IP_RATE_LIMIT = 10              # Max requests por minuto al login
    IP_RATE_WINDOW = 60             # Ventana en segundos (1 minuto)

    # Bloqueo por IP (intentos fallidos)
    IP_BLOCK_THRESHOLDS = [
        (15, 15 * 60),              # 15 fallos -> bloqueo 15 minutos
        (30, 60 * 60),              # 30 fallos -> bloqueo 1 hora
        (50, 24 * 60 * 60),         # 50 fallos -> bloqueo 24 horas
    ]
    IP_FAILED_TTL = 24 * 60 * 60    # TTL del contador de fallos (24h)

    # Bloqueo por Usuario (intentos fallidos)
    USER_BLOCK_THRESHOLDS = [
        (5, 5 * 60),                # 5 fallos -> bloqueo 5 minutos
        (10, 15 * 60),              # 10 fallos -> bloqueo 15 minutos
        (15, 60 * 60),              # 15 fallos -> bloqueo 1 hora
        (20, 24 * 60 * 60),         # 20 fallos -> bloqueo 24 horas
    ]
    USER_FAILED_TTL = 24 * 60 * 60  # TTL del contador de fallos (24h)

    # Prefijos de keys en Redis
    PREFIX_IP_RATE = "rate:ip:"
    PREFIX_IP_FAILED = "failed:ip:"
    PREFIX_IP_BLOCK = "block:ip:"
    PREFIX_USER_FAILED = "failed:user:"
    PREFIX_USER_BLOCK = "block:user:"

    # =====================================================
    # RATE LIMITING POR IP (Sliding Window)
    # =====================================================

    def check_ip_rate_limit(self, ip: str) -> Tuple[bool, int]:
        """
        Verifica si una IP ha excedido el rate limit.

        Returns:
            Tuple[bool, int]: (is_limited, remaining_requests)
        """
        key = f"{self.PREFIX_IP_RATE}{ip}"
        now = time.time()
        window_start = now - self.IP_RATE_WINDOW

        pipe = redis_client.pipeline()

        # Eliminar requests fuera de la ventana
        pipe.zremrangebyscore(key, 0, window_start)

        # Contar requests en la ventana actual
        pipe.zcard(key)

        # Agregar el request actual
        pipe.zadd(key, {str(now): now})

        # Establecer TTL
        pipe.expire(key, self.IP_RATE_WINDOW)

        results = pipe.execute()
        current_count = results[1]

        remaining = max(0, self.IP_RATE_LIMIT - current_count - 1)
        is_limited = current_count >= self.IP_RATE_LIMIT

        return is_limited, remaining

    def is_ip_rate_limited(self, ip: str) -> bool:
        """Shorthand para verificar si IP esta rate limited."""
        is_limited, _ = self.check_ip_rate_limit(ip)
        return is_limited

    # =====================================================
    # BLOQUEO POR IP (Intentos Fallidos)
    # =====================================================

    def record_ip_failed_attempt(self, ip: str) -> int:
        """
        Registra un intento fallido desde una IP.

        Returns:
            int: Numero actual de intentos fallidos
        """
        key = f"{self.PREFIX_IP_FAILED}{ip}"

        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.IP_FAILED_TTL)
        results = pipe.execute()

        attempts = results[0]

        # Verificar si debemos bloquear
        for threshold, block_duration in self.IP_BLOCK_THRESHOLDS:
            if attempts == threshold:
                self._block_ip(ip, block_duration)
                break

        return attempts

    def _block_ip(self, ip: str, duration: int):
        """Bloquea una IP por una duracion especifica."""
        key = f"{self.PREFIX_IP_BLOCK}{ip}"
        redis_client.setex(key, duration, "blocked")

        # Log para auditoria
        print(f"[SECURITY] IP {ip} bloqueada por {duration}s")

    def is_ip_blocked(self, ip: str) -> bool:
        """Verifica si una IP esta bloqueada."""
        key = f"{self.PREFIX_IP_BLOCK}{ip}"
        return redis_client.exists(key) == 1

    def get_ip_block_remaining(self, ip: str) -> int:
        """Obtiene segundos restantes de bloqueo para una IP."""
        key = f"{self.PREFIX_IP_BLOCK}{ip}"
        ttl = redis_client.ttl(key)
        return max(0, ttl)

    # =====================================================
    # BLOQUEO POR USUARIO (Intentos Fallidos)
    # =====================================================

    def record_user_failed_attempt(self, username: str) -> int:
        """
        Registra un intento fallido para un usuario.

        Returns:
            int: Numero actual de intentos fallidos
        """
        key = f"{self.PREFIX_USER_FAILED}{username}"

        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.USER_FAILED_TTL)
        results = pipe.execute()

        attempts = results[0]

        # Verificar si debemos bloquear
        for threshold, block_duration in self.USER_BLOCK_THRESHOLDS:
            if attempts == threshold:
                self._block_user(username, block_duration)
                break

        return attempts

    def _block_user(self, username: str, duration: int):
        """Bloquea un usuario por una duracion especifica."""
        key = f"{self.PREFIX_USER_BLOCK}{username}"
        redis_client.setex(key, duration, "blocked")

        # Log para auditoria
        print(f"[SECURITY] Usuario '{username}' bloqueado por {duration}s")

    def is_user_blocked(self, username: str) -> bool:
        """Verifica si un usuario esta bloqueado."""
        key = f"{self.PREFIX_USER_BLOCK}{username}"
        return redis_client.exists(key) == 1

    def get_user_block_remaining(self, username: str) -> int:
        """Obtiene segundos restantes de bloqueo para un usuario."""
        key = f"{self.PREFIX_USER_BLOCK}{username}"
        ttl = redis_client.ttl(key)
        return max(0, ttl)

    # =====================================================
    # METODOS COMBINADOS
    # =====================================================

    def record_failed_attempt(self, ip: str, username: str) -> dict:
        """
        Registra un intento fallido tanto por IP como por usuario.

        Returns:
            dict: Estado actual de intentos y bloqueos
        """
        ip_attempts = self.record_ip_failed_attempt(ip)
        user_attempts = self.record_user_failed_attempt(username)

        return {
            "ip_attempts": ip_attempts,
            "ip_blocked": self.is_ip_blocked(ip),
            "user_attempts": user_attempts,
            "user_blocked": self.is_user_blocked(username)
        }

    def reset_user_attempts(self, username: str):
        """
        Resetea los intentos fallidos de un usuario tras login exitoso.
        NO resetea el contador de IP (podria ser un atacante que adivino).
        """
        key = f"{self.PREFIX_USER_FAILED}{username}"
        redis_client.delete(key)

    def get_protection_status(self, ip: str, username: str) -> dict:
        """
        Obtiene el estado completo de proteccion para debug/admin.
        """
        return {
            "ip": {
                "address": ip,
                "rate_limited": self.is_ip_rate_limited(ip),
                "blocked": self.is_ip_blocked(ip),
                "block_remaining": self.get_ip_block_remaining(ip),
                "failed_attempts": int(redis_client.get(
                    f"{self.PREFIX_IP_FAILED}{ip}") or 0)
            },
            "user": {
                "username": username,
                "blocked": self.is_user_blocked(username),
                "block_remaining": self.get_user_block_remaining(username),
                "failed_attempts": int(redis_client.get(
                    f"{self.PREFIX_USER_FAILED}{username}") or 0)
            }
        }


# Singleton
rate_limiter = RateLimiter()
```

### Archivo: decorators.py

```python
"""
Decoradores de Flask para rate limiting.
"""
from functools import wraps
from flask import request, jsonify
from .rate_limiter import rate_limiter

def get_client_ip():
    """Obtiene la IP real del cliente considerando proxies."""
    # Orden de prioridad para obtener IP real
    if request.headers.get("X-Forwarded-For"):
        # X-Forwarded-For puede tener multiples IPs: client, proxy1, proxy2
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    elif request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP")
    else:
        return request.remote_addr


def rate_limit_login(f):
    """
    Decorador para aplicar rate limiting al endpoint de login.

    Uso:
        @auth_bp.route("/login", methods=["POST"])
        @rate_limit_login
        def login():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = get_client_ip()

        # Verificar rate limit por IP
        is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
        if is_limited:
            return jsonify({
                "code": "TOO_MANY_REQUESTS",
                "message": "Demasiadas solicitudes. Intenta en un minuto.",
                "retry_after": rate_limiter.IP_RATE_WINDOW
            }), 429

        # Verificar si IP esta bloqueada
        if rate_limiter.is_ip_blocked(ip):
            remaining_time = rate_limiter.get_ip_block_remaining(ip)
            return jsonify({
                "code": "IP_BLOCKED",
                "message": "Tu direccion IP ha sido bloqueada temporalmente.",
                "retry_after": remaining_time
            }), 403

        return f(*args, **kwargs)

    return decorated_function


def check_user_blocked(username: str):
    """
    Verifica si un usuario especifico esta bloqueado.

    Uso (dentro del endpoint):
        blocked, response = check_user_blocked(username)
        if blocked:
            return response
    """
    if rate_limiter.is_user_blocked(username):
        remaining_time = rate_limiter.get_user_block_remaining(username)
        return True, (jsonify({
            "code": "USER_LOCKED",
            "message": "Usuario temporalmente bloqueado por seguridad.",
            "retry_after": remaining_time
        }), 423)

    return False, None
```

---

## Configuracion de Endpoints

### Modificar auth_routes.py

```python
# src/presentation/api/auth_routes.py

from flask import Blueprint, request, jsonify
from src.infrastructure.rate_limiting.decorators import (
    rate_limit_login,
    check_user_blocked,
    get_client_ip
)
from src.infrastructure.rate_limiting.rate_limiter import rate_limiter
from src.use_cases.auth.login_usecase import LoginUseCase
# ... otros imports

auth_bp = Blueprint("auth", __name__)
login_usecase = LoginUseCase()

@auth_bp.route("/login", methods=["POST"])
@rate_limit_login  # <-- Decorador de rate limiting
def login():
    data = request.get_json()

    if not data or "usuario" not in data or "clave" not in data:
        return jsonify({
            "code": "INVALID_REQUEST",
            "message": "Usuario y contrasena son requeridos"
        }), 400

    usuario = data.get("usuario")
    clave = data.get("clave")
    ip = get_client_ip()

    # Verificar si el usuario esta bloqueado
    blocked, response = check_user_blocked(usuario)
    if blocked:
        return response

    # Ejecutar login
    result, error = login_usecase.execute(usuario, clave, ip)

    if error:
        # Registrar intento fallido en Redis
        if error in ["INVALID_CREDENTIALS", "USER_NOT_FOUND"]:
            rate_limiter.record_failed_attempt(ip, usuario)

        mapping = {
            "INVALID_CREDENTIALS": (401, "Usuario o contrasena incorrectos"),
            "USER_LOCKED": (423, "Usuario temporalmente bloqueado"),
            "USER_INACTIVE": (403, "Usuario inactivo"),
            "SERVER_ERROR": (500, "Error interno del servidor")
        }
        status, msg = mapping.get(error, (500, "Error desconocido"))
        return jsonify({"code": error, "message": msg}), status

    # Login exitoso - resetear intentos del usuario
    rate_limiter.reset_user_attempts(usuario)

    return jsonify(result), 200
```

### Configurar Variables de Entorno

Agregar a `.env`:

```bash
# --- REDIS ---
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# --- RATE LIMITING ---
RATE_LIMIT_LOGIN_PER_MINUTE=10
RATE_LIMIT_RESET_CODE_PER_MINUTE=5
```

---

## Codigos de Error

### Nuevos Codigos HTTP

| Status | Codigo            | Descripcion                             | Retry-After |
| ------ | ----------------- | --------------------------------------- | ----------- |
| 429    | TOO_MANY_REQUESTS | Rate limit excedido (requests/minuto)   | 60s         |
| 403    | IP_BLOCKED        | IP bloqueada por intentos fallidos      | Variable    |
| 423    | USER_LOCKED       | Usuario bloqueado por intentos fallidos | Variable    |

### Respuesta de Error Estandar

```json
{
  "code": "TOO_MANY_REQUESTS",
  "message": "Demasiadas solicitudes. Intenta en un minuto.",
  "retry_after": 60
}
```

---

## Integracion con el Sistema Actual

### Migracion del Bloqueo de MySQL a Redis

El sistema actual guarda `intentos_fallidos` y `fecha_bloqueo` en MySQL. Se recomienda:

1. **Fase 1:** Implementar Redis en paralelo (ambos sistemas activos)
2. **Fase 2:** Validar que Redis funciona correctamente
3. **Fase 3:** Deprecar campos en MySQL (mantener solo para auditoria)

### Codigo de Migracion Sugerido

```python
# En login_usecase.py - Version hibrida

class LoginUseCase:
    def execute(self, username, password, ip):
        # ... validaciones existentes ...

        # Si Redis esta disponible, usarlo para rate limiting
        if redis_available():
            # Nueva logica con Redis
            pass
        else:
            # Fallback a MySQL (logica actual)
            pass
```

### Migrar OTP a Redis

#### Problema Actual

El servicio `otp_service.py` tiene vulnerabilidades criticas:

```python
OTP_STORE = {}  # <-- Diccionario en memoria
```

| Problema | Gravedad | Impacto |
|----------|----------|---------|
| Almacenamiento en RAM | ALTA | Si el servidor reinicia, TODOS los codigos OTP pendientes se pierden |
| Sin persistencia | ALTA | El usuario tiene que volver a solicitar el codigo |
| Sin rate limiting | MEDIA | Un atacante puede hacer fuerza bruta en el codigo (1M combinaciones) |
| Estado no compartido | MEDIA | Si hay multiples instancias del backend, cada una tiene su propio store |

#### Requerimientos Funcionales

El sistema de OTP para recuperacion de contrasena debe cumplir:

1. **Generacion:** Codigo de 6 digitos aleatorio
2. **Expiracion:** El codigo expira a los 10 minutos de generarse
3. **Intentos limitados:** Maximo 3 intentos incorrectos por codigo
4. **Invalidacion por intentos:** Al 3er intento fallido, el codigo se invalida (no expira, se INVALIDA)
5. **Un solo uso:** El codigo se elimina tras verificacion exitosa
6. **Reemplazo:** Si el usuario solicita un nuevo codigo, el anterior se invalida automaticamente

#### Flujo de Verificacion

```
Usuario ingresa codigo
        │
        ▼
┌─────────────────────────┐
│ ¿Existe codigo en Redis?│
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │ NO          │ SI
     ▼             ▼
  ERROR:       ┌────────────────────┐
  CODE_EXPIRED │ ¿Intentos >= 3?    │
  (400)        └────────┬───────────┘
                        │
                 ┌──────┴──────┐
                 │ SI          │ NO
                 ▼             ▼
              ERROR:      ┌────────────────┐
              CODE_EXPIRED│ ¿Codigo coincide?│
              (400)       └────────┬───────┘
                                   │
                            ┌──────┴──────┐
                            │ NO          │ SI
                            ▼             ▼
                         Incrementar   SUCCESS:
                         intentos      Generar reset_token
                         │             Eliminar OTP
                         ▼             │
                      ERROR:           ▼
                      INVALID_CODE   Retornar reset_token
                      (400)          (200)
```

#### Respuestas del Endpoint `/auth/verify-reset-code`

| Caso | Codigo HTTP | code | message |
|------|-------------|------|---------|
| Codigo correcto | 200 | - | `{ valid: true, reset_token: "..." }` |
| Codigo incorrecto (intento 1-2) | 400 | INVALID_CODE | "El codigo ingresado es incorrecto" |
| Codigo incorrecto (intento 3) | 400 | CODE_EXPIRED | "Codigo invalidado por demasiados intentos" |
| Codigo no existe | 400 | CODE_EXPIRED | "El codigo ha expirado o no existe" |
| Codigo expirado por tiempo | 400 | CODE_EXPIRED | "El codigo ha expirado" |
| Rate limit excedido | 429 | TOO_MANY_REQUESTS | "Demasiados intentos. Espera X minutos" |

**Nota:** Usamos `CODE_EXPIRED` tanto para codigos que no existen como para los invalidados por intentos. Esto es intencional para no dar informacion a un atacante sobre si el codigo existio o no.

#### Implementacion con Redis

```python
# src/use_cases/auth/otp_service.py

import random
import json
from src.infrastructure.rate_limiting.redis_client import redis_client

class OTPService:
    """
    Servicio de codigos OTP para recuperacion de contrasena.
    
    Reglas de negocio:
    - Codigo de 6 digitos
    - Expira en 10 minutos
    - Maximo 3 intentos incorrectos (al 3ro se invalida)
    - Un solo uso (se elimina tras verificacion exitosa)
    """

    PREFIX = "otp:"
    TTL = 600  # 10 minutos en segundos
    MAX_ATTEMPTS = 3

    @staticmethod
    def generate_code() -> str:
        """Genera un codigo OTP de 6 digitos."""
        return str(random.randint(100000, 999999))

    @staticmethod
    def save_code(email: str, code: str) -> None:
        """
        Guarda un codigo OTP en Redis.
        
        Si ya existe un codigo para este email, se reemplaza.
        Esto invalida cualquier codigo anterior automaticamente.
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        data = json.dumps({
            "code": code,
            "attempts": 0
        })
        redis_client.setex(key, OTPService.TTL, data)

    @staticmethod
    def verify_code(email: str, code: str) -> tuple[bool, str, str | None]:
        """
        Verifica un codigo OTP.
        
        Args:
            email: Email del usuario
            code: Codigo ingresado por el usuario
            
        Returns:
            tuple: (exito, mensaje_error, codigo_error)
            - Si exito=True: (True, None, None)
            - Si exito=False: (False, "mensaje", "CODIGO_ERROR")
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        raw = redis_client.get(key)

        # Codigo no existe o expiro
        if not raw:
            return False, "El codigo ha expirado o no existe", "CODE_EXPIRED"

        data = json.loads(raw)

        # Ya se agotaron los intentos
        if data["attempts"] >= OTPService.MAX_ATTEMPTS:
            # Eliminar el codigo invalidado
            redis_client.delete(key)
            return False, "Codigo invalidado por demasiados intentos", "CODE_EXPIRED"

        # Codigo incorrecto
        if data["code"] != code:
            data["attempts"] += 1
            remaining_attempts = OTPService.MAX_ATTEMPTS - data["attempts"]
            
            # ¿Es el ultimo intento fallido?
            if data["attempts"] >= OTPService.MAX_ATTEMPTS:
                # Eliminar - codigo invalidado
                redis_client.delete(key)
                return False, "Codigo invalidado por demasiados intentos", "CODE_EXPIRED"
            
            # Actualizar contador manteniendo el TTL restante
            ttl = redis_client.ttl(key)
            if ttl > 0:
                redis_client.setex(key, ttl, json.dumps(data))
            
            return False, f"Codigo incorrecto. Intentos restantes: {remaining_attempts}", "INVALID_CODE"

        # Codigo correcto - eliminar y retornar exito
        redis_client.delete(key)
        return True, None, None

    @staticmethod
    def invalidate_code(email: str) -> bool:
        """
        Invalida manualmente un codigo OTP.
        
        Util cuando el usuario cambia la contrasena por otro medio
        o cuando se quiere forzar la regeneracion.
        
        Returns:
            bool: True si habia un codigo que invalidar
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        return redis_client.delete(key) > 0

    @staticmethod
    def get_remaining_attempts(email: str) -> int | None:
        """
        Obtiene los intentos restantes para un codigo.
        
        Returns:
            int: Intentos restantes (0-3)
            None: Si no existe codigo
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        raw = redis_client.get(key)
        
        if not raw:
            return None
            
        data = json.loads(raw)
        return OTPService.MAX_ATTEMPTS - data["attempts"]
```

#### Integracion con verify_reset_code_usecase.py

```python
# src/use_cases/auth/verify_reset_code_usecase.py

from src.use_cases.auth.otp_service import OTPService
from src.infrastructure.security.jwt_service import JWTService

class VerifyResetCodeUseCase:
    """
    Verifica el codigo OTP y genera un token temporal para resetear la contrasena.
    """

    def execute(self, email: str, code: str) -> tuple[dict | None, str | None]:
        """
        Args:
            email: Email del usuario
            code: Codigo OTP de 6 digitos
            
        Returns:
            tuple: (resultado, error)
            - Exito: ({ "valid": True, "reset_token": "..." }, None)
            - Error: (None, "CODIGO_ERROR")
        """
        # Verificar codigo
        is_valid, message, error_code = OTPService.verify_code(email, code)

        if not is_valid:
            return {"valid": False, "message": message}, error_code

        # Codigo valido - generar token temporal para reset
        reset_token = JWTService.generate_reset_token(email)

        return {
            "valid": True,
            "reset_token": reset_token
        }, None
```

#### Consideraciones de Seguridad Adicionales

1. **Rate limiting en el endpoint:** Ademas del limite de 3 intentos por codigo, aplicar rate limiting general al endpoint `/auth/verify-reset-code` (ej: 5 requests/minuto por IP).

2. **No revelar informacion:** Si el email no existe en el sistema, NO retornar un error diferente. Siempre responder como si el correo se hubiera enviado.

3. **Logging de seguridad:** Registrar intentos fallidos para deteccion de patrones de ataque.

```python
# Log cuando se invalida un codigo por intentos
if data["attempts"] >= OTPService.MAX_ATTEMPTS:
    security_logger.warning(f"OTP invalidado por intentos: email={email}")
```

4. **Limitar solicitudes de codigo:** Aplicar rate limiting tambien a `/auth/request-reset-code` para evitar spam de emails (ej: 3 solicitudes/hora por email).

---

## Testing

### Casos de Prueba

```python
# tests/test_rate_limiting.py

import pytest
from src.infrastructure.rate_limiting.rate_limiter import rate_limiter

class TestRateLimiting:

    def setup_method(self):
        """Limpiar Redis antes de cada test."""
        # Limpiar keys de test
        pass

    def test_ip_rate_limit_allows_under_threshold(self):
        """Debe permitir requests bajo el limite."""
        ip = "192.168.1.100"

        for i in range(rate_limiter.IP_RATE_LIMIT - 1):
            is_limited, _ = rate_limiter.check_ip_rate_limit(ip)
            assert is_limited is False

    def test_ip_rate_limit_blocks_over_threshold(self):
        """Debe bloquear cuando se excede el limite."""
        ip = "192.168.1.101"

        for i in range(rate_limiter.IP_RATE_LIMIT + 5):
            is_limited, _ = rate_limiter.check_ip_rate_limit(ip)

        assert is_limited is True

    def test_user_blocked_after_threshold(self):
        """Usuario debe bloquearse tras N intentos."""
        username = "test_user_block"

        for i in range(5):  # Primer threshold
            rate_limiter.record_user_failed_attempt(username)

        assert rate_limiter.is_user_blocked(username) is True

    def test_ip_blocked_after_threshold(self):
        """IP debe bloquearse tras N intentos."""
        ip = "192.168.1.102"

        for i in range(15):  # Primer threshold
            rate_limiter.record_ip_failed_attempt(ip)

        assert rate_limiter.is_ip_blocked(ip) is True

    def test_successful_login_resets_user_attempts(self):
        """Login exitoso debe resetear intentos del usuario."""
        username = "test_user_reset"

        # Simular 3 intentos fallidos
        for i in range(3):
            rate_limiter.record_user_failed_attempt(username)

        # Simular login exitoso
        rate_limiter.reset_user_attempts(username)

        # Verificar que se resetearon
        key = f"failed:user:{username}"
        from src.infrastructure.rate_limiting.redis_client import redis_client
        assert redis_client.get(key) is None
```

### Script de Prueba Manual

```bash
#!/bin/bash
# test_rate_limit.sh - Probar rate limiting

ENDPOINT="http://localhost:5000/api/v1/auth/login"

echo "=== Probando Rate Limiting ==="

for i in {1..15}; do
    echo "Request $i:"
    curl -s -X POST $ENDPOINT \
        -H "Content-Type: application/json" \
        -d '{"usuario":"test","clave":"wrong"}' \
        | jq '.code'
    sleep 0.1
done

echo "=== Fin del test ==="
```

---

## Monitoreo y Alertas

### Metricas a Monitorear

| Metrica             | Descripcion                        | Alerta    |
| ------------------- | ---------------------------------- | --------- |
| `rate_limit_hits`   | Requests rechazados por rate limit | > 100/min |
| `ip_blocks`         | IPs bloqueadas actualmente         | > 10      |
| `user_blocks`       | Usuarios bloqueados                | > 5       |
| `failed_login_rate` | Intentos fallidos / minuto         | > 50/min  |

### Endpoint de Salud (Opcional)

```python
@auth_bp.route("/security/status", methods=["GET"])
@admin_required  # Solo admins
def security_status():
    from src.infrastructure.rate_limiting.redis_client import RedisClient

    return jsonify({
        "redis_healthy": RedisClient.health_check(),
        "active_ip_blocks": get_active_ip_blocks_count(),
        "active_user_blocks": get_active_user_blocks_count()
    })
```

### Logs Estructurados

```python
import logging
import json

security_logger = logging.getLogger("security")

def log_security_event(event_type: str, data: dict):
    security_logger.warning(json.dumps({
        "event": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        **data
    }))

# Uso:
log_security_event("IP_BLOCKED", {
    "ip": "192.168.1.100",
    "attempts": 15,
    "duration": 900
})
```

---

## Checklist de Implementacion

### Rate Limiting
- [ ] Instalar dependencias (`redis`, `flask-limiter`)
- [ ] Crear estructura de archivos en `infrastructure/rate_limiting/`
- [ ] Implementar `redis_client.py`
- [ ] Implementar `rate_limiter.py`
- [ ] Implementar `decorators.py`
- [ ] Modificar `auth_routes.py` para usar decoradores
- [ ] Configurar variables de entorno de Redis

### Migracion OTP a Redis
- [ ] Migrar `otp_service.py` de diccionario en memoria a Redis
- [ ] Implementar invalidacion por 3 intentos fallidos (ya existe logica, solo migrar storage)
- [ ] Implementar `invalidate_code()` para invalidacion manual
- [ ] Retornar `CODE_EXPIRED` cuando se agotan los intentos (no `TOO_MANY_REQUESTS`)
- [ ] Aplicar rate limiting a `/auth/verify-reset-code` (5 req/min por IP)
- [ ] Aplicar rate limiting a `/auth/request-reset-code` (3 req/hora por email)

### Testing y Monitoreo
- [ ] Escribir tests unitarios para rate limiting
- [ ] Escribir tests unitarios para OTP
- [ ] Probar manualmente con script
- [ ] Configurar monitoreo/alertas
- [ ] Documentar en README del proyecto

---

## Referencias

- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)
- [Redis Documentation](https://redis.io/docs/)
- [Flask-Limiter Documentation](https://flask-limiter.readthedocs.io/)

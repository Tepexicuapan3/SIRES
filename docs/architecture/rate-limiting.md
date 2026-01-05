# Rate Limiting - SIRES

> **TL;DR:** Sistema de rate limiting en 3 niveles usando Redis para prevenir ataques de fuerza bruta, DDoS, y spam. Implementa sliding window + bloqueos escalonados por IP y usuario.

## Índice

- [Problema y Contexto](#problema-y-contexto)
- [Arquitectura de Protección](#arquitectura-de-protección)
- [Nivel 1: Rate Limit por IP](#nivel-1-rate-limit-por-ip-sliding-window)
- [Nivel 2: Bloqueo por IP](#nivel-2-bloqueo-por-ip-intentos-fallidos)
- [Nivel 3: Bloqueo por Usuario](#nivel-3-bloqueo-por-usuario-intentos-fallidos)
- [Implementación](#implementación)
- [Configuración](#configuración)
- [Casos de Uso](#casos-de-uso)
- [Troubleshooting](#troubleshooting)

---

## Problema y Contexto

### ¿Qué Estamos Previniendo?

1. **Ataques de fuerza bruta**: Intentos masivos de adivinar contraseñas
2. **DDoS por capa de aplicación**: Flood de requests legítimos que saturan el servidor
3. **Credential stuffing**: Uso de credenciales filtradas en otros servicios
4. **Spam de emails**: Solicitudes masivas de códigos OTP/recovery
5. **Enumeración de usuarios**: Identificar qué usuarios existen en el sistema

### ¿Por Qué Redis?

| Alternativa | Pros | Contras | Decisión |
|-------------|------|---------|----------|
| **Memoria (diccionario Python)** | Simple, sin deps | No escala, se pierde al reiniciar | ❌ No para producción |
| **Base de datos (MySQL)** | Persistencia | Lento, sobrecarga en DB | ❌ No optimizado para contadores |
| **Redis** | Rápido, TTL automático, escalable | Dependencia adicional | ✅ **Elegido** |

**Decisión:** Redis porque:
- Operaciones O(1) en contadores (INCR, EXPIRE)
- TTL automático (no necesitamos cronjobs de limpieza)
- Escalable horizontalmente (múltiples instancias del backend)
- Estructura de datos flexible (sorted sets para sliding window)

---

## Arquitectura de Protección

### Sistema de 3 Niveles (Defensa en Profundidad)

```
┌─────────────────────────────────────────────────────────────┐
│                     REQUEST ENTRANTE                         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  NIVEL 1: Rate Limit IP │  ← Sliding Window (10 req/min login, 5 req/min OTP)
        │  ¿Demasiadas requests?  │
        └────────────┬────────────┘
                     │ NO
        ┌────────────▼────────────┐
        │  NIVEL 2: Bloqueo IP    │  ← 15/30/50 fallos → bloqueo 15min/1h/24h
        │  ¿IP bloqueada?         │
        └────────────┬────────────┘
                     │ NO
        ┌────────────▼────────────┐
        │ NIVEL 3: Bloqueo Usuario│  ← 5/10/15/20 fallos → bloqueo 5min/15min/1h/24h
        │  ¿Usuario bloqueado?    │
        └────────────┬────────────┘
                     │ NO
        ┌────────────▼────────────┐
        │   PROCESAR LOGIN        │
        └─────────────────────────┘
```

### ¿Por Qué 3 Niveles?

- **Nivel 1 (Rate Limit)**: Detiene floods rápidos (bots tontos, DDoS básico)
- **Nivel 2 (Bloqueo IP)**: Detiene ataques distribuidos lentos (botnets coordinadas)
- **Nivel 3 (Bloqueo Usuario)**: Detiene ataques dirigidos (alguien target a un usuario específico)

---

## Nivel 1: Rate Limit por IP (Sliding Window)

### ¿Qué es Sliding Window?

A diferencia de un rate limit "fijo" que resetea cada minuto completo (00:00, 01:00, 02:00...), el **sliding window** cuenta requests en los **últimos 60 segundos desde AHORA**.

**Ejemplo:**

```
Límite: 10 requests/minuto
Timestamp actual: 14:35:27

┌─────────────────────────────────────────────────────────┐
│            Ventana deslizante (60 segundos)             │
│                                                           │
│  14:34:27                                    14:35:27    │
│     ├────────────────────────────────────────┤          │
│     │  ●  ●●    ●●●  ●●     ●                │          │
│     │  1  23    456  78     9                │          │
│     │                                         │ ← Request 10 (aceptado)
│     │                                         │ ← Request 11 (RECHAZADO - 429)
│     └─────────────────────────────────────────┘
│                Cuenta: 9 requests
└─────────────────────────────────────────────────────────┘
```

### Implementación en Redis

```python
def _check_rate_limit(self, *, key_prefix: str, ip: str, limit: int, window_seconds: int):
    key = f"{key_prefix}{ip}"
    now = time.time()
    window_start = now - window_seconds

    pipe = redis_client.pipeline()
    
    # 1. Eliminar requests fuera de la ventana
    pipe.zremrangebyscore(key, 0, window_start)
    
    # 2. Contar requests en la ventana actual
    pipe.zcard(key)
    
    # 3. Agregar el request actual
    pipe.zadd(key, {str(now): now})
    
    # 4. Establecer TTL para limpieza automática
    pipe.expire(key, window_seconds)
    
    results = pipe.execute()
    current_count = results[1]
    
    is_limited = current_count >= limit
    return is_limited, remaining
```

**Estructura en Redis:**

```
Key: rate:ip:192.168.1.100
Type: Sorted Set (ZSET)
Value: {
  "1735839267.123": 1735839267.123,  ← timestamp como score y member
  "1735839268.456": 1735839268.456,
  "1735839269.789": 1735839269.789,
  ...
}
TTL: 60 segundos
```

### Límites por Endpoint

| Endpoint | Prefijo Redis | Límite | Ventana | Variable de Entorno |
|----------|---------------|--------|---------|---------------------|
| `/login` | `rate:ip:` | 10 req | 60s | `RATE_LIMIT_LOGIN_PER_MINUTE` |
| `/request-reset-code` | `rate:otp:ip:` | 5 req | 60s | `RATE_LIMIT_OTP_PER_MINUTE` |
| `/verify-reset-code` | `rate:otp:ip:` | 5 req | 60s | `RATE_LIMIT_OTP_PER_MINUTE` |

**Nota:** Login es más permisivo (10 req/min) porque usuarios legítimos pueden escribir mal su password. OTP es restrictivo (5 req/min) para prevenir spam de emails.

---

## Nivel 2: Bloqueo por IP (Intentos Fallidos)

### Bloqueos Escalonados (Progressive Blocking)

Cuando una IP falla múltiples logins, se bloquea **automáticamente** por tiempo creciente:

```python
IP_BLOCK_THRESHOLDS = [
    (15, 15 * 60),       # 15 fallos → bloqueo 15 minutos
    (30, 60 * 60),       # 30 fallos → bloqueo 1 hora
    (50, 24 * 60 * 60),  # 50 fallos → bloqueo 24 horas
]
```

**Ejemplo de flujo:**

```
IP: 203.0.113.42
┌────────────────────────────────────────────────────────────┐
│ Intento 1-14  → Contador aumenta (no hay bloqueo)         │
│ Intento 15    → 🔒 BLOQUEO 15 minutos                      │
│ [Espera 15min]                                             │
│ Intento 16-29 → Contador sigue aumentando                 │
│ Intento 30    → 🔒 BLOQUEO 1 hora                          │
│ [Espera 1h]                                                │
│ Intento 31-49 → Contador sigue aumentando                 │
│ Intento 50    → 🔒 BLOQUEO 24 horas                        │
└────────────────────────────────────────────────────────────┘
```

### Estructura en Redis

**Contador de fallos:**
```
Key: failed:ip:203.0.113.42
Type: String (contador)
Value: 15
TTL: 86400 (24 horas)
```

**Estado de bloqueo:**
```
Key: block:ip:203.0.113.42
Type: String
Value: "blocked"
TTL: 900 (15 minutos)
```

### ¿Cuándo se resetea el contador?

- **Automáticamente**: Después de 24 horas de inactividad (TTL)
- **NUNCA tras login exitoso**: Un atacante podría adivinar una contraseña; queremos seguir trackeando la IP

---

## Nivel 3: Bloqueo por Usuario (Intentos Fallidos)

### Bloqueos Escalonados por Usuario

Similar al bloqueo por IP, pero **más agresivo** porque protege cuentas específicas:

```python
USER_BLOCK_THRESHOLDS = [
    (5, 5 * 60),         # 5 fallos → bloqueo 5 minutos
    (10, 15 * 60),       # 10 fallos → bloqueo 15 minutos
    (15, 60 * 60),       # 15 fallos → bloqueo 1 hora
    (20, 24 * 60 * 60),  # 20 fallos → bloqueo 24 horas
]
```

**¿Por qué más agresivo?**

- Si alguien está intentando 5 veces con el usuario `admin`, es un ataque dirigido
- Los usuarios legítimos normalmente fallan 1-2 veces máximo

### Estructura en Redis

**Contador de fallos:**
```
Key: failed:user:admin
Type: String
Value: 5
TTL: 86400 (24 horas)
```

**Estado de bloqueo:**
```
Key: block:user:admin
Type: String
Value: "blocked"
TTL: 300 (5 minutos en el primer bloqueo)
```

### ¿Cuándo se resetea el contador?

- **Tras login exitoso**: `rate_limiter.reset_user_attempts(username)`
- **Automáticamente**: Después de 24 horas de inactividad (TTL)

---

## Implementación

### Arquitectura de Clases

```
backend/src/infrastructure/rate_limiting/
├── __init__.py              # Exports públicos
├── redis_client.py          # Singleton de conexión Redis
├── rate_limiter.py          # Lógica de rate limiting
└── decorators.py            # Decoradores Flask
```

### 1. Cliente Redis (Singleton)

```python
# backend/src/infrastructure/rate_limiting/redis_client.py

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

redis_client = RedisClient.get_instance()
```

**Patrón:** Singleton para reutilizar conexión TCP (connection pooling interno de `redis-py`).

### 2. RateLimiter (Lógica de Negocio)

```python
# backend/src/infrastructure/rate_limiting/rate_limiter.py

class RateLimiter:
    # Configuración
    IP_RATE_LIMIT = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", 10))
    OTP_RATE_LIMIT = int(os.getenv("RATE_LIMIT_OTP_PER_MINUTE", 5))
    
    # Métodos principales
    def check_ip_rate_limit(self, ip: str) -> Tuple[bool, int]:
        """Rate limit para login"""
        
    def check_ip_rate_limit_otp(self, ip: str) -> Tuple[bool, int]:
        """Rate limit para OTP/recovery"""
        
    def record_failed_attempt(self, ip: str, username: str) -> dict:
        """Registra fallo en IP y usuario simultáneamente"""
        
    def reset_user_attempts(self, username: str) -> None:
        """Resetea contador de usuario tras login exitoso"""

rate_limiter = RateLimiter()
```

### 3. Decoradores Flask

```python
# backend/src/infrastructure/rate_limiting/decorators.py

def rate_limit_login(f):
    """Decorador para /login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = get_client_ip()
        
        # Verificar rate limit
        is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
        if is_limited:
            return jsonify({
                "code": "TOO_MANY_REQUESTS",
                "message": "Demasiadas solicitudes. Intenta en un minuto.",
                "retry_after": 60
            }), 429
        
        # Verificar si IP está bloqueada
        if rate_limiter.is_ip_blocked(ip):
            remaining_time = rate_limiter.get_ip_block_remaining(ip)
            return jsonify({
                "code": "IP_BLOCKED",
                "message": "Tu dirección IP ha sido bloqueada temporalmente.",
                "retry_after": remaining_time
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function
```

### 4. Uso en Endpoints

```python
# backend/src/presentation/api/auth_routes.py

@auth_bp.route("/login", methods=["POST"])
@rate_limit_login  # 👈 Decorador nivel 1 y 2
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    
    # Verificar bloqueo de usuario (nivel 3)
    blocked, response = check_user_blocked(usuario)
    if blocked:
        return response
    
    # Intentar login
    result, error = login_usecase.execute(usuario, password)
    
    if error:
        # Registrar fallo (nivel 2 y 3)
        ip = get_client_ip()
        rate_limiter.record_failed_attempt(ip, usuario)
        return jsonify({"code": error, ...}), 401
    
    # Login exitoso - resetear contador de usuario
    rate_limiter.reset_user_attempts(usuario)
    return jsonify(result), 200
```

---

## Configuración

### Variables de Entorno

```bash
# backend/.env

# Redis
REDIS_HOST=redis                    # Host del servidor Redis
REDIS_PORT=6379                     # Puerto (default: 6379)
REDIS_DB=0                          # Base de datos (0-15)

# Rate Limiting
RATE_LIMIT_LOGIN_PER_MINUTE=10      # Requests/min para /login
RATE_LIMIT_OTP_PER_MINUTE=5         # Requests/min para OTP endpoints

# Proxies Confiables (para obtener IP real)
TRUSTED_PROXIES=127.0.0.1,172.18.0.1  # IPs de proxies reverse
```

### Ajustar Límites en Código

Si necesitás cambios más agresivos, editá las constantes:

```python
# backend/src/infrastructure/rate_limiting/rate_limiter.py

class RateLimiter:
    # Bloqueo por IP (hacer más agresivo)
    IP_BLOCK_THRESHOLDS = [
        (10, 10 * 60),       # 10 fallos → 10 minutos (antes: 15/15)
        (20, 30 * 60),       # 20 fallos → 30 minutos (antes: 30/60)
        (30, 12 * 60 * 60),  # 30 fallos → 12 horas (antes: 50/24h)
    ]
    
    # Bloqueo por Usuario (hacer más permisivo)
    USER_BLOCK_THRESHOLDS = [
        (10, 5 * 60),        # 10 fallos → 5 minutos (antes: 5/5)
        (15, 15 * 60),       # 15 fallos → 15 minutos (antes: 10/15)
        (20, 60 * 60),       # 20 fallos → 1 hora (antes: 15/60)
    ]
```

---

## Casos de Uso

### Caso 1: Usuario Legítimo Olvida su Contraseña

**Escenario:**
```
Usuario: dr.garcia
IP: 192.168.1.50
Acción: Intenta login 3 veces con password incorrecta
```

**Flujo:**
1. ✅ Request 1: Rate limit OK (1/10), no bloqueado
   - Login falla → `failed:user:dr.garcia = 1`
2. ✅ Request 2: Rate limit OK (2/10), no bloqueado
   - Login falla → `failed:user:dr.garcia = 2`
3. ✅ Request 3: Rate limit OK (3/10), no bloqueado
   - Login falla → `failed:user:dr.garcia = 3`
4. 🔄 Usuario va a "Olvidé mi contraseña"
5. ✅ Recibe OTP, resetea password
6. ✅ Login exitoso → `failed:user:dr.garcia` eliminado

**Resultado:** Usuario legítimo nunca fue bloqueado (threshold es 5).

---

### Caso 2: Bot de Fuerza Bruta Rápido

**Escenario:**
```
Bot: BruteForceBot v1.0
IP: 203.0.113.42
Acción: 20 requests/segundo intentando adivinar passwords
```

**Flujo:**
1. ✅ Requests 1-10: Rate limit OK
2. ❌ Requests 11+: **429 TOO_MANY_REQUESTS** (Nivel 1)
   - Bloqueado por 60 segundos
3. 🕐 Bot espera 60 segundos
4. ✅ Requests 11-20: Rate limit OK de nuevo
5. ❌ Request 21+: **429 TOO_MANY_REQUESTS**

**Resultado:** Bot puede intentar 10 requests cada 60 segundos máximo. Si acumula 15 fallos → bloqueo IP por 15 minutos.

---

### Caso 3: Ataque Dirigido (Credential Stuffing)

**Escenario:**
```
Atacante: Tiene lista de passwords filtradas de otro sitio
IP: 198.51.100.10
Target: usuario "admin"
Acción: Intenta 100 passwords de la lista lentamente (1 cada 10 segundos)
```

**Flujo:**
1. ✅ Requests 1-5: Rate limit OK (lento), no bloqueado
   - Todos fallan → `failed:user:admin = 5`
2. ❌ Request 6: **423 USER_LOCKED** (Nivel 3)
   - Usuario `admin` bloqueado por 5 minutos
3. 🕐 Atacante espera 5 minutos
4. ✅ Requests 6-10: Rate limit OK
   - Todos fallan → `failed:user:admin = 10`
5. ❌ Request 11: **423 USER_LOCKED**
   - Usuario `admin` bloqueado por 15 minutos

**Resultado:** Atacante puede intentar máximo 5 passwords cada 5 minutos, luego 5 cada 15 min, luego 5 cada hora. Impracticable.

---

### Caso 4: Ataque Distribuido (Botnet)

**Escenario:**
```
Botnet: 50 IPs diferentes
Target: usuario "admin"
Acción: Cada IP intenta 1 password cada 2 minutos
```

**Flujo:**
1. IP 1: Intenta password → falla → `failed:user:admin = 1`
2. IP 2: Intenta password → falla → `failed:user:admin = 2`
3. IP 3: Intenta password → falla → `failed:user:admin = 3`
4. IP 4: Intenta password → falla → `failed:user:admin = 4`
5. IP 5: Intenta password → falla → `failed:user:admin = 5`
6. ❌ IP 6: **423 USER_LOCKED** (Nivel 3)
   - Usuario bloqueado por 5 minutos

**Resultado:** Solo 5 intentos totales permitidos en ventana de 24h antes de bloqueo. Botnet neutralizada.

---

## Troubleshooting

### Problema: "429 TOO_MANY_REQUESTS" en desarrollo

**Causa:** Estás refrescando la página muchas veces mientras desarrollás.

**Solución temporal:**

```python
# backend/src/infrastructure/rate_limiting/decorators.py

# COMENTAR temporalmente el decorador
# @rate_limit_login
def login():
    ...
```

**Solución permanente:**

```bash
# Aumentar límite en desarrollo
echo "RATE_LIMIT_LOGIN_PER_MINUTE=100" >> backend/.env
```

---

### Problema: IP real no se detecta (siempre muestra 172.x.x.x)

**Causa:** Estás detrás de un proxy/reverse proxy y no configuraste `TRUSTED_PROXIES`.

**Solución:**

```bash
# backend/.env
TRUSTED_PROXIES=172.18.0.1,127.0.0.1
```

Verificá:
```python
# En auth_routes.py, agregar log temporal
ip = get_client_ip()
print(f"IP detectada: {ip}")
print(f"Headers: {request.headers}")
```

---

### Problema: "Redis connection refused"

**Causa:** Redis no está corriendo o no es accesible.

**Solución:**

```bash
# Verificar Redis en Docker
docker-compose ps redis

# Si está down
docker-compose up -d redis

# Verificar conexión
docker exec -it sires-redis redis-cli ping
# Debería responder: PONG
```

Si estás en desarrollo local sin Docker:
```bash
# Opción 1: Instalar Redis local
sudo apt install redis-server  # Linux
brew install redis             # Mac

# Opción 2: Deshabilitar rate limiting temporalmente
# (ver problema 429 arriba)
```

---

### Problema: Usuario bloqueado y no puede entrar

**Causa:** Muchos intentos fallidos (5+ en 24h).

**Solución (Admin):**

```python
# Script de desbloqueo manual
# backend/scripts/unblock_user.py

from src.infrastructure.rate_limiting import rate_limiter

username = "dr.garcia"

# Eliminar bloqueo
rate_limiter.redis_client.delete(f"block:user:{username}")
rate_limiter.redis_client.delete(f"failed:user:{username}")

print(f"Usuario {username} desbloqueado")
```

```bash
# Ejecutar
cd backend
python scripts/unblock_user.py
```

**Alternativa (Redis CLI):**
```bash
docker exec -it sires-redis redis-cli

# Buscar keys del usuario
KEYS block:user:dr.garcia
KEYS failed:user:dr.garcia

# Eliminar
DEL block:user:dr.garcia
DEL failed:user:dr.garcia
```

---

### Problema: IP bloqueada por 24h (testing)

**Causa:** Alcanzaste 50 intentos fallidos.

**Solución (Dev):**

```bash
docker exec -it sires-redis redis-cli

# Buscar tu IP
KEYS block:ip:*
KEYS failed:ip:*

# Eliminar bloqueo (reemplazar con tu IP)
DEL block:ip:192.168.1.100
DEL failed:ip:192.168.1.100
```

---

## Métricas y Monitoreo

### Health Check de Redis

```python
# backend/src/presentation/api/health_routes.py

from src.infrastructure.rate_limiting.redis_client import RedisClient

@health_bp.route("/health", methods=["GET"])
def health():
    redis_ok = RedisClient.health_check()
    
    return jsonify({
        "status": "healthy" if redis_ok else "degraded",
        "services": {
            "redis": "ok" if redis_ok else "error"
        }
    }), 200 if redis_ok else 503
```

### Endpoint de Debug (Solo en Dev)

```python
# backend/src/presentation/api/auth_routes.py

@auth_bp.route("/debug/protection-status", methods=["POST"])
def debug_protection_status():
    """SOLO USAR EN DESARROLLO - Eliminar en producción"""
    if os.getenv("FLASK_ENV") != "development":
        return jsonify({"error": "Not available"}), 404
    
    data = request.get_json()
    ip = data.get("ip", get_client_ip())
    username = data.get("username", "unknown")
    
    status = rate_limiter.get_protection_status(ip, username)
    return jsonify(status), 200
```

**Ejemplo de respuesta:**
```json
{
  "ip": {
    "address": "192.168.1.100",
    "rate_limited": false,
    "blocked": false,
    "block_remaining": 0,
    "failed_attempts": 3
  },
  "user": {
    "username": "dr.garcia",
    "blocked": false,
    "block_remaining": 0,
    "failed_attempts": 2
  }
}
```

---

## Seguridad Adicional

### Obtención de IP Real (Anti-Spoofing)

```python
def get_client_ip() -> str:
    """
    Obtiene la IP del cliente de forma segura.
    
    ⚠️ NO confiar ciegamente en X-Forwarded-For (puede ser falsificado).
    
    Solo confiamos en headers si la request viene de un proxy en TRUSTED_PROXIES.
    """
    remote_addr = request.remote_addr or "unknown"
    
    # Allowlist de proxies confiables
    trusted = set(os.getenv("TRUSTED_PROXIES", "").split(","))
    
    # Si no hay proxies declarados o remote_addr no es confiable
    if not trusted or remote_addr not in trusted:
        return remote_addr  # Usar IP directa
    
    # Request viene de proxy confiable - leer headers
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()  # Primer IP en la cadena
    
    return remote_addr
```

**¿Por qué es importante?**

Un atacante podría enviar:
```http
POST /login HTTP/1.1
X-Forwarded-For: 127.0.0.1
```

Si confiamos ciegamente, el atacante bypasea rate limiting usando `127.0.0.1` como IP.

---

## Testing

### Test Manual con cURL

**Test de rate limit:**
```bash
# Login - límite 10/min
for i in {1..12}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usuario": "test", "password": "wrong"}' \
    -w "\nStatus: %{http_code}\n"
  echo "Request $i"
done

# Requests 1-10: 401 INVALID_CREDENTIALS
# Requests 11-12: 429 TOO_MANY_REQUESTS
```

**Test de bloqueo por usuario:**
```bash
# Enviar 6 intentos fallidos (threshold = 5)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usuario": "admin", "password": "wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 7  # Evitar rate limit de IP
done

# Requests 1-5: 401 INVALID_CREDENTIALS
# Request 6: 423 USER_LOCKED
```

### Test Automatizado (Propuesta)

```python
# backend/tests/test_rate_limiting.py

import pytest
import time
from src.infrastructure.rate_limiting import rate_limiter

def test_ip_rate_limit():
    ip = "192.168.1.100"
    
    # Primer request OK
    is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
    assert not is_limited
    assert remaining == 9  # De 10 disponibles
    
    # 9 requests más (total 10)
    for _ in range(9):
        rate_limiter.check_ip_rate_limit(ip)
    
    # Request 11: bloqueado
    is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
    assert is_limited
    assert remaining == 0

def test_user_blocking_escalation():
    username = "test_user"
    ip = "192.168.1.101"
    
    # 5 fallos → primer bloqueo (5 minutos)
    for _ in range(5):
        rate_limiter.record_failed_attempt(ip, username)
    
    assert rate_limiter.is_user_blocked(username)
    assert rate_limiter.get_user_block_remaining(username) <= 300  # 5 min
```

---

## Referencias

- **ADR-004**: Decisión de migrar a Redis para rate limiting (propuesto)
- **Código fuente**: `backend/src/infrastructure/rate_limiting/`
- **Configuración**: `backend/.env`
- **OTP System**: Ver [`docs/architecture/otp-redis.md`](./otp-redis.md)
- **OWASP Cheat Sheet**: [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#login-throttling)

---

## Roadmap

- [ ] Crear ADR-004 documentando decisión de usar Redis
- [ ] Implementar endpoint de métricas para Prometheus/Grafana
- [ ] Agregar tests automatizados (pytest)
- [ ] Configurar alertas para bloqueos masivos (posible ataque en curso)
- [ ] Crear dashboard de admin para ver IPs/usuarios bloqueados
- [ ] Implementar CAPTCHA tras N intentos fallidos (UX mejorado)

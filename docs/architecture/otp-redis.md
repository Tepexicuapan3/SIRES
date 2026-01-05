# Sistema de OTP con Redis - SIRES

> **TL;DR:** Sistema de códigos de un solo uso (OTP) para recuperación de contraseñas usando Redis. Genera códigos de 6 dígitos con expiración de 10 minutos, máximo 3 intentos de verificación, y almacenamiento distribuido escalable.

## Índice

- [Problema y Contexto](#problema-y-contexto)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Flujo Completo](#flujo-completo)
- [Implementación](#implementación)
- [Seguridad](#seguridad)
- [Casos de Uso](#casos-de-uso)
- [Troubleshooting](#troubleshooting)

---

## Problema y Contexto

### ¿Qué es un OTP?

**OTP** (One-Time Password) = Contraseña de un solo uso. En SIRES lo usamos para:

1. **Recuperación de contraseña** (Password Reset Flow)
2. **Verificación de identidad** (el usuario demuestra que tiene acceso al email)

### ¿Por Qué Redis en Lugar de MySQL?

| Criterio | MySQL | Redis | Ganador |
|----------|-------|-------|---------|
| **Velocidad** | ~5-10ms (I/O disco) | <1ms (memoria) | ✅ Redis |
| **Expiración automática** | Requiere cronjob | TTL nativo | ✅ Redis |
| **Escalabilidad** | Vertical | Horizontal | ✅ Redis |
| **Persistencia** | Sí (crítico) | No (aceptable para OTP) | MySQL |
| **Complejidad** | Alta (schemas, indexes) | Baja (key-value) | ✅ Redis |

**Decisión:** Redis porque:
- OTP no necesita persistencia crítica (si se pierde, el usuario pide otro)
- TTL automático elimina la necesidad de cronjobs de limpieza
- Rendimiento crítico (miles de usuarios recuperando passwords simultáneamente)

---

## Arquitectura del Sistema

### Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      SISTEMA OTP                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│    Redis     │
│  (React)     │     │   (Flask)    │     │   (Cache)    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │ 1. Request OTP     │ 2. Generar código   │
       │─────────────────▶  │─────────────────▶   │
       │                    │ 3. Guardar OTP      │
       │                    │   (TTL: 10min)      │
       │                    │ 4. Enviar email     │
       │                    │                     │
       │ 5. Verify OTP      │ 6. Verificar código │
       │─────────────────▶  │◀────────────────────│
       │                    │ 7. Eliminar si OK   │
       │ 8. Reset Password  │                     │
       │─────────────────▶  │                     │
```

### Stack Técnico

| Componente | Tecnología | Responsabilidad |
|------------|------------|-----------------|
| **Generación** | Python `random.randint()` | Generar 6 dígitos aleatorios |
| **Almacenamiento** | Redis (key-value) | Guardar código con TTL |
| **Envío** | Flask-Mail + SMTP | Enviar email con código |
| **Validación** | OTPService (use case) | Verificar código + contador de intentos |
| **Transporte** | HTTP + cookies HttpOnly | Token temporal tras verificación |

---

## Flujo Completo

### Paso 1: Usuario Solicita Recuperación

**Frontend:**
```typescript
// frontend/src/features/auth/api/requestResetCode.ts

const response = await apiClient.post("/auth/request-reset-code", {
  email: "dr.garcia@metro.cdmx.gob.mx"
});

// Response:
// {
//   "code": "EMAIL_SENT",
//   "message": "Si el email existe, recibirás un código en breve."
// }
```

**Backend:**
```python
# backend/src/presentation/api/auth_routes.py

@auth_bp.route("/request-reset-code", methods=["POST"])
@rate_limit_otp  # 5 requests/min
def request_reset_code():
    email = request.get_json().get("email")
    
    # Ejecutar use case
    result, status = reset_code_usecase.execute(email)
    return jsonify(result), status
```

**Use Case:**
```python
# backend/src/use_cases/auth/request_reset_code_usecase.py

class RequestResetCodeUseCase:
    def execute(self, email: str):
        # 1. Verificar que el email existe
        user = self.user_repo.find_by_email(email)
        if not user:
            # NO REVELAR que el email no existe (prevenir enumeración)
            return {"code": "EMAIL_SENT", ...}, 200
        
        # 2. Generar código OTP de 6 dígitos
        otp = OTPService.generate_code()  # "123456"
        
        # 3. Guardar en Redis (TTL: 10 minutos)
        OTPService.save_code(email, otp)
        
        # 4. Enviar email
        self.email_service.send_reset_code(email, otp)
        
        return {"code": "EMAIL_SENT", ...}, 200
```

**Redis (después de este paso):**
```redis
Key: otp:dr.garcia@metro.cdmx.gob.mx
Value: {"code": "123456", "attempts": 0}
TTL: 600 segundos (10 minutos)
```

---

### Paso 2: Usuario Recibe Email

**Email enviado:**
```
De: noreply@sires.metro.cdmx.gob.mx
Para: dr.garcia@metro.cdmx.gob.mx
Asunto: Código de Recuperación - SIRES

Hola,

Tu código de recuperación es:

    1 2 3 4 5 6

Este código expira en 10 minutos.

Si no solicitaste esto, ignora este email.

---
Sistema SIRES - Metro CDMX
```

---

### Paso 3: Usuario Ingresa Código

**Frontend:**
```typescript
// frontend/src/features/auth/api/verifyResetCode.ts

const response = await apiClient.post("/auth/verify-reset-code", {
  email: "dr.garcia@metro.cdmx.gob.mx",
  code: "123456"
});

// Response (si es correcto):
// {
//   "code": "CODE_VERIFIED",
//   "message": "Código verificado. Puedes cambiar tu contraseña."
// }
// + Cookie: reset_token=<JWT_temporal>
```

**Backend:**
```python
# backend/src/presentation/api/auth_routes.py

@auth_bp.route("/verify-reset-code", methods=["POST"])
@rate_limit_otp  # 5 requests/min
def verify_reset_code():
    email = request.get_json().get("email")
    code = request.get_json().get("code")
    
    # Verificar código
    is_valid, message, error_code = OTPService.verify_code(email, code)
    
    if not is_valid:
        return jsonify({"code": error_code, "message": message}), 400
    
    # Generar token temporal (válido 15 minutos)
    reset_token = create_access_token(
        identity=email,
        additional_claims={"purpose": "password_reset"},
        expires_delta=timedelta(minutes=15)
    )
    
    # Setear token en cookie HttpOnly
    response = make_response(jsonify({
        "code": "CODE_VERIFIED",
        "message": "Código verificado. Puedes cambiar tu contraseña."
    }), 200)
    
    set_access_cookies(response, reset_token)
    return response
```

**OTPService (verificación):**
```python
# backend/src/use_cases/auth/otp_service.py

class OTPService:
    @staticmethod
    def verify_code(email: str, code: str):
        key = f"otp:{email.lower()}"
        raw = redis_client.get(key)
        
        # 1. ¿Existe el código?
        if not raw:
            return False, "El código ha expirado o no existe", "CODE_EXPIRED"
        
        data = json.loads(raw)
        
        # 2. ¿Ya se agotaron los intentos?
        if data["attempts"] >= 3:
            redis_client.delete(key)  # Eliminar código invalidado
            return False, "Código invalidado por demasiados intentos", "CODE_EXPIRED"
        
        # 3. ¿El código coincide?
        if data["code"] != code:
            data["attempts"] += 1
            remaining = 3 - data["attempts"]
            
            # ¿Es el último intento?
            if data["attempts"] >= 3:
                redis_client.delete(key)
                return False, "Código invalidado", "CODE_EXPIRED"
            
            # Actualizar contador (mantener TTL)
            ttl = redis_client.ttl(key)
            redis_client.setex(key, ttl, json.dumps(data))
            
            return False, f"Código incorrecto. Intentos restantes: {remaining}", "INVALID_CODE"
        
        # 4. Código correcto - eliminar y retornar éxito
        redis_client.delete(key)
        return True, None, None
```

**Redis (después de verificación exitosa):**
```redis
Key: otp:dr.garcia@metro.cdmx.gob.mx
Value: [ELIMINADO]  👈 El código se consumió
```

---

### Paso 4: Usuario Cambia su Contraseña

**Frontend:**
```typescript
// frontend/src/features/auth/api/resetPassword.ts

// El reset_token va automáticamente en la cookie
const response = await apiClient.post("/auth/reset-password", {
  newPassword: "NuevaPassword123!"
});

// Response:
// {
//   "code": "PASSWORD_RESET",
//   "message": "Contraseña actualizada exitosamente."
// }
```

**Backend:**
```python
# backend/src/presentation/api/auth_routes.py

@auth_bp.route("/reset-password", methods=["POST"])
@jwt_required()  # Requiere el reset_token de la cookie
def reset_password():
    claims = get_jwt()
    
    # Verificar que el token es de tipo password_reset
    if claims.get("purpose") != "password_reset":
        return jsonify({"code": "INVALID_TOKEN", ...}), 403
    
    email = get_jwt_identity()  # Email del token
    new_password = request.get_json().get("newPassword")
    
    # Actualizar contraseña
    result, error = reset_password_usecase.execute(email, new_password)
    
    if error:
        return jsonify({"code": error, ...}), 400
    
    # Invalidar el reset_token
    response = make_response(jsonify(result), 200)
    unset_jwt_cookies(response)
    
    return response
```

---

## Implementación

### Estructura de Archivos

```
backend/src/
├── use_cases/auth/
│   ├── otp_service.py                    # Lógica de OTP
│   ├── request_reset_code_usecase.py     # Step 1: Solicitar código
│   ├── verify_reset_code_usecase.py      # Step 2: Verificar código
│   └── reset_password_usecase.py         # Step 3: Cambiar password
│
├── infrastructure/
│   ├── rate_limiting/
│   │   └── redis_client.py               # Conexión a Redis
│   ├── email/
│   │   └── email_service.py              # Envío de emails
│   └── repositories/
│       └── user_repository.py            # Acceso a BD
│
└── presentation/api/
    └── auth_routes.py                    # Endpoints HTTP
```

---

### OTPService - Implementación Completa

```python
# backend/src/use_cases/auth/otp_service.py

import random
import json
from typing import Tuple, Optional
from src.infrastructure.rate_limiting.redis_client import redis_client


class OTPService:
    """
    Servicio de OTP con almacenamiento en Redis.
    
    Reglas de negocio:
    - Código de 6 dígitos
    - Expira en 10 minutos
    - Máximo 3 intentos incorrectos
    - Un solo uso (se elimina tras verificación exitosa)
    """
    
    PREFIX = "otp:"
    TTL = 600  # 10 minutos en segundos
    MAX_ATTEMPTS = 3

    @staticmethod
    def generate_code() -> str:
        """
        Genera un código OTP de 6 dígitos.
        
        Returns:
            str: Código de 6 dígitos (ej: "123456")
        """
        return str(random.randint(100000, 999999))

    @staticmethod
    def save_code(email: str, code: str) -> None:
        """
        Guarda un código OTP en Redis.
        
        Si ya existe un código para este email, se REEMPLAZA.
        Esto invalida automáticamente cualquier código anterior.
        
        Args:
            email: Email del usuario (se normaliza a minúsculas)
            code: Código OTP de 6 dígitos
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        data = json.dumps({
            "code": code,
            "attempts": 0
        })
        redis_client.setex(key, OTPService.TTL, data)

    @staticmethod
    def verify_code(email: str, code: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Verifica un código OTP.
        
        Flujo:
        1. Si no existe o expiró → CODE_EXPIRED
        2. Si ya se agotaron los intentos → CODE_EXPIRED
        3. Si el código no coincide → INVALID_CODE + incrementa intentos
        4. Si el código coincide → SUCCESS + elimina OTP
        
        Args:
            email: Email del usuario
            code: Código ingresado por el usuario
            
        Returns:
            Tuple[bool, Optional[str], Optional[str]]:
            - (True, None, None) si es válido
            - (False, message, error_code) si hay error
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        raw = redis_client.get(key)

        # Código no existe o expiró
        if not raw:
            return False, "El código ha expirado o no existe", "CODE_EXPIRED"

        data = json.loads(raw)

        # Ya se agotaron los intentos
        if data["attempts"] >= OTPService.MAX_ATTEMPTS:
            redis_client.delete(key)
            return False, "Código invalidado por demasiados intentos", "CODE_EXPIRED"

        # Código incorrecto
        if data["code"] != code:
            data["attempts"] += 1
            remaining_attempts = OTPService.MAX_ATTEMPTS - data["attempts"]
            
            # ¿Es el último intento fallido?
            if data["attempts"] >= OTPService.MAX_ATTEMPTS:
                redis_client.delete(key)
                print(f"[SECURITY] OTP invalidado por intentos: email={email}")
                return False, "Código invalidado por demasiados intentos", "CODE_EXPIRED"
            
            # Actualizar contador manteniendo el TTL restante
            ttl = redis_client.ttl(key)
            if ttl > 0:
                redis_client.setex(key, ttl, json.dumps(data))
            
            return False, f"Código incorrecto. Intentos restantes: {remaining_attempts}", "INVALID_CODE"

        # Código correcto - eliminar y retornar éxito
        redis_client.delete(key)
        return True, None, None

    @staticmethod
    def invalidate_code(email: str) -> bool:
        """
        Invalida manualmente un código OTP.
        
        Útil cuando:
        - El usuario cambia la contraseña por otro medio
        - Se quiere forzar la regeneración de código
        
        Args:
            email: Email del usuario
            
        Returns:
            bool: True si había un código que invalidar
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        return redis_client.delete(key) > 0

    @staticmethod
    def get_remaining_attempts(email: str) -> Optional[int]:
        """
        Obtiene los intentos restantes para un código.
        
        Args:
            email: Email del usuario
            
        Returns:
            int: Intentos restantes (0-3)
            None: Si no existe código
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        raw = redis_client.get(key)
        
        if not raw:
            return None
            
        data = json.loads(raw)
        return OTPService.MAX_ATTEMPTS - data["attempts"]

    @staticmethod
    def code_exists(email: str) -> bool:
        """
        Verifica si existe un código OTP para el email.
        
        Args:
            email: Email del usuario
            
        Returns:
            bool: True si existe un código activo
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        return redis_client.exists(key) == 1
```

---

## Seguridad

### 1. No Revelar Existencia de Email (Prevenir Enumeración)

**Vulnerabilidad:**
```python
# ❌ MAL - Permite enumerar emails válidos
if not user_exists(email):
    return {"code": "EMAIL_NOT_FOUND"}, 404  # Atacante sabe que el email no existe
else:
    send_otp(email)
    return {"code": "EMAIL_SENT"}, 200
```

**Solución:**
```python
# ✅ BIEN - Siempre responde igual
if not user_exists(email):
    # NO enviar email, pero responder igual
    return {"code": "EMAIL_SENT", "message": "Si el email existe..."}, 200
else:
    send_otp(email)
    return {"code": "EMAIL_SENT", "message": "Si el email existe..."}, 200
```

**Resultado:** El atacante NO puede distinguir si un email existe o no.

---

### 2. Rate Limiting Agresivo en OTP

```python
# OTP endpoints usan rate limit más restrictivo
@rate_limit_otp  # 5 requests/min (vs 10/min en login)
def request_reset_code():
    ...
```

**¿Por qué?**
- Prevenir spam de emails (costo + molestia al usuario)
- Ataques de phishing (enviar códigos falsos a víctimas)
- Enumeración de emails (aunque ya no revela existencia, sigue siendo abuso)

---

### 3. Máximo 3 Intentos de Verificación

```python
# Después de 3 intentos incorrectos, el código se ELIMINA
if data["attempts"] >= MAX_ATTEMPTS:
    redis_client.delete(key)
    return False, "Código invalidado", "CODE_EXPIRED"
```

**¿Por qué?**
- Prevenir ataques de fuerza bruta (1,000,000 códigos posibles / 3 intentos = 333,333 códigos a probar)
- Forzar al atacante a pedir nuevos códigos (triggerea rate limiting)

**Cálculo:**
```
Códigos posibles: 100000 - 999999 = 1,000,000
Intentos por código: 3
Rate limit: 5 requests/min para pedir nuevo código

Tiempo para probar todos los códigos:
  (1,000,000 / 3) códigos a pedir
  / 5 requests/min
  = 66,666 minutos
  = 1,111 horas
  = 46 días sin parar

Y eso asumiendo que el código no expira (expira en 10min).
Impracticable.
```

---

### 4. Expiración de 10 Minutos (TTL)

```python
# Redis elimina automáticamente el código tras 10 minutos
redis_client.setex(key, 600, data)  # TTL: 600 segundos
```

**¿Por qué 10 minutos?**
- Suficiente para que un usuario legítimo revise su email y copie el código
- Corto para limitar ventana de ataque
- Balancea UX (no muy corto) vs Seguridad (no muy largo)

**Trade-off:**
- ⏰ **5 minutos**: Más seguro, pero usuarios lentos se quedan sin código
- ⏰ **10 minutos**: Balanceado (elegido)
- ⏰ **15 minutos**: Mejor UX, pero ventana de ataque más grande

---

### 5. Token Temporal para Reset (No Password en URL)

**Vulnerabilidad:**
```http
# ❌ MAL - Password en URL (logs, historial, proxies)
GET /reset-password?token=123456&newPassword=Secret123
```

**Solución:**
```python
# ✅ BIEN - Token en cookie HttpOnly, password en POST body
@jwt_required()  # Lee token de cookie
def reset_password():
    new_password = request.get_json().get("newPassword")  # POST body
    ...
```

**Beneficios:**
- Token en cookie HttpOnly (no accesible por JavaScript)
- Password en POST body (no queda en logs de proxy/servidor)
- Token expira en 15 minutos (ventana corta)

---

### 6. Códigos Aleatorios Criptográficamente Seguros

**Implementación actual:**
```python
# backend/src/use_cases/auth/otp_service.py
import random

def generate_code() -> str:
    return str(random.randint(100000, 999999))
```

**⚠️ MEJORA FUTURA:**
```python
# Usar secrets (módulo criptográfico de Python)
import secrets

def generate_code() -> str:
    # secrets.randbelow(900000) genera 0-899999
    # + 100000 lo convierte a rango 100000-999999
    return str(secrets.randbelow(900000) + 100000)
```

**Diferencia:**
- `random`: Pseudoaleatorio (predecible si conocés el seed)
- `secrets`: Aleatorio criptográfico (impredecible)

**Impacto:** Bajo en la práctica (3 intentos + 10min TTL + rate limiting ya son suficientes), pero `secrets` es best practice.

---

## Casos de Uso

### Caso 1: Usuario Legítimo Olvidó su Contraseña

**Escenario:**
```
Usuario: dr.garcia@metro.cdmx.gob.mx
Acción: Solicita recuperación, recibe email, ingresa código
```

**Flujo:**
```
1. POST /request-reset-code
   └─ Email: dr.garcia@metro.cdmx.gob.mx
   └─ Redis: otp:dr.garcia@... = {"code": "456789", "attempts": 0}
   └─ Email enviado con código 456789

2. Usuario revisa email, copia código

3. POST /verify-reset-code
   └─ Email: dr.garcia@metro.cdmx.gob.mx
   └─ Código: 456789
   └─ Redis: Código validado, ELIMINADO
   └─ Cookie: reset_token=<JWT_temporal>

4. POST /reset-password
   └─ Cookie: reset_token (validado)
   └─ Body: {"newPassword": "NuevaPassword123!"}
   └─ BD: Password actualizada
   └─ Cookie: reset_token eliminada

✅ Resultado: Password cambiada exitosamente
```

**Tiempo total:** ~2-3 minutos

---

### Caso 2: Usuario Se Equivoca al Escribir el Código

**Escenario:**
```
Usuario: recep01@metro.cdmx.gob.mx
Código real: 123456
Usuario escribe: 123455 (error en último dígito)
```

**Flujo:**
```
1. POST /verify-reset-code → código: "123455"
   └─ Redis: attempts: 0 → 1
   └─ Response: {"code": "INVALID_CODE", "message": "Código incorrecto. Intentos restantes: 2"}

2. POST /verify-reset-code → código: "123456" (correcto esta vez)
   └─ Redis: Código validado, ELIMINADO
   └─ Cookie: reset_token=<JWT_temporal>

✅ Resultado: Verificación exitosa en segundo intento
```

---

### Caso 3: Atacante Intenta Fuerza Bruta

**Escenario:**
```
Atacante: Sabe que el email admin@metro.cdmx.gob.mx existe
Acción: Intenta adivinar el código OTP
```

**Flujo:**
```
1. POST /request-reset-code
   └─ Email: admin@metro.cdmx.gob.mx
   └─ Redis: otp:admin@... = {"code": "789012", "attempts": 0}

2. POST /verify-reset-code → código: "000000"
   └─ Response: "Código incorrecto. Intentos restantes: 2"

3. POST /verify-reset-code → código: "111111"
   └─ Response: "Código incorrecto. Intentos restantes: 1"

4. POST /verify-reset-code → código: "222222"
   └─ Response: "Código invalidado por demasiados intentos"
   └─ Redis: Código ELIMINADO

5. POST /request-reset-code (pedir nuevo código)
   └─ Rate limit: 5 requests/min
   └─ Ya usó 4 requests (1 solicitud + 3 verificaciones)
   └─ 1 request disponible

6. POST /request-reset-code × 2
   └─ Response: 429 TOO_MANY_REQUESTS

❌ Resultado: Bloqueado por rate limiting, solo pudo probar 3 códigos
```

**Tiempo para adivinar 1 código:**
```
Probabilidad de adivinar: 3 / 1,000,000 = 0.0003%
Tiempo mínimo: 10 minutos (expiración del código)
Tiempo con rate limiting: 12 minutos (esperar 60s para pedir nuevo código)

Para probar 1,000,000 códigos:
  (1,000,000 / 3) intentos
  × 12 minutos
  = 4,000,000 minutos
  = 66,666 horas
  = 7.6 AÑOS sin parar

Impracticable.
```

---

### Caso 4: Usuario Pide Múltiples Códigos

**Escenario:**
```
Usuario: Se confunde y pide 3 códigos seguidos
```

**Flujo:**
```
1. POST /request-reset-code
   └─ Redis: otp:user@... = {"code": "111111", "attempts": 0}
   └─ Email enviado: 111111

2. POST /request-reset-code (sin esperar el email)
   └─ Redis: otp:user@... = {"code": "222222", "attempts": 0}  👈 REEMPLAZA el anterior
   └─ Email enviado: 222222

3. POST /request-reset-code (de nuevo)
   └─ Redis: otp:user@... = {"code": "333333", "attempts": 0}  👈 REEMPLAZA el anterior
   └─ Email enviado: 333333

4. Usuario ingresa código del primer email: 111111
   └─ Response: "Código ha expirado o no existe" (fue reemplazado por 333333)

5. Usuario ingresa código del tercer email: 333333
   └─ ✅ Verificación exitosa
```

**Comportamiento:** Solo el código MÁS RECIENTE es válido. Los anteriores se invalidan automáticamente.

---

## Troubleshooting

### Problema: "Código ha expirado" pero acabo de recibirlo

**Causas posibles:**

1. **Redis caído:**
   ```bash
   # Verificar Redis
   docker exec -it sires-redis redis-cli ping
   # Debe responder: PONG
   ```

2. **Relojes desincronizados:**
   ```bash
   # Verificar hora del servidor
   date
   # Verificar hora del contenedor Redis
   docker exec -it sires-redis date
   ```

3. **Código reemplazado:**
   - Usuario pidió múltiples códigos
   - Solo el último es válido

**Solución:**
```bash
# Ver qué código está actualmente en Redis
docker exec -it sires-redis redis-cli

GET otp:usuario@email.com
# Debería mostrar: {"code": "123456", "attempts": 0}
```

---

### Problema: Email no llega con el código

**Causas posibles:**

1. **Email en spam/correo no deseado**
   - Revisar carpeta de spam

2. **SMTP mal configurado:**
   ```bash
   # Verificar configuración SMTP
   cat backend/.env | grep MAIL

   # Debería tener:
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=tu_email@gmail.com
   MAIL_PASSWORD=tu_app_password
   ```

3. **Logs del backend:**
   ```bash
   docker-compose logs backend | grep OTP
   # Buscar: "[OTP] enviado a usuario@email.com: 123456"
   ```

**Test manual:**
```python
# backend/test_email.py
from src.infrastructure.email.email_service import EmailService

email_service = EmailService()
email_service.send_reset_code("tu_email@gmail.com", "123456")
print("Email enviado")
```

---

### Problema: "Código invalidado" tras 1 solo intento

**Causa:** El código ya tenía 2 intentos fallidos previos.

**Solución:**
```bash
# Ver intentos actuales
docker exec -it sires-redis redis-cli

GET otp:usuario@email.com
# Muestra: {"code": "123456", "attempts": 2}

# Resetear manualmente (dev only)
DEL otp:usuario@email.com
```

**Pedir nuevo código:**
- Frontend → "Reenviar código"
- Backend → Genera nuevo código (resetea attempts a 0)

---

### Problema: Rate limiting impide solicitar código

**Causa:** Demasiadas solicitudes en 1 minuto (límite: 5).

**Solución (dev):**
```bash
# Ver cuántas requests hay registradas
docker exec -it sires-redis redis-cli

ZCARD rate:otp:ip:192.168.1.100
# Muestra: 5

# Eliminar rate limit (solo en dev)
DEL rate:otp:ip:192.168.1.100
```

**Solución (producción):**
- Esperar 60 segundos
- El rate limit se resetea automáticamente

---

## Testing

### Test Manual (cURL)

**1. Solicitar código:**
```bash
curl -X POST http://localhost:5000/api/auth/request-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@metro.cdmx.gob.mx"}'

# Response:
# {
#   "code": "EMAIL_SENT",
#   "message": "Si el email existe, recibirás un código en breve."
# }
```

**2. Verificar en Redis:**
```bash
docker exec -it sires-redis redis-cli

GET otp:test@metro.cdmx.gob.mx
# {"code": "456789", "attempts": 0}

TTL otp:test@metro.cdmx.gob.mx
# 598 (segundos restantes)
```

**3. Verificar código:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@metro.cdmx.gob.mx", "code": "456789"}' \
  -c cookies.txt  # Guardar cookies

# Response:
# {
#   "code": "CODE_VERIFIED",
#   "message": "Código verificado. Puedes cambiar tu contraseña."
# }
```

**4. Resetear password:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \  # Enviar cookies (reset_token)
  -d '{"newPassword": "NuevoPassword123!"}'

# Response:
# {
#   "code": "PASSWORD_RESET",
#   "message": "Contraseña actualizada exitosamente."
# }
```

---

### Test Automatizado (Propuesta)

```python
# backend/tests/test_otp_service.py

import pytest
from src.use_cases.auth.otp_service import OTPService

def test_generate_code():
    code = OTPService.generate_code()
    assert len(code) == 6
    assert code.isdigit()
    assert 100000 <= int(code) <= 999999

def test_save_and_verify_code():
    email = "test@example.com"
    code = "123456"
    
    # Guardar código
    OTPService.save_code(email, code)
    
    # Verificar código correcto
    is_valid, msg, err = OTPService.verify_code(email, code)
    assert is_valid
    assert msg is None
    
    # Código ya fue eliminado
    is_valid, msg, err = OTPService.verify_code(email, code)
    assert not is_valid
    assert err == "CODE_EXPIRED"

def test_max_attempts():
    email = "test2@example.com"
    code = "456789"
    
    OTPService.save_code(email, code)
    
    # 3 intentos incorrectos
    for i in range(3):
        is_valid, msg, err = OTPService.verify_code(email, "000000")
        assert not is_valid
        
        if i < 2:
            assert err == "INVALID_CODE"
        else:
            assert err == "CODE_EXPIRED"  # Código invalidado
    
    # Código correcto ya no funciona (fue eliminado)
    is_valid, msg, err = OTPService.verify_code(email, code)
    assert not is_valid
    assert err == "CODE_EXPIRED"

def test_code_expiration(mocker):
    email = "test3@example.com"
    code = "789012"
    
    # Guardar con TTL de 1 segundo
    OTPService.TTL = 1
    OTPService.save_code(email, code)
    
    # Esperar que expire
    import time
    time.sleep(2)
    
    # Código expirado
    is_valid, msg, err = OTPService.verify_code(email, code)
    assert not is_valid
    assert err == "CODE_EXPIRED"
```

---

## Métricas y Monitoreo

### Métricas Útiles

```python
# backend/src/presentation/api/metrics_routes.py

@metrics_bp.route("/metrics/otp", methods=["GET"])
@jwt_required()  # Solo admins
def otp_metrics():
    # Contar códigos activos
    otp_keys = redis_client.keys("otp:*")
    active_codes = len(otp_keys)
    
    # Analizar intentos
    attempts_stats = {"0": 0, "1": 0, "2": 0}
    for key in otp_keys:
        data = json.loads(redis_client.get(key))
        attempts = str(data["attempts"])
        attempts_stats[attempts] = attempts_stats.get(attempts, 0) + 1
    
    return jsonify({
        "active_codes": active_codes,
        "attempts_distribution": attempts_stats,
        "rate_limit_hits": redis_client.zcard("rate:otp:ip:*")
    }), 200
```

**Respuesta:**
```json
{
  "active_codes": 12,
  "attempts_distribution": {
    "0": 8,   // 8 códigos sin intentos
    "1": 3,   // 3 códigos con 1 intento fallido
    "2": 1    // 1 código con 2 intentos fallidos
  },
  "rate_limit_hits": 5
}
```

---

## Referencias

- **Código fuente:** `backend/src/use_cases/auth/otp_service.py`
- **Rate Limiting:** [`docs/architecture/rate-limiting.md`](./rate-limiting.md)
- **Endpoints:** [`docs/api/auth-endpoints.md`](../api/auth-endpoints.md)
- **Redis Client:** `backend/src/infrastructure/rate_limiting/redis_client.py`
- **OWASP:** [Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

---

## Roadmap

- [x] Migrar OTP de MySQL a Redis (completado)
- [ ] Usar `secrets` en lugar de `random` para generación de códigos
- [ ] Implementar rate limiting por email (además de por IP)
- [ ] Agregar CAPTCHA tras múltiples solicitudes de OTP
- [ ] Permitir recuperación vía SMS (además de email)
- [ ] Dashboard de admin para invalidar códigos manualmente
- [ ] Tests automatizados (pytest)
- [ ] Métricas en Prometheus/Grafana

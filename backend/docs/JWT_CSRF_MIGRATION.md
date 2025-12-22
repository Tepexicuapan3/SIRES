# Migración a Flask-JWT-Extended con CSRF Protection

## 🎯 Objetivo

Migrar completamente de PyJWT manual a Flask-JWT-Extended para aprovechar:
- ✅ Cookies HttpOnly seguras
- ✅ CSRF Protection automática
- ✅ Refresh tokens integrados
- ✅ Token revocation (opcional)
- ✅ Fresh tokens para operaciones sensibles

## 📋 Cambios Realizados

### 1. Reescritura Completa de `jwt_service.py`

**ANTES (PyJWT manual):**
```python
import jwt
from datetime import datetime, timezone

def generate_access_token(user_payload, scope="full_access"):
    payload = {
        "sub": str(user_payload.get("id_usuario")),
        "username": user_payload.get("usuario"),
        "scope": scope,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(seconds=1800)).timestamp())
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token
```

**PROBLEMA**: No genera claims CSRF automáticamente, incompatible con Flask-JWT-Extended cookies.

**AHORA (Flask-JWT-Extended):**
```python
from flask_jwt_extended import create_access_token
from datetime import timedelta

def generate_access_token(user_payload, scope="full_access", expires_seconds=None):
    identity = str(user_payload.get("id_usuario"))
    
    additional_claims = {
        "scope": scope,
        "username": user_payload.get("usuario")
    }
    
    token = create_access_token(
        identity=identity,
        additional_claims=additional_claims,
        expires_delta=timedelta(seconds=expires_seconds or 1800)
    )
    
    return token
```

**BENEFICIOS**:
- ✅ Genera automáticamente claim `csrf` cuando `JWT_COOKIE_CSRF_PROTECT=True`
- ✅ Compatible con `set_access_cookies()` de Flask
- ✅ Claims estándar (`jti`, `nbf`, etc.) agregados automáticamente

### 2. Actualización de `logout_usecase.py`

**ANTES:**
```python
def execute(self, token, ip):
    payload = decode_token(token)
    if not payload:
        return None, "INVALID_TOKEN"
    
    id_usuario = payload.get("id_usuario")
    self.access_repo.registrar_acceso(id_usuario, ip, "FUERA DE SESIÓN")
```

**PROBLEMA**: Requiere pasar el token manualmente y decodificarlo.

**AHORA:**
```python
def execute(self, user_id: int, ip: str):
    # El user_id ya viene del JWT (extraído por el route)
    self.access_repo.registrar_acceso(user_id, ip, "FUERA DE SESIÓN")
    return {"message": "Logout exitoso"}, None
```

**BENEFICIOS**:
- ✅ Simplificación del código
- ✅ El route maneja la autenticación con `@jwt_required()`
- ✅ No necesita importar `decode_token`

### 3. Actualización del Route `/logout`

**AHORA:**
```python
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # Obtener user_id del JWT
    user_identity = get_jwt_identity()
    user_id = int(user_identity)
    
    # Obtener IP del cliente
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    
    # Ejecutar caso de uso
    result, error = logout_usecase.execute(user_id, ip)
    
    # Crear respuesta y eliminar cookies
    response = make_response(jsonify(result), 200)
    unset_jwt_cookies(response)
    
    return response
```

### 4. Configuración CSRF Habilitada

**`src/__init__.py`:**
```python
# CSRF Protection habilitado
app.config["JWT_COOKIE_CSRF_PROTECT"] = True

# El CSRF token se envía en una cookie separada (NO HttpOnly)
app.config["JWT_CSRF_IN_COOKIES"] = True
app.config["JWT_ACCESS_CSRF_COOKIE_NAME"] = "csrf_access_token"
app.config["JWT_REFRESH_CSRF_COOKIE_NAME"] = "csrf_refresh_token"

# El frontend debe leer la cookie y enviarla en este header
app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"
app.config["JWT_REFRESH_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"

# Solo verificar CSRF en métodos que modifican datos
app.config["JWT_CSRF_METHODS"] = ["POST", "PUT", "PATCH", "DELETE"]
```

## 🔐 Cómo Funciona CSRF Protection

### Double-Submit Cookie Pattern

1. **Login exitoso** → Backend genera 4 cookies:
   ```
   access_token (HttpOnly)           ← JS NO puede leer
   csrf_access_token (NO HttpOnly)   ← JS SÍ puede leer
   refresh_token (HttpOnly)          ← JS NO puede leer  
   csrf_refresh_token (NO HttpOnly)  ← JS SÍ puede leer
   ```

2. **Frontend hace request protegido**:
   ```javascript
   // Leer cookie CSRF (solo esta es accesible desde JS)
   const csrfToken = getCookie('csrf_access_token');
   
   // Enviar en header
   fetch('/api/v1/auth/complete-onboarding', {
     method: 'POST',
     credentials: 'include',  // Envía cookies automáticamente
     headers: {
       'Content-Type': 'application/json',
       'X-CSRF-TOKEN': csrfToken  // CSRF token en header
     },
     body: JSON.stringify({...})
   });
   ```

3. **Backend valida**:
   - Lee `access_token` de la cookie (HttpOnly)
   - Decodifica el JWT y extrae claim `csrf`
   - Compara con el valor enviado en header `X-CSRF-TOKEN`
   - Si coinciden → Request válido
   - Si NO coinciden → 401 Unauthorized

### ¿Por qué es seguro?

- **Contra CSRF**: Un atacante NO puede leer `csrf_access_token` desde otro dominio (Same-Origin Policy)
- **Contra XSS**: Si hay XSS, el atacante ya ganó (puede robar CSRF token). Pero HttpOnly previene robo del JWT completo.
- **Defensa en profundidad**: Combina HttpOnly + SameSite + CSRF = Triple capa de seguridad

## 📝 Impacto en el Frontend

### ANTES (sin CSRF):
```javascript
// Simplemente enviar request con cookies
fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

### AHORA (con CSRF):
```javascript
// 1. Función helper para leer cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// 2. Leer CSRF token
const csrfToken = getCookie('csrf_access_token');

// 3. Enviar en header
fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken  // ← REQUERIDO
  }
});
```

### Integración con Axios (recomendado):
```javascript
import axios from 'axios';

// Interceptor global que agrega CSRF automáticamente
axios.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrf_access_token');
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});

// Ahora todos los requests incluyen CSRF automáticamente
axios.post('/api/v1/auth/logout');
```

## 🧪 Testing

### Test Manual con cURL

1. **Login y guardar cookies:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"usuario": "test", "clave": "password"}' \
     -c cookies.txt
   ```

2. **Extraer CSRF token:**
   ```bash
   CSRF_TOKEN=$(grep csrf_access_token cookies.txt | awk '{print $NF}')
   echo "CSRF Token: $CSRF_TOKEN"
   ```

3. **Request protegido CON CSRF:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/logout \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
     -b cookies.txt
   ```

4. **Request protegido SIN CSRF (debe fallar):**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/logout \
     -H "Content-Type: application/json" \
     -b cookies.txt
   
   # Respuesta esperada:
   # {"code": "UNAUTHORIZED", "message": "Sesión no encontrada..."}
   ```

## 📊 Resultados de Pruebas

### ✅ Prueba 1: Login
```
Request: POST /api/v1/auth/login
Response: 200 OK
Cookies generadas:
  - access_token (HttpOnly)
  - csrf_access_token
  - refresh_token (HttpOnly)
  - csrf_refresh_token
```

### ✅ Prueba 2: Onboarding sin CSRF
```
Request: POST /api/v1/auth/complete-onboarding (sin header X-CSRF-TOKEN)
Response: 401 Unauthorized
{"code": "UNAUTHORIZED", "message": "Sesión no encontrada..."}
```

### ✅ Prueba 3: Onboarding con CSRF
```
Request: POST /api/v1/auth/complete-onboarding (con header X-CSRF-TOKEN)
Response: 200 OK
Auditoría registrada: "TÉRMINOS ACEPTADOS"
Estado actualizado: terminos_acept='T', cambiar_clave='F'
```

### ✅ Prueba 4: Logout con CSRF
```
Request: POST /api/v1/auth/logout (con header X-CSRF-TOKEN)
Response: 200 OK
Auditoría registrada: "FUERA DE SESIÓN"
Cookies eliminadas correctamente
```

## 🚀 Ventajas de la Migración

1. **Seguridad mejorada**:
   - CSRF Protection automática
   - Tokens HttpOnly (inmunes a XSS)
   - SameSite cookies (protección adicional CSRF)

2. **Menos código boilerplate**:
   - No necesitas `decode_token` manual
   - Flask-JWT-Extended maneja validación
   - Claims estándar generados automáticamente

3. **Features adicionales disponibles**:
   - Token revocation (blacklist)
   - Fresh tokens para operaciones sensibles
   - Token refresh automático
   - Custom claims validations

4. **Mantenibilidad**:
   - Código más limpio y estándar
   - Menos bugs potenciales
   - Mejor integración con ecosistema Flask

## ⚠️ Notas de Producción

1. **HTTPS Obligatorio**: En producción, configurar `JWT_COOKIE_SECURE=True`
   ```python
   app.config["JWT_COOKIE_SECURE"] = True  # Solo HTTPS
   ```

2. **Dominio correcto en CORS**: Especificar origen exacto del frontend
   ```python
   CORS_ORIGINS = "https://app.example.com"  # NO usar "*"
   ```

3. **Monitoring de CSRF failures**: Agregar logging para detectar ataques
   ```python
   @jwt.unauthorized_loader
   def unauthorized_callback(error_string):
       logger.warning(f"CSRF failure: {error_string}")
       return jsonify({"error": "Unauthorized"}), 401
   ```

## 📚 Referencias

- [Flask-JWT-Extended Documentation](https://flask-jwt-extended.readthedocs.io/)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)

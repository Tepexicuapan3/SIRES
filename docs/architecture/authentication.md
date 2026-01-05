# Autenticación - JWT + CSRF

Sistema de autenticación basado en cookies HttpOnly con protección CSRF.

> **TL;DR:** Tokens en cookies HttpOnly (XSS no puede robarlos) + header CSRF en mutaciones (protección double-submit). Access token expira en 15 min, refresh automático con interceptor.

> **Ver también:** [Contratos de API Auth](../api/auth-endpoints.md) - Referencia detallada de endpoints, tipos TypeScript y códigos de error.

---

## Arquitectura de Seguridad

### Estrategia: Cookies HttpOnly + CSRF Token

**Problema que resuelve:** XSS no puede robar tokens si están en cookies HttpOnly.

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /auth/login { usuario, clave }
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ Valida credenciales
       │ Genera JWT access + refresh
       ▼
Set-Cookie: access_token_cookie (HttpOnly, Secure, SameSite=Lax)
Set-Cookie: refresh_token_cookie (HttpOnly, Secure, SameSite=Lax)
Set-Cookie: csrf_access_token (Secure, SameSite=Lax)  ← Leíble por JS
       │
       ▼
┌─────────────┐
│  Frontend   │  Lee csrf_access_token
└──────┬──────┘
       │ POST /api/algo
       │ Headers: { X-CSRF-TOKEN: <csrf_token> }
       │ Cookies: { access_token_cookie: <jwt> }  ← Auto por navegador
       ▼
┌─────────────┐
│   Backend   │  Valida JWT + CSRF header
└─────────────┘
```

**Trade-offs:**
- ✅ **XSS no puede leer tokens** (HttpOnly)
- ✅ **CSRF mitigado** (double-submit cookie pattern)
- ⚠️ **Logout requiere endpoint** (no basta borrar localStorage)

---

## Configuración Backend

### Variables de Entorno

```env
# backend/.env
SECRET_KEY=<openssl rand -hex 32>
JWT_SECRET_KEY=<openssl rand -hex 32>
JWT_ACCESS_TOKEN_EXPIRES=900        # 15 minutos
JWT_REFRESH_TOKEN_EXPIRES=604800    # 7 días
```

### Flask Config

```python
# backend/src/__init__.py
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = True  # Solo HTTPS en producción
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=900)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

jwt = JWTManager(app)
```

**Flags importantes:**
- `JWT_COOKIE_SECURE=True` → Solo envía cookies por HTTPS
- `JWT_COOKIE_SAMESITE=Lax` → Protección contra CSRF básico
- `JWT_COOKIE_CSRF_PROTECT=True` → Requiere header `X-CSRF-TOKEN`

---

## Flujo de Login

### 1. Usuario envía credenciales

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "usuario": "jperez",
  "clave": "Test123!"
}
```

### 2. Backend valida

```python
# backend/src/use_cases/auth/login_usecase.py
class LoginUseCase:
    def execute(self, usuario: str, clave: str, client_ip: str):
        # Buscar usuario
        user = self.user_repo.find_by_usuario(usuario)
        if not user:
            return None, "INVALID_CREDENTIALS"
        
        # Verificar password
        if not check_password_hash(user["clave"], clave):
            return None, "INVALID_CREDENTIALS"
        
        # Verificar estado
        if user["est_usuario"] != "A":
            return None, "USER_INACTIVE"
        
        # Obtener permisos
        permissions = self.auth_service.get_user_permissions(user["id_usuario"])
        landing_route = self.user_repo.get_primary_role_landing(user["id_usuario"])
        
        return {
            "user": {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "permissions": permissions,
                "landing_route": landing_route,
                "is_admin": "*" in permissions,
            },
        }, None
```

### 3. Backend setea cookies

```python
# backend/src/presentation/api/auth_routes.py
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    clave = data.get("clave")
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    
    result, error = login_usecase.execute(usuario, clave, client_ip)
    
    if error:
        status, msg = ERROR_MAPPING.get(error, (500, "Error"))
        return jsonify({"code": error, "message": msg}), status
    
    # Crear tokens
    access_token = create_access_token(
        identity=result["user"]["id_usuario"],
        additional_claims={
            "username": result["user"]["usuario"],
            "permissions": result["user"]["permissions"],
        }
    )
    refresh_token = create_refresh_token(identity=result["user"]["id_usuario"])
    
    # Setear cookies
    response = make_response(jsonify(result), 200)
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    
    return response
```

**Cookies seteadas:**
```
Set-Cookie: access_token_cookie=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/
Set-Cookie: refresh_token_cookie=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/
Set-Cookie: csrf_access_token=<csrf>; Secure; SameSite=Lax; Path=/
```

### 4. Frontend recibe response

```tsx
// frontend/src/features/auth/hooks/useLogin.ts
const { mutate } = useMutation({
  mutationFn: authAPI.login,
  onSuccess: (data) => {
    // Zustand guarda user (NO guarda tokens)
    setUser(data.user);
    navigate(data.user.landing_route);
    toast.success("Sesión iniciada");
  },
});
```

---

## Flujo de Requests Autenticados

### 1. Frontend hace request

```tsx
// frontend/src/api/client.ts (interceptor)
apiClient.interceptors.request.use((config) => {
  // Leer CSRF de cookie
  const csrfToken = getCookie("csrf_access_token");
  
  // Agregar header en mutaciones
  if (["post", "put", "patch", "delete"].includes(config.method || "")) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }
  
  // withCredentials=true → Envía cookies automáticamente
  config.withCredentials = true;
  
  return config;
});
```

### 2. Backend valida

```python
# backend - decorador @jwt_required()
@expedientes_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_expediente(id):
    # Flask-JWT-Extended valida:
    # 1. Cookie access_token_cookie existe
    # 2. JWT es válido (firma + expiración)
    # 3. Header X-CSRF-TOKEN coincide con claims del JWT
    
    current_user_id = get_jwt_identity()
    return jsonify({"id": id, "user": current_user_id})
```

---

## Refresh Automático (401)

### Problema

Access token expira en 15 minutos → requests fallan con 401.

### Solución

Interceptor detecta 401 y refresca automáticamente:

```tsx
// frontend/src/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es 401 y no es el refresh endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      
      try {
        // Llamar a refresh (usa refresh_token_cookie)
        await axios.post(
          `${env.apiUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // Retry request original
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh falló → logout
        useAuthStore.getState().clearUser();
        window.location.href = "/login";
        throw refreshError;
      }
    }
    
    throw error;
  }
);
```

**Backend refresh:**

```python
# backend/src/presentation/api/auth_routes.py
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)  # Usa refresh_token_cookie
def refresh():
    current_user = get_jwt_identity()
    
    # Generar nuevo access token
    access_token = create_access_token(identity=current_user)
    
    # Setear nueva cookie
    response = make_response(jsonify({"message": "Token refrescado"}), 200)
    set_access_cookies(response, access_token)
    
    return response
```

---

## Logout

### Problema

Cookies HttpOnly no se pueden borrar desde JavaScript.

### Solución

Endpoint que borra cookies del lado del servidor:

```python
# backend/src/presentation/api/auth_routes.py
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    response = make_response(jsonify({"message": "Sesión cerrada"}), 200)
    
    # Borrar cookies
    unset_jwt_cookies(response)
    
    return response
```

**Frontend:**

```tsx
// frontend/src/features/auth/hooks/useLogout.ts
const { mutate: logout } = useMutation({
  mutationFn: authAPI.logout,
  onSuccess: () => {
    clearUser();  // Zustand
    navigate("/login");
    toast.success("Sesión cerrada");
  },
});
```

---

## Onboarding (Primer Login)

### Flag `must_change_password`

Usuario nuevo debe cambiar contraseña temporal:

```python
# backend/src/infrastructure/repositories/det_user_repository.py
def create_det_user(id_usuario: int, ...):
    cursor.execute("""
        INSERT INTO det_usuarios 
        (id_usuario, cambiar_clave, acepto_terminos, ...)
        VALUES (%s, 'T', 'F', ...)
    """, (id_usuario,))
```

**Login retorna flag:**

```json
{
  "user": {
    "id_usuario": 123,
    "usuario": "jperez",
    "must_change_password": true,  // ← Frontend detecta
    "terms_accepted": false
  }
}
```

**Frontend verifica:**

```tsx
// frontend/src/routes/ProtectedRoute.tsx
if (user.must_change_password || !user.terms_accepted) {
  return <Navigate to="/onboarding" />;
}
```

### Wizard de Onboarding

**Paso 1: Términos y Condiciones**

```tsx
// frontend/src/features/auth/components/onboarding/TermsStep.tsx
<Checkbox onChange={(e) => setTermsAccepted(e.target.checked)} />
<Button onClick={handleNext} disabled={!termsAccepted}>
  Continuar
</Button>
```

**Paso 2: Nueva Contraseña**

```tsx
// frontend/src/features/auth/components/onboarding/PasswordStep.tsx
const schema = z.object({
  newPassword: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener mayúscula")
    .regex(/[0-9]/, "Debe tener número"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const { mutate } = useMutation({
  mutationFn: authAPI.completeOnboarding,
  onSuccess: () => {
    setUser({ ...user, must_change_password: false });
    navigate(user.landing_route);
  },
});
```

**Backend completa onboarding:**

```python
# backend/src/use_cases/auth/complete_onboarding_usecase.py
def execute(self, user_id: int, new_password: str, terms_accepted: bool):
    # Hashear nueva password
    hashed = generate_password_hash(new_password)
    
    # Actualizar usuario
    self.user_repo.update_password(user_id, hashed)
    
    # Actualizar det_usuarios
    self.det_user_repo.update(user_id, {
        "cambiar_clave": "F",
        "acepto_terminos": "T" if terms_accepted else "F",
    })
    
    return {"message": "Onboarding completado"}, None
```

---

## Recovery (Recuperar Contraseña)

### Flujo de 3 pasos

#### Paso 1: Solicitar OTP

**Endpoint:** `POST /api/v1/auth/request-password-reset`

**Request:**
```json
{
  "identifier": "jperez"  // Usuario o expediente
}
```

**Backend:**

```python
# backend/src/use_cases/auth/request_password_reset_usecase.py
def execute(self, identifier: str):
    # Buscar usuario
    user = self.user_repo.find_by_usuario_or_expediente(identifier)
    if not user:
        return None, "USER_NOT_FOUND"
    
    # Generar OTP (6 dígitos)
    otp = self.otp_service.generate_otp()
    
    # Guardar en Redis (TTL 10min)
    self.otp_service.store_otp(user["id_usuario"], otp, ttl=600)
    
    # Enviar por email
    self.email_service.send_otp(user["correo"], otp)
    
    return {"message": "OTP enviado al correo registrado"}, None
```

#### Paso 2: Verificar OTP

**Endpoint:** `POST /api/v1/auth/verify-otp`

**Request:**
```json
{
  "identifier": "jperez",
  "otp": "123456"
}
```

**Backend:**

```python
def execute(self, identifier: str, otp: str):
    user = self.user_repo.find_by_usuario_or_expediente(identifier)
    
    # Validar OTP
    if not self.otp_service.verify_otp(user["id_usuario"], otp):
        return None, "INVALID_OTP"
    
    # Generar token de reseteo (JWT de 15min)
    reset_token = create_access_token(
        identity=user["id_usuario"],
        expires_delta=timedelta(minutes=15),
        additional_claims={"type": "password_reset"}
    )
    
    return {"reset_token": reset_token}, None
```

#### Paso 3: Resetear Contraseña

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request:**
```json
{
  "reset_token": "<jwt>",
  "new_password": "NewPass123!"
}
```

**Backend:**

```python
@auth_bp.route("/reset-password", methods=["POST"])
@jwt_required()
def reset_password():
    claims = get_jwt()
    
    # Validar que sea token de reset
    if claims.get("type") != "password_reset":
        return jsonify({"code": "INVALID_TOKEN"}), 403
    
    user_id = get_jwt_identity()
    new_password = request.json.get("new_password")
    
    # Hashear y actualizar
    hashed = generate_password_hash(new_password)
    user_repo.update_password(user_id, hashed)
    
    # Invalidar token (agregar a blacklist)
    jti = claims["jti"]
    jwt_blacklist.add(jti)
    
    return jsonify({"message": "Contraseña actualizada"}), 200
```

---

## Seguridad: Mejores Prácticas

### ✅ Lo que ya tenemos

- JWT en cookies HttpOnly (XSS no puede leer)
- CSRF token en header (mitigación double-submit)
- Refresh automático transparente
- Passwords hasheadas con `werkzeug.security`
- OTP con TTL en Redis
- Queries parametrizadas (SQL injection prevention)

### ⚠️ Deuda técnica / mejoras

1. **Rate limiting:** No implementado (ver `backend/docs/RATE_LIMITING.md`)
2. **JWT blacklist:** Logout no invalida token (sigue válido hasta expiración)
3. **Brute force:** No hay límite de intentos de login
4. **2FA:** Solo OTP por email (no TOTP/SMS)

---

## Troubleshooting

### Error: "Missing CSRF token"

**Causa:** Frontend no envía header `X-CSRF-TOKEN`.

**Solución:**

Verificar interceptor en `apiClient`:

```tsx
const csrfToken = getCookie("csrf_access_token");
config.headers["X-CSRF-TOKEN"] = csrfToken;
```

### Error: "Token has expired"

**Causa:** Access token venció y refresh falló.

**Solución:**

1. Verificar que refresh endpoint esté funcionando
2. Revisar logs del interceptor
3. Si refresh token también expiró (7 días), hacer logout

### CORS en login

**Causa:** Backend no permite origin del frontend.

**Solución:**

```env
# backend/.env
CORS_ORIGINS=http://localhost:5173
```

Y en `backend/src/__init__.py`:

```python
CORS(app, origins=os.getenv("CORS_ORIGINS").split(","), supports_credentials=True)
```

---

## Próximos Pasos

1. **Rate limiting:** Ver `docs/guides/rate-limiting.md`
2. **RBAC:** Ver `docs/architecture/rbac.md`
3. **Testing auth:** Ver `docs/guides/testing.md`

---

**Última actualización:** Enero 2026

# ADR 001: JWT en Cookies HttpOnly

**Status:** Aceptado  
**Fecha:** Diciembre 2025  
**Contexto:** Sistema de autenticación SIRES

---

## Contexto y Problema

Necesitábamos un sistema de autenticación seguro para SIRES que proteja contra:
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Token theft

**Opciones consideradas:**
1. JWT en `localStorage`
2. JWT en `sessionStorage`
3. JWT en cookies HttpOnly

---

## Decisión

Usar **JWT en cookies HttpOnly** con **CSRF protection** (double-submit cookie pattern).

---

## Arquitectura

### Backend (Flask)

```python
# backend/src/__init__.py
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = True  # Solo HTTPS en prod
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"
```

**Cookies seteadas en login:**
- `access_token_cookie` (HttpOnly, Secure, SameSite=Lax, 15min)
- `refresh_token_cookie` (HttpOnly, Secure, SameSite=Lax, 7 días)
- `csrf_access_token` (Secure, SameSite=Lax, 15min) ← Leíble por JS

### Frontend (React)

```tsx
// frontend/src/api/client.ts
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrf_access_token");
  
  // Solo en mutaciones (POST/PUT/PATCH/DELETE)
  if (["post", "put", "patch", "delete"].includes(config.method || "")) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }
  
  // withCredentials → envía cookies automáticamente
  config.withCredentials = true;
  return config;
});
```

---

## Consecuencias

### Positivas

✅ **XSS no puede robar tokens** (HttpOnly impide acceso desde JS)  
✅ **CSRF mitigado** (header `X-CSRF-TOKEN` requerido + cookie read-only)  
✅ **Logout real** (backend puede invalidar tokens borrando cookies)  
✅ **Refresh transparente** (interceptor maneja 401 automáticamente)

### Negativas

⚠️ **Logout requiere endpoint** (no basta borrar localStorage)  
⚠️ **CORS más complejo** (`withCredentials` + `Access-Control-Allow-Credentials`)  
⚠️ **No funciona cross-domain** (cookies limitadas a same-site)

### Neutrales

- Testing más complejo (mocks deben simular cookies)
- DevTools no muestran tokens (están en cookies HttpOnly)

---

## Alternativas Consideradas

### 1. JWT en localStorage

**Pros:**
- Simple de implementar
- Cross-domain funciona fácil

**Contras:**
- ❌ **Vulnerable a XSS** (cualquier script puede leer `localStorage`)
- ❌ No hay forma de invalidar tokens server-side
- ❌ No cumple estándares de seguridad (OWASP)

**Decisión:** Rechazado por vulnerabilidad XSS.

### 2. JWT en sessionStorage

**Pros:**
- Se borra al cerrar tab
- Ligeramente mejor que localStorage

**Contras:**
- ❌ **Igual de vulnerable a XSS** que localStorage
- ❌ UX pobre (logout al cerrar tab)

**Decisión:** Rechazado por mismas razones que localStorage.

---

## Implementación

### Flujo de Login

```
1. POST /auth/login { usuario, clave }
2. Backend valida credenciales
3. Backend genera JWT access (15min) + refresh (7d)
4. Backend setea cookies:
   Set-Cookie: access_token_cookie=<jwt>; HttpOnly; Secure
   Set-Cookie: refresh_token_cookie=<jwt>; HttpOnly; Secure
   Set-Cookie: csrf_access_token=<token>; Secure
5. Frontend recibe user data (NO tokens)
6. Frontend guarda user en Zustand (estado UI)
```

### Flujo de Request Autenticado

```
1. Frontend hace POST /api/algo
2. Interceptor lee csrf_access_token de cookie
3. Agrega header X-CSRF-TOKEN
4. Browser envía cookies automáticamente
5. Backend valida:
   - Cookie access_token_cookie existe
   - JWT válido (firma + expiración)
   - Header X-CSRF-TOKEN coincide con claim del JWT
6. Si todo OK → procesa request
```

### Flujo de Refresh (401)

```
1. Request falla con 401 (access token expirado)
2. Interceptor detecta 401
3. Llama POST /auth/refresh (usa refresh_token_cookie)
4. Backend valida refresh token
5. Backend genera nuevo access token
6. Backend setea nueva cookie access_token_cookie
7. Interceptor reintenta request original
8. Usuario NO ve error
```

---

## Seguridad: Defense in Depth

| Attack | Mitigación |
|--------|------------|
| **XSS** | Cookies HttpOnly (JS no puede leer) |
| **CSRF** | Header `X-CSRF-TOKEN` + SameSite=Lax |
| **Token theft** | Secure flag (solo HTTPS) |
| **Session fixation** | Tokens rotan en refresh |
| **Replay attacks** | Expiración corta (15min access) |

---

## Trade-offs Aceptados

**Complejidad vs Seguridad:**
- Aceptamos mayor complejidad (cookies + CSRF) a cambio de seguridad robusta

**Same-site vs Cross-domain:**
- Aceptamos limitación same-site porque SIRES es monolito (frontend + backend mismo dominio en prod)

**Testing:**
- Aceptamos mocks más complejos a cambio de seguridad real

---

## Validación

### Verificar implementación

```bash
# 1. Login
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"test","clave":"Test123!"}' \
  -c cookies.txt

# Verificar Set-Cookie headers:
# - access_token_cookie; HttpOnly; Secure
# - csrf_access_token (NO HttpOnly)

# 2. Request autenticado
curl -X GET http://localhost:5000/api/v1/expedientes \
  -H "X-CSRF-TOKEN: <leer de cookies.txt>" \
  -b cookies.txt

# 3. Verificar CSRF protection
curl -X POST http://localhost:5000/api/v1/expedientes \
  -b cookies.txt
# Esperado: 401 (falta header X-CSRF-TOKEN)
```

---

## Referencias

- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Flask-JWT-Extended: Cookies](https://flask-jwt-extended.readthedocs.io/en/stable/tokens_in_cookies/)
- [MDN: HttpOnly Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)

---

## Historial

- **2025-12:** Implementación inicial
- **2025-12:** Migración de localStorage a cookies
- **2026-01:** Documentación como ADR

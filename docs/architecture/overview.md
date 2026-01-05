# Arquitectura SIRES

Overview técnico del sistema y sus capas.

---

## Stack Tecnológico

### Backend
- **Framework:** Flask (Python 3.11)
- **Base de datos:** MySQL 8.0
- **Cache:** Redis
- **Auth:** Flask-JWT-Extended (cookies HttpOnly)
- **Patrón:** Clean Architecture (capas)

### Frontend
- **Runtime:** Bun
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Routing:** React Router v6
- **Server State:** TanStack Query
- **UI State:** Zustand
- **Forms:** React Hook Form + Zod
- **Styling:** TailwindCSS 4 + shadcn/ui
- **Design System:** Metro CDMX

---

## Arquitectura Backend

### Capas (Clean-ish Architecture)

```
HTTP Request
    ↓
┌─────────────────────────────────────┐
│ presentation/api (Flask Blueprints) │  ← Routing + HTTP mapping
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ use_cases (Application Layer)       │  ← Business logic
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ infrastructure (DB, Email, Security)│  ← Adapters
└─────────────────────────────────────┘
    ↓
MySQL / Redis / SMTP
```

### Responsabilidades por Capa

#### `presentation/api` (Flask Blueprints)
**Qué hace:**
- Parsing de request (JSON, query params)
- Validación básica (campos required)
- Auth (`@jwt_required()`)
- Mapeo `error_code → HTTP status`
- Seteo de cookies (access/refresh tokens)

**Qué NO hace:**
- Lógica de negocio
- Acceso directo a DB
- Cálculos o transformaciones complejas

**Ejemplo:**

```python
# backend/src/presentation/api/auth_routes.py
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    clave = data.get("clave")
    
    # Llamar al use case
    result, error = login_usecase.execute(usuario, clave, ip)
    
    # Mapear error → HTTP
    if error:
        status, msg = ERROR_MAPPING.get(error, (500, "Error"))
        return jsonify({"code": error, "message": msg}), status
    
    # Setear cookies
    response = make_response(jsonify(result), 200)
    set_access_cookies(response, result["access_token"])
    set_refresh_cookies(response, result["refresh_token"])
    return response
```

#### `use_cases` (Application Layer)
**Qué hace:**
- Orquestación de flujos de negocio
- Reglas de validación complejas
- Retorna `(result, error_code)`

**Qué NO hace:**
- No conoce Flask (no import de `request`, `jsonify`, etc.)
- No conoce HTTP status codes
- No accede directamente a DB (usa repos)

**Ejemplo:**

```python
# backend/src/use_cases/auth/login_usecase.py
class LoginUseCase:
    def execute(self, usuario: str, clave: str, client_ip: str):
        # 1. Buscar usuario
        user = self.user_repo.find_by_usuario(usuario)
        if not user:
            return None, "INVALID_CREDENTIALS"
        
        # 2. Verificar contraseña
        if not check_password_hash(user["clave"], clave):
            return None, "INVALID_CREDENTIALS"
        
        # 3. Verificar estado
        if user["est_usuario"] != "A":
            return None, "USER_INACTIVE"
        
        # 4. Generar tokens
        access_token = create_access_token(identity=user["id_usuario"])
        refresh_token = create_refresh_token(identity=user["id_usuario"])
        
        # 5. Registrar auditoría
        self.audit_repo.log_login(user["id_usuario"], client_ip)
        
        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }, None
```

#### `infrastructure` (Adapters)
**Qué hace:**
- Conexiones a DB
- Queries SQL (parametrizadas)
- Hashing de contraseñas
- Envío de emails
- Generación de OTP

**Qué NO hace:**
- Lógica de negocio
- Decisiones sobre reglas (eso es del use case)

**Ejemplo:**

```python
# backend/src/infrastructure/repositories/user_repository.py
class UserRepository:
    def find_by_usuario(self, usuario: str):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM sy_usuarios WHERE usuario = %s LIMIT 1",
            (usuario,)
        )
        result = cursor.fetchone()
        close_db(conn, cursor)
        return result
```

### Estructura de Carpetas Backend

```
backend/src/
├── presentation/api/
│   ├── auth_routes.py          # /auth/login, /auth/logout, etc.
│   ├── permissions_routes.py   # /permissions/*
│   └── ...
├── use_cases/
│   ├── auth/
│   │   ├── login_usecase.py
│   │   ├── logout_usecase.py
│   │   ├── complete_onboarding_usecase.py
│   │   └── request_password_reset_usecase.py
│   └── ...
├── infrastructure/
│   ├── repositories/
│   │   ├── user_repository.py
│   │   ├── permission_repository.py
│   │   └── ...
│   ├── security/
│   │   ├── password_service.py
│   │   └── jwt_service.py
│   ├── email/
│   │   └── email_service.py
│   └── database/
│       └── mysql_connection.py
└── domain/dto/
    └── ...
```

---

## Arquitectura Frontend

### Capas Funcionales

```
User Interaction
    ↓
┌─────────────────────────────────────┐
│ Components (UI)                     │  ← React components
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Hooks (feature hooks)               │  ← Business logic UI
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ TanStack Query + Zustand            │  ← State management
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ api/resources (Adapters)            │  ← HTTP client
└─────────────────────────────────────┘
    ↓
Backend API
```

### Responsabilidades

#### `features/<feature>/components` (UI)
**Qué hace:**
- Renderizar UI
- Consumir hooks
- Mostrar estados (loading, error)

**Qué NO hace:**
- Fetch directo con axios
- Lógica de negocio compleja
- Manipulación de tokens

**Ejemplo:**

```tsx
// frontend/src/features/auth/components/LoginForm.tsx
export default function LoginForm() {
  const { mutate, isPending } = useLogin();
  
  const onSubmit = (data: LoginRequest) => {
    mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField {...register("usuario")} />
      <Button disabled={isPending}>Ingresar</Button>
    </form>
  );
}
```

#### `features/<feature>/hooks` (Business Logic UI)
**Qué hace:**
- Orquestación de TanStack Query
- Manejo de errores
- Updates de Zustand
- Navegación post-success

**Ejemplo:**

```tsx
// frontend/src/features/auth/hooks/useLogin.ts
export const useLogin = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      setUser(data.user);
      navigate(data.user.landing_route);
      toast.success("Sesión iniciada");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
```

#### `api/resources` (Adapters)
**Qué hace:**
- Definir endpoints
- Tipar requests/responses
- Usar `apiClient` (con interceptors)

**Ejemplo:**

```tsx
// frontend/src/api/resources/auth.api.ts
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", data);
    return res.data;
  },
};
```

#### `store` (Estado Global UI)
**Qué hace:**
- Estado de auth (user, isAuthenticated)
- Estado de UI (theme, sidebar)

**Qué NO hace:**
- Server state (eso es TanStack Query)
- Guardar tokens (van en cookies HttpOnly)

**Ejemplo:**

```tsx
// frontend/src/store/authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" }
  )
);
```

### Estructura de Carpetas Frontend

```
frontend/src/
├── api/
│   ├── client.ts              # Axios instance + interceptors
│   ├── resources/
│   │   ├── auth.api.ts
│   │   └── ...
│   └── types/
│       ├── auth.types.ts
│       └── ...
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── OnboardingWizard.tsx
│   │   └── hooks/
│   │       ├── useLogin.ts
│   │       └── usePermissions.ts
│   └── dashboard/
│       └── components/
│           └── DashboardPage.tsx
├── components/
│   ├── layouts/               # Header, Sidebar
│   ├── shared/                # LoadingSpinner, PermissionGate
│   └── ui/                    # shadcn primitivos (Button, Input)
├── store/
│   ├── authStore.ts
│   └── themeStore.ts
├── routes/
│   ├── Routes.tsx
│   └── ProtectedRoute.tsx
└── providers/
    └── AppProviders.tsx       # QueryClient, Theme, Toaster
```

---

## Flujo Completo: Login

### 1. Usuario envía credenciales

```tsx
// frontend/src/features/auth/components/LoginForm.tsx
const { mutate } = useLogin();
mutate({ usuario: "testrbac", clave: "Test123!" });
```

### 2. Hook orquesta mutation

```tsx
// frontend/src/features/auth/hooks/useLogin.ts
mutationFn: authAPI.login,
```

### 3. API resource hace POST

```tsx
// frontend/src/api/resources/auth.api.ts
apiClient.post("/auth/login", data);  // Con CSRF header
```

### 4. Backend recibe request

```python
# backend/src/presentation/api/auth_routes.py
@auth_bp.route("/login", methods=["POST"])
def login():
    result, error = login_usecase.execute(...)
```

### 5. Use case ejecuta lógica

```python
# backend/src/use_cases/auth/login_usecase.py
user = self.user_repo.find_by_usuario(usuario)
if not check_password_hash(user["clave"], clave):
    return None, "INVALID_CREDENTIALS"
```

### 6. Backend setea cookies

```python
# backend/src/presentation/api/auth_routes.py
set_access_cookies(response, access_token)
set_refresh_cookies(response, refresh_token)
```

### 7. Frontend recibe respuesta

```tsx
// frontend/src/features/auth/hooks/useLogin.ts
onSuccess: (data) => {
  setUser(data.user);
  navigate(data.user.landing_route);
}
```

---

## Seguridad (Arquitectura)

### Auth: JWT en Cookies HttpOnly

**Backend:**
- Tokens en cookies `HttpOnly` (JavaScript no puede leerlas)
- CSRF token en cookie NO HttpOnly (frontend lo lee y manda en header)

**Frontend:**
- Lee CSRF de cookie `csrf_access_token`
- Lo envía en header `X-CSRF-TOKEN` en mutaciones
- NO guarda tokens en ningún lado (ya están en cookies)

**Diagrama:**

```
POST /auth/login
    ↓
Backend valida credenciales
    ↓
Set-Cookie: access_token_cookie (HttpOnly, Secure, SameSite=Lax)
Set-Cookie: refresh_token_cookie (HttpOnly, Secure, SameSite=Lax)
Set-Cookie: csrf_access_token (Secure, SameSite=Lax)  ← Leíble por JS
    ↓
Frontend lee csrf_access_token
    ↓
POST /api/algo
Headers: { X-CSRF-TOKEN: <csrf_token> }
Cookies: { access_token_cookie: <jwt> }  ← Automático por navegador
```

### Refresh Automático (401)

Interceptor en `apiClient`:

```tsx
// frontend/src/api/client.ts
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  await axios.post(`${env.apiUrl}/auth/refresh`, {}, { withCredentials: true });
  return apiClient(originalRequest);  // Retry original request
}
```

---

## Próximos Pasos

1. **RBAC:** Ver `docs/architecture/rbac.md`
2. **Autenticación detallada:** Ver `docs/architecture/authentication.md`
3. **Agregar feature:** Ver `docs/guides/adding-feature.md`

---

**Última actualización:** Enero 2026

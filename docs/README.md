# Documentación SIRES

Guías técnicas para desarrollo del Sistema de Información de Registros Electrónicos de Salud (Metro CDMX).

---

## 🚀 Quick Start (< 10 minutos)

### Primera vez en el proyecto

1. **Setup:** [`docs/getting-started/setup.md`](./getting-started/setup.md)
   - Docker + MySQL en 5 minutos
   - Variables de entorno
   - Health checks

2. **Arquitectura:** [`docs/architecture/overview.md`](./architecture/overview.md)
   - Stack completo (Django + React)
   - Capas backend (Clean-ish Architecture)
   - Flujo end-to-end

3. **Tu primera feature:** [`docs/guides/adding-feature.md`](./guides/adding-feature.md)
   - Checklist backend + frontend
   - Ejemplos copy/paste
   - Testing manual

---

## 📚 Navegación por Tema

### ¿Necesitás...?

| Tarea | Doc | Tiempo |
|-------|-----|--------|
| **Levantar el proyecto** | [Setup](./getting-started/setup.md) | 5 min |
| **Entender la arquitectura** | [Overview](./architecture/overview.md) | 15 min |
| **Configurar permisos** | [RBAC 2.0](./architecture/rbac.md) | 20 min |
| **Implementar login/auth** | [Autenticación](./architecture/authentication.md) | 20 min |
| **Configurar rate limiting** | [Rate Limiting](./architecture/rate-limiting.md) | 25 min |
| **Implementar OTP/Recovery** | [OTP con Redis](./architecture/otp-redis.md) | 20 min |
| **Agregar una feature nueva** | [Adding Feature](./guides/adding-feature.md) | 30 min |
| **Auth queries/mutations** | [Auth Queries](./guides/auth-queries-mutations.md) | 15 min |
| **Implementar CRUD RBAC completo** | [RBAC CRUD Implementation](./guides/rbac-crud-implementation.md) | Plan detallado |
| **Usar sistema RBAC CRUD** | [RBAC CRUD User Guide](./guides/rbac-crud-user-guide.md) | Guía completa |
| **Arquitectura Frontend RBAC** | [RBAC Frontend Architecture](./architecture/rbac-frontend.md) | 30 min |
| **Crear componentes UI** | [UI Components](./guides/ui-components.md) | 15 min |
| **Testear código** | [Testing](./guides/testing.md) | 20 min |
| **Implementar RBAC frontend** | [RBAC Frontend](./guides/rbac-frontend.md) | 25 min |
| **Contratos API** | [API Docs](./api/README.md) | Referencia |

---

## 📁 Estructura de la Documentación

```
docs/
├── getting-started/
│   └── setup.md                    # Docker + env vars + troubleshooting
│
├── architecture/
│   ├── overview.md                 # Capas, stack, flujo general
│   ├── rbac.md                     # Roles, permisos, guards
│   ├── rbac-frontend.md            # 🆕 Arquitectura frontend RBAC CRUD
│   ├── authentication.md           # JWT, cookies, CSRF, refresh
│   ├── rate-limiting.md            # Rate limiting 3 niveles + Redis
│   └── otp-redis.md                # Sistema OTP para password recovery
│
├── guides/
│   ├── adding-feature.md           # Checklist backend → frontend
│   ├── auth-queries-mutations.md   # Guia de auth con TanStack Query
│   ├── rbac-crud-implementation.md # 🆕 Plan implementación RBAC CRUD completo
│   ├── rbac-crud-user-guide.md     # 🆕 Guía de uso sistema RBAC CRUD
│   ├── ui-components.md            # shadcn + Metro CDMX
│   ├── rbac-frontend.md            # Ejemplos RBAC en componentes
│   └── testing.md                  # Mocks + estrategias
│
├── adr/                            # Architecture Decision Records
│   ├── 001-jwt-cookies-httponly.md # JWT en cookies HttpOnly (no localStorage)
│   ├── 002-wizard-onboarding.md    # Wizard 2 pasos (terms → password)
│   └── 003-rbac-2-migration.md     # 🆕 Migración a RBAC 2.0 (permisos granulares)
│
├── api/
│   ├── standards.md                # Contrato global de API
│   ├── README.md                   # Indice de API
│   └── modules/
│       ├── auth.md                 # Contratos auth
│       └── rbac.md                 # Contratos RBAC
│
└── templates/                      # Templates para crear docs nuevos
    ├── guide-template.md           # Template guías
    ├── adr-template.md             # Template ADRs
    └── README.md                   # Cómo usar templates
```

---

## 🎯 Por Rol

### Eres Backend Developer

1. [Setup](./getting-started/setup.md) → Levantar MySQL + backend
2. [Architecture](./architecture/overview.md) → Entender capas (use_cases / repos / routes)
3. [Adding Feature](./guides/adding-feature.md) → Crear endpoint con RBAC
4. [RBAC](./architecture/rbac.md) → Decoradores `@requires_permission()`

**Stack que vas a usar:**
- Django + DRF + MySQL + Redis
- Clean Architecture (use cases / infrastructure / presentation)
- JWT en cookies HttpOnly + CSRF header

### Eres Frontend Developer

1. [Setup](./getting-started/setup.md) → Levantar frontend
2. [Architecture](./architecture/overview.md) → Entender flujo (TanStack Query + Zustand)
3. [UI Components](./guides/ui-components.md) → shadcn + tokens Metro
4. [Adding Feature](./guides/adding-feature.md) → Crear página con hooks

**Stack que vas a usar:**
- React 19 + TypeScript + Vite
- TanStack Query (server state) + Zustand (UI state)
- Zod + React Hook Form (forms)
- shadcn/ui + Tailwind 4

### Eres Full-Stack

Seguí el orden:
1. Setup → Architecture → Adding Feature → RBAC → UI Components

Bonus: Leé [Authentication](./architecture/authentication.md) para entender el flujo completo de cookies + CSRF.

---

## 🔥 Conceptos Clave (TL;DR)

### Backend

**Clean-ish Architecture:**
```
HTTP Request → Blueprint → UseCase → Repository → MySQL
```

- **Blueprint:** Mapea HTTP (status codes, cookies)
- **UseCase:** Lógica de negocio, retorna `(result, error_code)`
- **Repository:** Solo queries SQL (parametrizadas)

**Seguridad:**
- JWT en cookies **HttpOnly** (XSS no puede leer)
- CSRF token en header `X-CSRF-TOKEN`
- RBAC 2.0 con decoradores (`@requires_permission()`)

### Frontend

**Capas:**
```
UI Component → Hook (TanStack Query) → API Resource → Backend
```

- **Component:** Solo renderiza, consume hooks
- **Hook:** Orquesta queries/mutations, maneja errors
- **API Resource:** Adapta axios, tipa requests/responses
- **Zustand:** Estado UI/auth (NO guarda tokens)

**Seguridad:**
- Tokens en cookies (auto-enviadas por navegador)
- Interceptor lee CSRF de cookie y lo manda en header
- Refresh automático en 401

---

## 🛠️ Stack Técnico Completo

### Backend
| Tech | Uso |
|------|-----|
| Flask | Framework web |
| MySQL 8 | Base de datos |
| Redis | Cache (permisos, OTP) |
| Flask-JWT-Extended | Auth con cookies |
| werkzeug | Hashing de contraseñas |

### Frontend
| Tech | Uso |
|------|-----|
| Bun | Runtime + package manager |
| React 19 | UI framework |
| TypeScript | Tipado estático |
| Vite | Build tool |
| React Router 7 | Routing |
| TanStack Query | Server state |
| Zustand | UI state |
| React Hook Form | Forms |
| Zod | Validación |
| shadcn/ui | Componentes primitivos |
| Tailwind 4 | CSS utility-first |
| sonner | Toasts |
| lucide-react | Iconos |

### DevOps
| Tech | Uso |
|------|-----|
| Docker Compose | Orquestación local |
| Nginx (prod) | Reverse proxy |
| GitHub Actions (futuro) | CI/CD |

---

## 📖 Convenciones del Proyecto

### Nomenclatura

**Backend (Python):**
- Archivos: `snake_case.py`
- Clases: `PascalCase` (ej: `LoginUseCase`)
- Métodos/vars: `snake_case`

**Frontend (TypeScript):**
- Componentes: `PascalCase.tsx` (ej: `LoginForm.tsx`)
- Hooks: `useXxx.ts`
- Types: `PascalCase`

### Commits (Conventional Commits)

```
feat(frontend): add expedientes list page
fix(backend): resolve CSRF token validation
refactor(frontend): extract form validation to hook
docs(backend): update RBAC architecture
chore: update dependencies
```

**Scopes:**
- `frontend`, `backend`, `docs`, `docker`, `config`

### Permisos (formato)

```
{grupo}{modulo}{submodulo}:{action}
```

Ejemplos:
- `medico:gestion:expedientes:create`
- `admin:gestion:usuarios:delete`
- `medico:consultas:read`
- `*` (admin wildcard)

### Tokens Metro CDMX

**✅ Usar:**
- `bg-brand`, `text-brand`, `bg-brand-hover`
- `status-critical`, `status-alert`, `status-stable`, `status-info`
- `txt-body`, `txt-muted`, `txt-hint`, `txt-inverse`
- `bg-paper`, `bg-paper-lift`, `bg-subtle`

**❌ NO usar:**
- `bg-orange-500`, `text-gray-600` (colores directos Tailwind)
- `#fe5000` inline (hex hardcodeado)

---

## ⚡ Comandos Útiles

### Docker

```bash
# Levantar todo
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reconstruir
docker-compose up -d --build

# Bajar
docker-compose down
```

### Backend

```bash
# Acceder al contenedor
docker-compose exec backend sh

# Ejecutar script
python run.py

# Instalar dependencia
pip install <paquete>
```

### Frontend

```bash
# Desarrollo local
cd frontend
bun dev

# Lint
bun lint

# Build
bun build

# Instalar shadcn component
npx shadcn@latest add button
```

---

## 🔍 Troubleshooting Rápido

### Backend no conecta a MySQL

```bash
# Verificar que MySQL esté corriendo
mysql -u root -p -h localhost -P 3306

# En backend/.env
MYSQL_HOST=host.docker.internal  # Docker → MySQL local
```

### CORS en navegador

```env
# backend/.env
CORS_ORIGINS=http://localhost:5173
```

### Error 403 aunque tenga permiso

```bash
# Invalidar cache de permisos (admin only)
curl -X POST "http://localhost:5000/api/v1/permissions/cache/invalidate" \
  -H "Cookie: access_token_cookie=<token>"
```

### Frontend pantalla blanca

```bash
# Ver logs
docker-compose logs frontend

# Revisar consola del navegador (F12)
```

---

## 📞 Soporte

### Si algo no está claro

1. **Buscar en docs:** Usá la tabla de navegación arriba
2. **Revisar ejemplos:** Cada guía tiene código copy/paste
3. **Leer código existente:** Ver features implementadas
4. **Preguntar al agente:** Usan prompts educativos (no solo generan código)

### Si encontrás un bug en la documentación

1. Crear issue en GitHub
2. O hacer PR con la corrección

---

## 🗺️ Roadmap de Documentación

### ✅ Completado (Enero 2026)

- Setup inicial
- Architecture overview
- RBAC 2.0 (arquitectura + frontend + ADR)
- **RBAC CRUD completo (backend + frontend + docs)**
  - Plan de implementación (7 fases)
  - Guía de uso para administradores
  - Arquitectura frontend detallada
- Authentication (JWT + CSRF + contratos API)
- Rate limiting (3 niveles + Redis)
- OTP system (password recovery con Redis)
- Adding feature guide
- UI components guide (shadcn + Metro CDMX)
- Testing guide con mocks RBAC 2.0

### 🚧 En Progreso

- Testing suite (completar vitest + pytest)

### 📋 Pendiente

- Deployment guide (producción)
- Performance optimization
- Monitoring y logs
- ADR-004: Decisión de usar Redis para rate limiting

---

**Última actualización:** Enero 2026  
**Versión:** 1.0.0  
**Proyecto:** SIRES - Metro CDMX

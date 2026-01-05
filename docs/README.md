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
   - Stack completo (Flask + React)
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
| **Agregar una feature nueva** | [Adding Feature](./guides/adding-feature.md) | 30 min |
| **Implementar CRUD RBAC completo** | [RBAC CRUD Implementation](./guides/rbac-crud-implementation.md) | Plan detallado |
| **Crear componentes UI** | [UI Components](./guides/ui-components.md) | 15 min |
| **Testear código** | [Testing](./guides/testing.md) | 20 min |

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
│   └── authentication.md           # JWT, cookies, CSRF, refresh
│
├── guides/
│   ├── adding-feature.md           # Checklist backend → frontend
│   ├── ui-components.md            # shadcn + Metro CDMX
│   └── testing.md                  # Mocks + estrategias
│
├── adr/                            # Architecture Decision Records
│   ├── 001-jwt-cookies-httponly.md # JWT en cookies HttpOnly (no localStorage)
│   └── 002-wizard-onboarding.md    # Wizard 2 pasos (terms → password)
│
├── api/
│   └── endpoints.md                # Referencia de API
│
└── templates/                      # Templates para crear docs nuevos
    ├── guide-template.md           # Template guías
    ├── adr-template.md             # Template ADRs
    └── README.md                   # Cómo usar templates
```

---

## 🎯 Por Rol

### Sos Backend Developer

1. [Setup](./getting-started/setup.md) → Levantar MySQL + backend
2. [Architecture](./architecture/overview.md) → Entender capas (use_cases / repos / routes)
3. [Adding Feature](./guides/adding-feature.md) → Crear endpoint con RBAC
4. [RBAC](./architecture/rbac.md) → Decoradores `@requires_permission()`

**Stack que vas a usar:**
- Flask + MySQL + Redis
- Clean Architecture (use cases / infrastructure / presentation)
- Flask-JWT-Extended (cookies HttpOnly)

### Sos Frontend Developer

1. [Setup](./getting-started/setup.md) → Levantar frontend
2. [Architecture](./architecture/overview.md) → Entender flujo (TanStack Query + Zustand)
3. [UI Components](./guides/ui-components.md) → shadcn + tokens Metro
4. [Adding Feature](./guides/adding-feature.md) → Crear página con hooks

**Stack que vas a usar:**
- React 19 + TypeScript + Vite
- TanStack Query (server state) + Zustand (UI state)
- Zod + React Hook Form (forms)
- shadcn/ui + Tailwind 4

### Sos Full-Stack

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
| React Router v6 | Routing |
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
{resource}:{action}
```

Ejemplos:
- `expedientes:create`
- `usuarios:delete`
- `consultas:read`
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

## 🎓 Filosofía del Proyecto

> **No somos un generador de código. Somos mentores que programan.**

Este proyecto está configurado para **enseñar mientras construyes**:

1. **Preguntamos antes de asumir** (clarificamos requerimientos)
2. **Explicamos el "por qué"** (no solo el "cómo")
3. **Conectamos con principios** (SOLID, Clean Architecture)
4. **Revisamos con rigor** (seguridad, performance, maintainability)

### Agentes Disponibles

Ver [`AGENTS.md`](../AGENTS.md) para la lista completa.

| Agente | Rol | Cuándo Usar |
|--------|-----|-------------|
| `build` | Developer + Mentor | Implementar features (explica antes de codear) |
| `plan` | Arquitecto | Diseñar antes de implementar |
| `code-reviewer` | Reviewer | Revisar código (aprenderás de los errores) |
| `security-auditor` | Security Expert | Auditar seguridad (aprenderás a pensar como atacante) |
| `ui-designer` | UI/UX Engineer | Crear/refactorizar componentes shadcn |

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

## 📋 Próximos Pasos Recomendados

### Si sos nuevo

1. ✅ Leer [Setup](./getting-started/setup.md)
2. ✅ Leer [Architecture Overview](./architecture/overview.md)
3. ✅ Seguir tutorial [Adding Feature](./guides/adding-feature.md)
4. ✅ Explorar código en `frontend/src/features/auth/`

### Si ya conocés el proyecto

1. Ver [RBAC](./architecture/rbac.md) para permisos granulares
2. Ver [UI Components](./guides/ui-components.md) para componentes nuevos
3. Ver [Testing](./guides/testing.md) cuando haya suite configurada

---

## 🗺️ Roadmap de Documentación

### ✅ Completado (Enero 2026)

- Setup inicial
- Architecture overview
- RBAC 2.0
- Authentication (JWT + CSRF)
- Adding feature guide
- UI components guide

### 🚧 En Progreso

- Testing guide (completar suite vitest + pytest)

### 📋 Pendiente

- Rate limiting implementation
- Deployment guide (producción)
- Performance optimization
- Monitoring y logs

---

## 📝 Contribuir a la Documentación

### Crear documentación nueva

**Regla de oro:** Solo crear docs que alguien va a **usar** y que no se pueden inferir del código.

**Usar comando `/doc`:**

```bash
# Crear nueva guía
opencode run --command doc "create nombre-guia"

# Crear nuevo ADR (Architecture Decision Record)
opencode run --command doc "adr titulo-decision"

# Actualizar documentación existente
opencode run --command doc "update docs/guides/testing.md"

# Auditar docs (encontrar obsoletos/redundantes)
opencode run --command doc "audit"
```

**Templates disponibles:**
- [`docs/templates/guide-template.md`](./templates/guide-template.md) - Para guías paso a paso
- [`docs/templates/adr-template.md`](./templates/adr-template.md) - Para decisiones arquitectónicas
- [`docs/templates/README.md`](./templates/README.md) - Cómo usar templates

**Reglas:**
- ✅ Máximo 500 líneas por archivo (split si crece)
- ✅ Solo información esencial (no fluff)
- ✅ Ejemplos copy/paste funcionales
- ✅ Linkear desde este README
- ❌ NO duplicar contenido existente
- ❌ NO documentar código autoexplicativo
- ❌ NO crear docs para debugging temporales

Ver más detalles en [`AGENTS.md - Documentación`](../AGENTS.md#-estrategia-de-documentación-crítico-para-agentes)

---

**Última actualización:** Enero 2026  
**Versión:** 1.0.0  
**Proyecto:** SIRES - Metro CDMX

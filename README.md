# SIRES

Sistema de Información de Registros Electrónicos de Salud - Metro CDMX

---

## 🚀 Quick Start

### Levantar el proyecto (5 minutos)

```bash
# 1. Clonar repo
git clone https://github.com/Luis-Ant/SIRES.git
cd SIRES

# 2. Configurar variables de entorno
cp backend/.env.development backend/.env
cp frontend/.env.development frontend/.env

# 3. Levantar servicios (Docker Compose)
docker-compose up -d

# 4. Verificar
curl http://localhost:5000/health  # Backend → {"status": "ok"}
# Abrir http://localhost:5173/login en navegador
```

**Requisitos:**
- Docker v20.10+
- MySQL 8+ (local o remoto)

**¿Problemas?** Ver [Troubleshooting](./docs/getting-started/setup.md#troubleshooting)

---

## 📚 Documentación Completa

👉 **[docs/README.md](./docs/README.md)** - Índice completo con guías por rol y tema

### Guías Rápidas

| Necesito... | Doc | Tiempo |
|-------------|-----|--------|
| Levantar el proyecto | [Setup](./docs/getting-started/setup.md) | 5 min |
| Entender la arquitectura | [Overview](./docs/architecture/overview.md) | 15 min |
| Agregar una feature | [Adding Feature](./docs/guides/adding-feature.md) | 30 min |
| Configurar permisos | [RBAC 2.0](./docs/architecture/rbac.md) | 20 min |
| Crear componentes UI | [UI Components](./docs/guides/ui-components.md) | 15 min |

---

## 🛠️ Stack Técnico

### Backend
- **Framework:** Flask (Python 3.11)
- **Base de datos:** MySQL 8 + Redis
- **Auth:** JWT en cookies HttpOnly + CSRF
- **Patrón:** Clean Architecture (use_cases / repositories / routes)

### Frontend
- **Runtime:** Bun
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **State:** TanStack Query + Zustand
- **UI:** shadcn/ui + TailwindCSS 4
- **Design:** Sistema Metro CDMX (naranja #fe5000)

---

## 📦 Servicios

Cuando ejecutás `docker-compose up -d`:

| Servicio | Puerto | URL |
|----------|--------|-----|
| **Backend** (Flask) | 5000 | http://localhost:5000 |
| **Frontend** (Vite) | 5173 | http://localhost:5173 |
| **Redis** | 6379 | localhost:6379 |

**MySQL** corre fuera de Docker (local o remoto). Ver configuración en `backend/.env`.

---

## 🔐 Seguridad

- ✅ **JWT en cookies HttpOnly** (XSS no puede leer tokens)
- ✅ **CSRF protection** (double-submit cookie pattern)
- ✅ **RBAC 2.0** (permisos granulares por recurso:acción)
- ✅ **Passwords hasheadas** (werkzeug.security)
- ✅ **Queries parametrizadas** (SQL injection prevention)

**Detalles:** Ver [docs/architecture/authentication.md](./docs/architecture/authentication.md)

---

## 📁 Estructura del Proyecto

```
SIRES/
├── backend/                    # API Flask
│   ├── src/
│   │   ├── presentation/api/   # Blueprints (routes)
│   │   ├── use_cases/          # Lógica de negocio
│   │   ├── infrastructure/     # DB, email, security
│   │   └── domain/dto/         # Data Transfer Objects
│   ├── .env.development        # Variables backend (dev)
│   └── requirements.txt
│
├── frontend/                   # App React
│   ├── src/
│   │   ├── api/                # HTTP client + types
│   │   ├── features/           # Módulos por dominio
│   │   ├── components/         # UI compartidos
│   │   ├── store/              # Zustand stores
│   │   └── routes/             # React Router + guards
│   ├── .env.development        # Variables frontend (dev)
│   └── package.json
│
├── docs/                       # Documentación técnica
│   ├── getting-started/
│   ├── architecture/
│   ├── guides/
│   └── README.md               # Índice completo
│
├── docker-compose.yml          # Orquestación servicios
├── AGENTS.md                   # Guía de agentes IA
└── PROJECT_GUIDE.md            # Referencia técnica detallada
```

---

## 🎯 Comandos Útiles

### Docker

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reconstruir imágenes
docker-compose up -d --build

# Detener servicios
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
# Desarrollo local (sin Docker)
cd frontend
bun install
bun dev

# Lint
bun lint

# Build producción
bun build

# Instalar componente shadcn
npx shadcn@latest add button
```

---

## 🧪 Testing

⚠️ **No hay suite de tests automatizados** (deuda técnica).

Por ahora:
- **Mocks en frontend:** Ver [docs/guides/testing.md](./docs/guides/testing.md)
- **Testing manual:** Usuarios de prueba + endpoints curl
- **Smoke tests:** Health checks + login flow

**Roadmap:** pytest (backend) + Vitest (frontend)

---

## 🤝 Contribución

### Workflow

1. Crear branch: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios siguiendo [docs/guides/adding-feature.md](./docs/guides/adding-feature.md)
3. Commits con [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(frontend): add expedientes list page
   fix(backend): resolve CSRF token validation
   docs: update RBAC architecture
   ```
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Convenciones

**Permisos (formato):**
```
{resource}:{action}
```
Ejemplos: `expedientes:create`, `usuarios:delete`, `*` (admin)

**Tokens Metro CDMX (NO hardcodear colores):**
```css
bg-brand, text-brand          /* Naranja Metro */
status-critical               /* Rojo clínico */
txt-body, txt-muted           /* Texto */
bg-paper, bg-subtle           /* Superficies */
```

---

## 📖 Recursos Adicionales

### Documentación Interna

- **[AGENTS.md](./AGENTS.md)** - Guía de agentes IA (build, plan, ui-designer)
- **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** - Referencia técnica completa
- **[docs/](./docs/)** - Guías organizadas por tema

### Docs Externas

- [Flask](https://flask.palletsprojects.com/)
- [React 19](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

## 📝 Notas Importantes

### Variables de Entorno

El proyecto usa **tres niveles** de `.env`:

1. **`.env`** (raíz) - Puertos de Docker Compose
2. **`backend/.env`** - Config Flask (DB, JWT, CORS)
3. **`frontend/.env`** - Config Vite (solo `VITE_*` son accesibles en browser)

**⚠️ NUNCA** subir archivos `.env` al repo (ya están en `.gitignore`).

### MySQL

Backend se conecta a MySQL **fuera de Docker**:

- **Desarrollo:** `MYSQL_HOST=host.docker.internal`
- **Producción:** IP/hostname del servidor

### CORS

Si el frontend está en otro puerto:

```env
# backend/.env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 👥 Autor

Luis-Ant - [GitHub](https://github.com/Luis-Ant)

---

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.

---

**Última actualización:** Enero 2026  
**Versión:** 1.0.0

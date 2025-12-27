# AGENTS.md - Guía de Desarrollo SIRES

> **Filosofía del proyecto:** Los agentes de IA están configurados para ENSEÑAR, no solo generar código.
> Cada interacción es una oportunidad de aprendizaje. No aceptes código que no entiendas.

---

## 🎓 Filosofía Anti-Vibe-Coding

Este proyecto usa agentes de IA configurados para ayudarte a **pensar como arquitecto/ingeniero**, no como un "code monkey" que solo copia y pega.

### Qué esperar de los agentes:

1. **Te van a hacer preguntas** antes de escribir código
2. **Te van a explicar el "por qué"** de cada decisión
3. **Te van a mostrar alternativas** con trade-offs
4. **Te van a enseñar patrones y principios** que aplican
5. **Responden siempre en español rioplatense** (directo, sin vueltas)

### Tu responsabilidad:

- **No aceptes código que no entiendas** - Preguntá hasta que quede claro
- **Cuestioná las decisiones** - "¿Por qué esto y no aquello?"
- **Pedí que te expliquen** - "¿Qué principio SOLID aplica acá?"
- **Conectá con conceptos** - "¿Esto es como el patrón Repository?"

---

## 🚀 Comandos de Desarrollo

### Frontend (Bun)
```bash
bun dev          # Servidor desarrollo Vite (puerto 5173)
bun build        # Compilar TypeScript + build producción  
bun lint         # Ejecutar ESLint
bun preview      # Previsualizar build de producción
```

### Backend (Python Flask)
```bash
python run.py    # Iniciar servidor Flask (puerto 5000)
pip install -r requirements.txt  # Instalar dependencias
```

### Docker (Recomendado)
```bash
docker-compose up -d        # Iniciar todos los servicios
docker-compose logs -f       # Ver logs en tiempo real
docker-compose down          # Detener servicios
docker-compose exec backend sh # Acceder al contenedor backend
```

---

## 🤖 OpenCode - Comandos Personalizados

El proyecto está configurado con comandos custom en `opencode.json`. Usá estos comandos para tareas comunes:

```bash
# Linting completo (frontend + backend)
opencode run --command lint

# Ejecutar tests
opencode run --command test "auth module"

# Code review siguiendo convenciones
opencode run --command review "frontend/src/features/auth"

# Auditoría de seguridad
opencode run --command security "backend/src/presentation/api/auth_routes.py"

# Scaffolding de nueva feature
opencode run --command feature "expedientes"

# Docker operations
opencode run --command docker "up"
opencode run --command docker "logs"

# Commit con Conventional Commits
opencode run --command commit "add patient search functionality"

# Explicar cómo funciona algo
opencode run --command explain "authentication flow"

# Debuggear y arreglar issues
opencode run --command fix "login fails on expired refresh token"

# Crear/refactorizar componentes UI con shadcn
opencode run --command ui "create button"
opencode run --command ui "refactor frontend/src/components/ui/FormField.tsx"
opencode run --command ui "audit"
opencode run --command ui "install button input label"
```

### Agentes Disponibles (Modo Educativo)

Todos los agentes están configurados para **enseñar mientras trabajan**. Responden en español rioplatense y explican el "por qué" de cada decisión.

| Agente | Rol | Filosofía | Puede editar |
|--------|-----|-----------|--------------|
| `build` | Developer + Mentor | Explica problema → arquitectura → código | ✅ Sí |
| `plan` | Arquitecto + Educador | Clarifica → analiza opciones → diseña | ❌ No |
| `code-reviewer` | Reviewer + Maestro | Encuentra issues → explica por qué → enseña | ❌ No |
| `security-auditor` | Security Expert + Docente | Audita → muestra cómo explotaría → remedia | ❌ No |
| `committer` | Git Expert (Liviano) | Analiza cambios → propone commits → ejecuta | ⚡ Solo git |
| `ui-designer` | UI/UX Engineer + Educador | Crea/refactoriza componentes shadcn + Metro | ✅ Sí |

**Cambiar de agente:** `Tab` o `Shift+Tab` en el TUI.

**Cuándo usar cada uno:**
- `build` → Cuando querés implementar algo (te va a hacer preguntas antes)
- `plan` → Cuando querés pensar/diseñar antes de codear
- `code-reviewer` → Cuando querés que revisen tu código (aprenderás de los errores)
- `security-auditor` → Cuando querés verificar seguridad (aprenderás a pensar como atacante)
- `committer` → Cuando terminaste de trabajar y querés commitear (usa `/commit`)
- `ui-designer` → Cuando necesitás crear/refactorizar componentes UI (usa `/ui`)

### MCP Servers Habilitados

| MCP | Descripción | Variables de entorno |
|-----|-------------|----------------------|
| `context7` | Docs actualizadas de librerías (React, Flask, etc.) | - |
| `gh_grep` | Buscar ejemplos de código en GitHub | - |
| `sequential-thinking` | Razonamiento paso a paso para problemas complejos | - |
| `playwright` | Testing E2E y web scraping | - |
| `21st-magic` | Generación de componentes UI con Tailwind | - |
| `mysql` | Queries directas a la BD SIRES | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` |
| `redis` | Operaciones en cache OTP/sesiones | `REDIS_HOST`, `REDIS_PORT` |

#### Configurar MCPs de Base de Datos

Para que los MCPs de MySQL y Redis funcionen, necesitás configurar las variables de entorno.
Podés hacerlo en tu shell o crear un archivo `.env` en la raíz del proyecto:

```bash
# MySQL (usar los mismos valores que backend/.env)
export MYSQL_HOST=10.15.15.76
export MYSQL_PORT=3306
export MYSQL_USER=sires
export MYSQL_PASSWORD=tu_password
export MYSQL_DATABASE=SIRES

# Redis (default Docker)
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

O si usás Docker, apuntá a los servicios del compose:
```bash
export MYSQL_HOST=host.docker.internal  # Para acceder desde host a contenedor
export REDIS_HOST=localhost             # Redis está expuesto en puerto 6379
```

---

## 📝 Guías de Estilo

### Frontend (TypeScript/React)
- **Componentes**: PascalCase (`AuthPasswordForm.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useAuth.ts`)
- **Tipos**: PascalCase con inferencia Zod (`LoginRequest`)
- **Imports**: External → Local con aliases `@/`, `@api/`, `@features/`
- **Validación**: Zod + React Hook Form para formularios
- **Estado**: Zustand con persistencia, TanStack Query para API calls
- **Path aliases**: Configurados en vite.config.ts y tsconfig.json

### Backend (Python Flask)
- **Arquitectura**: Clean architecture (use_cases/, repositories/, infrastructure/)
- **Nomenclatura**: snake_case archivos, PascalCase clases (`LoginUseCase`)
- **Errores**: Excepciones personalizadas con código y status HTTP
- **API**: Flask blueprints, respuestas JSON consistentes
- **Patrón**: Retorno `(result, error)` en use cases
- **Variables**: `.env` separados por servicio, `VITE_*` para frontend

---

## 🔒 Seguridad (CRÍTICO)

### Reglas de Oro

1. **NUNCA** guardar tokens en localStorage/sessionStorage
2. JWT **SIEMPRE** en cookies HttpOnly
3. **SIEMPRE** incluir header `X-CSRF-TOKEN` en requests mutantes
4. **NUNCA** concatenar strings para queries SQL (usar parameterized queries)
5. **SIEMPRE** usar `@jwt_required()` en endpoints protegidos

### Documentación de Seguridad

- `backend/docs/JWT_CSRF_MIGRATION.md` - Arquitectura de autenticación
- `backend/docs/RATE_LIMITING.md` - Rate limiting (diseño propuesto)
- `backend/docs/AUDIT_ONBOARDING.md` - Auditoría de onboarding

---

## ⚠️ Notas Importantes

- **Tests**: No configurado actualmente en el proyecto
- **Proxy**: Configuración proxy corporativo en Docker
- **Autenticación**: JWT con refresh tokens, validación en múltiples capas
- **BD**: MySQL con Redis para cache de OTP
- **Desarrollo**: Usar siempre Docker Compose para ambiente completo

---

## 📁 Estructura del Proyecto

```
SIRES/
├── backend/
│   ├── src/
│   │   ├── presentation/api/     # Flask Blueprints (HTTP)
│   │   ├── use_cases/            # Business logic
│   │   ├── infrastructure/       # DB, email, security
│   │   └── domain/dto/           # Data Transfer Objects
│   └── docs/                     # Docs internas
│
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios client + resources + types
│   │   ├── features/             # Feature modules
│   │   ├── components/           # Shared UI
│   │   ├── store/                # Zustand stores
│   │   └── routes/               # React Router + guards
│   └── ...
│
├── .opencode/                    # Configuración OpenCode
│   ├── prompts/                  # System prompts por agente
│   ├── agent/                    # Agentes custom (markdown)
│   └── command/                  # Comandos custom (markdown)
│
├── opencode.json                 # Config principal OpenCode
├── AGENTS.md                     # Este archivo
└── PROJECT_GUIDE.md              # Guía técnica detallada
```

---

## 🎨 Desarrollo de UI con shadcn/ui + Metro CDMX

### Filosofía del Sistema de Diseño

El proyecto usa **shadcn/ui como librería de primitivos** (estructura + accesibilidad) adaptados al **sistema de diseño Metro CDMX** (colores + tipografía + identidad).

**Reglas de Oro:**

1. ✅ **Usar tokens semánticos** → `bg-brand`, `txt-body`, `status-critical`
2. ❌ **NO hardcodear colores** → `bg-orange-500`, `text-gray-600`
3. ✅ **Accesibilidad completa** → ARIA, keyboard nav, focus states
4. ✅ **Usar CVA para variantes** → Type-safe variant system
5. ✅ **forwardRef en primitivos** → React Hook Form compatibility

### Tokens de Color Disponibles

```tsx
// Marca Metro CDMX
bg-brand, text-brand, border-brand, bg-brand-hover

// Estados Clínicos
status-critical  // Errores, alertas vitales
status-alert     // Advertencias, pendientes
status-stable    // Éxito, signos estables
status-info      // Información administrativa

// Texto y Legibilidad
txt-body         // Texto principal
txt-muted        // Metadatos, secundario
txt-hint         // Placeholders
txt-inverse      // Texto sobre fondos oscuros

// Superficies
bg-app           // Fondo general
bg-paper         // Tarjetas, expedientes
bg-paper-lift    // Modales, dropdowns
bg-subtle        // Áreas secundarias

// Bordes
line-hairline    // Divisiones sutiles
line-struct      // Bordes de inputs
```

### Comandos Útiles

```bash
# Ver componentes disponibles
npx shadcn@latest add

# Instalar componente base
npx shadcn@latest add button

# Instalar múltiples
npx shadcn@latest add button input label dialog

# Ver diferencias (útil para updates)
npx shadcn@latest diff
```

### Flujo de Trabajo Típico

1. **Instalar componente shadcn:**
   ```bash
   cd frontend
   npx shadcn@latest add button
   ```

2. **Adaptar a tokens Metro:**
   ```tsx
   // ❌ Código generado por shadcn (usa sus colores)
   "bg-primary text-primary-foreground"
   
   // ✅ Adaptado a Metro CDMX
   "bg-brand text-txt-inverse hover:bg-brand-hover"
   ```

3. **Usar el componente:**
   ```tsx
   import { Button } from "@/components/ui/button";
   
   <Button variant="default">Guardar Expediente</Button>
   <Button variant="destructive">Eliminar Registro</Button>
   ```

### Estructura de Componentes

```
frontend/src/components/
  ui/              # Primitivos shadcn (Button, Input, Dialog)
  layouts/         # Layout components (Sidebar, Header)
  shared/          # Reutilizables no-primitivos (LoadingSpinner)
```

**Regla:** Componente genérico → `ui/`. Componente específico → `features/<feature>/components/`.

### Variables CSS Bridge

Ya están configuradas en `frontend/src/styles/theme.css`:

```css
/* shadcn espera */      /* mapea a Metro */
--primary          →     var(--metro-orange-500)
--destructive      →     var(--clinical-critical)
--muted            →     var(--bg-subtle)
--border           →     var(--border-struct)
```

Esto permite que los componentes shadcn funcionen **sin modificación**, pero siempre es mejor personalizar explícitamente.

### Ejemplo Completo: Button Adaptado

```tsx
// frontend/src/components/ui/button.tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:ring-2 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand text-txt-inverse hover:bg-brand-hover",
        destructive: "bg-status-critical text-white hover:bg-status-critical/90",
        outline: "border border-line-struct hover:bg-subtle",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Recursos

- Docs shadcn: https://ui.shadcn.com
- Sistema Metro: `frontend/src/styles/theme.css`
- Prompt del agente: `.opencode/prompts/ui-designer.md`

**Pro tip:** Usá el agente `ui-designer` con `/ui` para automatizar la creación/adaptación de componentes.


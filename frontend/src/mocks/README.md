# 🧪 Mock Users - Sistema RBAC 2.0

Este directorio contiene usuarios mock para testing del sistema de autenticación y autorización (RBAC) de SIRES.

---

## 📋 Credenciales de Testing

### Usuarios Disponibles

| Usuario | Password | Rol | Landing Route | Descripción |
|---------|----------|-----|---------------|-------------|
| `admin` | `Admin123!` | ADMINISTRADOR | `/admin` | Acceso total al sistema |
| `dr.garcia` | `Doc123!` | MEDICOS | `/consultas` | Médico general |
| `dra.lopez` | `Esp123!` | ESPECIALISTAS | `/consultas` | Médico especialista |
| `recep01` | `Recep123!` | RECEPCION | `/recepcion` | Recepcionista |
| `farm01` | `Farm123!` | FARMACIA | `/farmacia` | Farmacéutico |
| `urg01` | `Urg123!` | URGENCIAS | `/urgencias` | Médico de urgencias |
| `coord.hosp` | `Hosp123!` | HOSP-COORDINACION | `/hospital` | Coordinador hospitalario |
| `gerente01` | `Ger123!` | GERENCIA | `/reportes` | Gerente - reportes |
| `jefe.clinica` | `Jefe123!` | JEFATURA CLINICA | `/consultas` | Jefe de clínica |
| `trans01` | `Trans123!` | TRANS-RECETA | `/farmacia` | Transcriptor de recetas |

---

## 🔐 Permisos por Rol

### ADMINISTRADOR
- **Permisos:** `["*"]` (acceso total)
- **Sidebar visible:** Todas las secciones

### MEDICOS
- **Permisos:** 
  - Expedientes: `read`, `update`, `search`, `print`
  - Consultas: `create`, `read`, `update`, `sign`, `export`
  - Recetas: `create`, `read`, `print`
  - Citas: `read`
  - Laboratorio: `create`, `read`, `print`
- **Sidebar visible:** Consultas, Expedientes, Laboratorio

### ESPECIALISTAS
- **Permisos adicionales a MEDICOS:**
  - `consultas:read_others` (leer consultas de otros médicos)
- **Sidebar visible:** Igual que MEDICOS + supervisión

### RECEPCION
- **Permisos:**
  - Expedientes: `create`, `read`, `search`
  - Citas: `create`, `read`, `update`, `delete`, `confirm`, `reschedule`, `export`
- **Sidebar visible:** Recepción, Expedientes

### FARMACIA
- **Permisos:**
  - Recetas: `read`, `print`
  - Medicamentos: `dispense`, `read`, `update_stock`
  - Expedientes: `read`, `search`
- **Sidebar visible:** Farmacia, Expedientes (lectura)

### URGENCIAS
- **Permisos:**
  - Expedientes: `read`, `update`, `search`
  - Urgencias: `create`, `read`, `update`, `triage`
  - Consultas: `create`, `read`, `update`, `sign`
  - Recetas: `create`, `read`
  - Laboratorio: `create`, `read`
- **Sidebar visible:** Urgencias, Consultas, Expedientes

### HOSP-COORDINACION
- **Permisos:**
  - Expedientes: `read`, `search`
  - Hospital: `coordinacion`, `admision`
  - Reportes: `hospital`
- **Sidebar visible:** Hospital, Reportes

### GERENCIA
- **Permisos:**
  - Reportes: `consultas`, `citas`, `farmacia`, `hospital`, `export`
  - Sistema: `audit_logs`
  - Expedientes: `read`, `search`, `export`
  - Consultas: `read`, `export`
  - Usuarios: `read`
- **Sidebar visible:** Reportes, Administración (auditoría)

### JEFATURA CLINICA
- **Permisos:**
  - Todos los de MEDICOS +
  - Expedientes: `export`
  - Consultas: `read_others` (supervisión)
  - Reportes: `consultas`, `citas`, `export`
- **Sidebar visible:** Consultas, Expedientes, Reportes

### TRANS-RECETA
- **Permisos:**
  - Recetas: `transcribe`, `read`, `print`
  - Expedientes: `read`, `search`
- **Sidebar visible:** Farmacia (transcripción)

---

## 🧪 Cómo Usar los Mocks

### 1. Testing Manual en Dev Server

```bash
# Iniciar servidor de desarrollo
cd frontend
bun dev
```

Navegar a `http://localhost:5173/login` y usar cualquier credencial de la tabla.

### 2. Importar en Tests Unitarios

```typescript
import { MOCK_USERS_DB, mockLoginResponse } from "@/mocks/users.mock";

// Simular login exitoso
const loginResponse = mockLoginResponse("admin");
expect(loginResponse?.user.is_admin).toBe(true);

// Obtener usuario específico
const medico = MOCK_USERS_DB["dr.garcia"];
expect(medico.permissions).toContain("consultas:create");
```

### 3. Mock de API (MSW o similar)

```typescript
import { validateMockCredentials, mockLoginResponse } from "@/mocks/users.mock";

// Handler de login
rest.post("/api/v1/auth/login", async (req, res, ctx) => {
  const { usuario, clave } = await req.json();
  
  if (validateMockCredentials(usuario, clave)) {
    const response = mockLoginResponse(usuario);
    return res(ctx.json(response));
  }
  
  return res(ctx.status(401), ctx.json({ code: "INVALID_CREDENTIALS" }));
});
```

---

## 🎯 Escenarios de Testing

### Escenario 1: Admin ve todo el sidebar
```typescript
// Login: admin / Admin123!
// Esperado: Sidebar muestra 7 secciones (todas)
```

### Escenario 2: Médico ve solo secciones clínicas
```typescript
// Login: dr.garcia / Doc123!
// Esperado: Sidebar muestra Consultas, Expedientes, Laboratorio
// NO muestra: Administración, Hospital, Farmacia, Reportes
```

### Escenario 3: Recepcionista sin acceso a consultas
```typescript
// Login: recep01 / Recep123!
// Esperado: Sidebar muestra Recepción, Expedientes
// Al intentar navegar a /consultas → redirect o 403
```

### Escenario 4: Gerente solo reportes
```typescript
// Login: gerente01 / Ger123!
// Esperado: Sidebar muestra Reportes + sección de auditoría
// NO puede crear/editar expedientes (solo lectura)
```

---

## 🔍 Validación de RBAC

### Checklist de Testing

- [ ] **Sidebar filtering:** Cada usuario ve solo las secciones permitidas
- [ ] **Route protection:** Navegar a ruta sin permiso → redirect o error
- [ ] **Permisos atómicos:** Usuario solo puede ejecutar acciones permitidas
- [ ] **Landing route:** Después del login, redirige a la ruta correcta
- [ ] **Wildcard admin:** Admin con `permissions: ["*"]` accede a todo
- [ ] **Multi-rol:** Si un usuario tiene múltiples roles, combina permisos

### Comandos de Verificación

```bash
# Ver estructura de usuario en consola
import { getMockUser } from "@/mocks/users.mock";
console.log(getMockUser("admin"));

# Listar todos los usuarios
import { listAllMockUsers } from "@/mocks/users.mock";
console.table(listAllMockUsers());
```

---

## ⚠️ Notas Importantes

1. **NO usar en producción:** Estos mocks son solo para desarrollo/testing
2. **Passwords hardcodeadas:** Solo para ambiente local
3. **Sincronización con BD:** Los permisos están basados en `backend/migrations/004_rbac_assign_permissions.sql`
4. **Tokens en cookies:** El login real usa HttpOnly cookies, los mocks simulan el objeto `user` en la respuesta

---

## 🔧 Mantenimiento

### Agregar nuevo usuario mock

1. Agregar credencial en `MOCK_CREDENTIALS`
2. Crear entrada en `MOCK_USERS_DB` con estructura `Usuario`
3. Asignar `permissions` según rol (consultar migrations SQL)
4. Actualizar esta documentación

### Sincronizar con backend

Cuando se actualicen permisos en `backend/migrations/`:
1. Revisar cambios en `004_rbac_assign_permissions.sql`
2. Actualizar array `permissions` del usuario mock correspondiente
3. Ejecutar tests de RBAC para verificar

---

## 📚 Referencias

- **Tipos:** `frontend/src/api/types/auth.types.ts`
- **Migraciones:** `backend/migrations/004_rbac_assign_permissions.sql`
- **Nav Config:** `frontend/src/components/layouts/sidebar/nav-config.ts`
- **Protected Route:** `frontend/src/routes/ProtectedRoute.tsx`

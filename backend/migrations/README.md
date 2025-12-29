# RBAC 2.0 - Migraciones de Base de Datos

## Descripción General

Este directorio contiene las migraciones SQL para implementar el sistema RBAC 2.0 en SIRES, que incluye:
- Permisos atómicos (resource:action)
- Sistema de overrides por usuario (ALLOW/DENY)
- Redirección post-login según rol
- Priorización de roles múltiples

## ⚠️ IMPORTANTE: Antes de Ejecutar

### 1. Backup Obligatorio

```bash
# Desde el contenedor de MySQL o servidor
mysqldump -u sires -p SIRES > backup_antes_rbac2_$(date +%Y%m%d_%H%M%S).sql

# O si usas Docker
docker exec mysql_container mysqldump -u sires -p SIRES > backup_antes_rbac2_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar Conexión

```sql
USE SIRES;
SELECT DATABASE();
```

### 3. Requisitos

- MySQL 8.0+
- Privilegios: CREATE TABLE, ALTER TABLE, INSERT, SELECT
- Tiempo estimado de ejecución: 2-5 minutos
- Espacio en disco: ~5MB adicionales

## 📁 Estructura de Archivos

| Archivo | Descripción | Tiempo Estimado |
|---------|-------------|-----------------|
| `001_rbac_foundation.sql` | Crear tablas nuevas (cat_permissions, role_permissions, user_permissions) | ~10 segundos |
| `002_rbac_alter_existing_tables.sql` | Modificar cat_roles y users_roles (agregar campos) | ~15 segundos |
| `003_rbac_seed_permissions.sql` | Insertar permisos base del sistema (~70-80 registros) | ~30 segundos |
| `004_rbac_assign_permissions.sql` | Asignar permisos a roles existentes | ~1 minuto |
| `005_rbac_verification.sql` | Verificar que todo se instaló correctamente | ~20 segundos |
| `ROLLBACK.sql` | Revertir todos los cambios (solo usar en emergencia) | ~30 segundos |

## 🚀 Proceso de Instalación

### Opción A: Ejecución Manual (Recomendada)

```bash
cd backend/migrations

# Paso 1: Tablas nuevas
mysql -u sires -p SIRES < 001_rbac_foundation.sql

# Paso 2: Modificar tablas existentes
mysql -u sires -p SIRES < 002_rbac_alter_existing_tables.sql

# Paso 3: Datos iniciales de permisos
mysql -u sires -p SIRES < 003_rbac_seed_permissions.sql

# Paso 4: Asignar permisos a roles
mysql -u sires -p SIRES < 004_rbac_assign_permissions.sql

# Paso 5: Verificar instalación
mysql -u sires -p SIRES < 005_rbac_verification.sql
```

### Opción B: Ejecución Automática (Script Bash)

```bash
#!/bin/bash
# ejecutar_migraciones.sh

DB_USER="sires"
DB_NAME="SIRES"

echo "Ejecutando migraciones RBAC 2.0..."

for file in 00{1..5}*.sql; do
    echo "Ejecutando $file..."
    mysql -u $DB_USER -p $DB_NAME < $file
    
    if [ $? -eq 0 ]; then
        echo "✅ $file ejecutado exitosamente"
    else
        echo "❌ ERROR en $file - DETENIENDO"
        exit 1
    fi
done

echo "✅ Todas las migraciones completadas"
```

```bash
chmod +x ejecutar_migraciones.sh
./ejecutar_migraciones.sh
```

## ✅ Verificación Post-Instalación

### 1. Verificar que las tablas existan

```sql
SHOW TABLES LIKE '%permission%';
-- Debe retornar: cat_permissions, role_permissions, user_permissions
```

### 2. Verificar campos nuevos en cat_roles

```sql
DESCRIBE cat_roles;
-- Debe incluir: landing_route, priority, is_admin
```

### 3. Verificar permisos insertados

```sql
SELECT COUNT(*) FROM cat_permissions WHERE est_permission = 'A';
-- Debe retornar: ~70-80 permisos
```

### 4. Verificar asignaciones a roles

```sql
SELECT 
    cr.rol,
    COUNT(rp.id_permission) as permisos
FROM cat_roles cr
LEFT JOIN role_permissions rp ON cr.id_rol = rp.id_rol
WHERE cr.est_rol = 'A' AND rp.est_role_perm = 'A'
GROUP BY cr.rol
ORDER BY permisos DESC;
```

### 5. Ejecutar script completo de verificación

```bash
mysql -u sires -p SIRES < 005_rbac_verification.sql > verificacion_resultado.txt
cat verificacion_resultado.txt
```

## 🔄 Rollback (Revertir Cambios)

**⚠️ SOLO USAR EN EMERGENCIA**

Si algo sale mal y necesitas revertir los cambios:

```bash
# ADVERTENCIA: Esto eliminará todas las tablas de permisos y revertirá cambios
mysql -u sires -p SIRES < ROLLBACK.sql
```

**Nota:** El rollback NO puede revertir los datos insertados en las tablas modificadas. Por eso es CRÍTICO hacer backup antes.

## 📊 Cambios en la Base de Datos

### Tablas Nuevas (3)

| Tabla | Registros Esperados | Descripción |
|-------|---------------------|-------------|
| `cat_permissions` | ~70-80 | Catálogo de permisos atómicos |
| `role_permissions` | ~200-300 | Asignación permiso→rol |
| `user_permissions` | 0 inicial | Overrides por usuario |

### Tablas Modificadas (2)

| Tabla | Cambios | Impacto |
|-------|---------|---------|
| `cat_roles` | +3 columnas (`landing_route`, `priority`, `is_admin`) | Bajo - datos poblados automáticamente |
| `users_roles` | +1 columna (`is_primary`) | Bajo - se marca rol principal automáticamente |

### Tablas Sin Cambios (preservadas)

- `sy_usuarios`
- `det_usuarios`
- `cat_menus`
- `cat_submenus`
- `det_roles` (legacy, se mantiene por compatibilidad)
- `det_roles_personalizados` (legacy, se mantiene por compatibilidad)

## 🧪 Testing

### Test 1: Usuario ADMINISTRADOR

```sql
-- Debe retornar is_admin = 1
SELECT rol, is_admin, landing_route FROM cat_roles WHERE rol = 'ADMINISTRADOR';
```

### Test 2: Permisos de MEDICOS

```sql
-- Debe retornar ~20-25 permisos
SELECT COUNT(*) 
FROM role_permissions rp
INNER JOIN cat_roles cr ON rp.id_rol = cr.id_rol
WHERE cr.rol = 'MEDICOS' AND rp.est_role_perm = 'A';
```

### Test 3: Roles Principales

```sql
-- Cada usuario debe tener exactamente 1 is_primary = 1
SELECT 
    u.usuario,
    SUM(CASE WHEN ur.is_primary = 1 THEN 1 ELSE 0 END) as primary_count
FROM sy_usuarios u
INNER JOIN users_roles ur ON u.id_usuario = ur.id_usuario
WHERE u.est_usuario = 'A' AND ur.est_usr_rol = 'A'
GROUP BY u.usuario
HAVING primary_count != 1;

-- Debe retornar 0 filas
```

## 📝 Notas Importantes

### Compatibilidad con Sistema Legacy

- Las tablas `cat_menus`, `cat_submenus`, `det_roles`, `det_roles_personalizados` se mantienen intactas
- El nuevo sistema de permisos NO las reemplaza, sino que las complementa
- Los menús legacy pueden seguir usándose para navegación UI
- Los permisos atómicos se usan para autorización de acciones

### Permisos NO Migrables

El sistema legacy usa permisos a nivel de "menú/submenú" (navegación).
El nuevo sistema usa permisos atómicos "recurso:acción" (autorización).

**NO es posible migración automática 1:1** porque son conceptos diferentes:
- Legacy: "Puede ver el menú Expedientes"
- RBAC 2.0: "Puede crear expedientes" + "Puede eliminar expedientes"

### Estrategia Post-Migración

1. **Código nuevo**: Usar RBAC 2.0 (`cat_permissions`, `role_permissions`, `user_permissions`)
2. **Código legacy**: Puede seguir usando `det_roles` si es necesario
3. **Migración gradual**: Feature por feature, reemplazar checks legacy por checks de permisos atómicos

## 🔐 Seguridad

### Auditoría

Todas las tablas tienen campos de auditoría completos:
- `usr_alta` / `fch_alta` - Quién/cuándo creó
- `usr_modf` / `fch_modf` - Quién/cuándo modificó
- `usr_baja` / `fch_baja` - Quién/cuándo dio de baja

### Integridad Referencial

Todas las tablas tienen Foreign Keys con:
- `ON DELETE RESTRICT` - No permite borrar si hay referencias
- `ON UPDATE CASCADE` - Actualiza en cascada si cambia el ID

### Estados

Todas las tablas usan `est_*` (estado) con valores:
- `'A'` = Activo
- `'I'` = Inactivo (para dar de baja lógica sin eliminar)

## 📚 Documentación Relacionada

- `../SISTEMA_ROLES_PERMISOS.md` - Documentación completa del modelo RBAC
- `../PROJECT_GUIDE.md` - Guía del proyecto (sección RBAC)
- `../backend/src/infrastructure/authorization/` - Código de autorización (Fase 2)

## 🆘 Soporte y Troubleshooting

### Error: "Table already exists"

```sql
-- Verificar si las tablas ya existen
SHOW TABLES LIKE '%permission%';

-- Si existen y quieres recrear (CUIDADO: pierdes datos)
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS cat_permissions;

-- Luego vuelve a ejecutar las migraciones
```

### Error: "Duplicate entry for key"

Probablemente ejecutaste las migraciones más de una vez.

```sql
-- Limpiar datos duplicados
DELETE FROM role_permissions WHERE id_role_perm NOT IN (
    SELECT MIN(id_role_perm) 
    FROM (SELECT * FROM role_permissions) tmp
    GROUP BY id_rol, id_permission
);
```

### Error: "Unknown column 'landing_route'"

El script 002 no se ejecutó correctamente.

```sql
-- Verificar campos de cat_roles
DESCRIBE cat_roles;

-- Si faltan, ejecutar solo el ALTER TABLE del script 002
```

## 🎯 Próximos Pasos (Fase 2)

Después de completar las migraciones:

1. **Backend:**
   - Crear `PermissionRepository` (consultas a BD)
   - Crear `AuthorizationService` (lógica de autorización)
   - Crear decorador `@requires_permission`
   - Modificar `LoginUseCase` para incluir permisos

2. **Frontend:**
   - Actualizar `auth.types.ts` (agregar `permissions`, `landing_route`)
   - Crear hook `usePermissions()`
   - Crear componente `<PermissionGate>`
   - Implementar redirección dinámica post-login

3. **Testing:**
   - Unit tests para `AuthorizationService`
   - Integration tests para endpoints protegidos
   - E2E tests para flujos de autorización

---

**Versión:** 1.0.0  
**Fecha:** 2025-12-29  
**Autor:** SIRES Dev Team

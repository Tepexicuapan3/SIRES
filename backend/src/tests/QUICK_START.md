# Quick Start - Testing Backend

## Inicio Rápido (2 minutos)

### 1. Asegurate de que el servidor esté corriendo

```bash
cd backend
python run.py &
```

### 2. Ejecuta los tests

```bash
cd src/tests

# Todos los tests de usuarios (19 tests)
python run_tests.py users

# Solo tests de READ (5 tests)
python run_tests.py users read

# Solo tests de UPDATE (6 tests)
python run_tests.py users update

# Solo tests de ROLE & STATUS (8 tests)
python run_tests.py users role
```

### 3. Resultado esperado

```
================================================================================
                                 RESUMEN FINAL                                  
================================================================================

[OK] PASS  Users Complete

--------------------------------------------------------------------------------
Total: 1 suite(s)
Pasaron: 1
Fallaron: 0

================================================================================
                         [OK] TODOS LOS TESTS EXITOSOS                          
================================================================================
```

## Estructura de Archivos

```
src/tests/
├── run_tests.py                    # ← EJECUTA ESTO
├── README.md                       # Documentación completa
├── QUICK_START.md                  # Este archivo
│
├── integration/
│   └── users/
│       ├── test_users_read.py         # Phase 1: READ (5 tests)
│       ├── test_users_update.py       # Phase 2: UPDATE (6 tests)
│       ├── test_users_role_status.py  # Phase 3: ROLE & STATUS (8 tests)
│       └── test_users_complete.py     # Suite completa (19 tests)
│
├── fixtures/
│   └── test_helpers.py             # Helpers reutilizables
│
└── unit/
    └── (pendiente)
```

## Comandos Útiles

```bash
# Ver ayuda del runner
python run_tests.py --help

# Ejecutar TODOS los tests disponibles
python run_tests.py all
python run_tests.py  # (sin args = all)

# Ejecutar módulos específicos
python run_tests.py users           # Todos los tests de usuarios
python run_tests.py users read      # Solo operaciones READ
python run_tests.py users update    # Solo operaciones UPDATE
python run_tests.py users role      # Solo cambios de rol y status
```

## Tests Disponibles

### ✅ Users CRUD (19 tests total)

#### Phase 1: READ Operations (5 tests)
- ✓ List users sin filtros (200)
- ✓ List users con filtros y paginación (200)
- ✓ Get user por ID (200)
- ✓ Get user inexistente (404)
- ✓ Validación de paginación inválida (400)

#### Phase 2: UPDATE Operations (6 tests)
- ✓ Update nombre, paterno, materno (200)
- ✓ Update email único (200)
- ✓ Email duplicado (409)
- ✓ Email con formato inválido (422)
- ✓ Request vacío (400)
- ✓ Update user inexistente (404)

#### Phase 3: ROLE & STATUS Operations (8 tests)
- ✓ Cambiar rol de usuario (200)
- ✓ Intentar asignar mismo rol (409)
- ✓ Rol inexistente (404)
- ✓ Request sin id_rol (400)
- ✓ Desactivar usuario (200)
- ✓ Verificar estado inactivo (200)
- ✓ Reactivar usuario (200)
- ✓ Desactivar user inexistente (404)

## Troubleshooting

### Error: "Connection refused"
**Problema:** El servidor Flask no está corriendo.

**Solución:**
```bash
cd backend
python run.py
```

### Error: "Login failed"
**Problema:** Usuario de prueba no existe o credenciales incorrectas.

**Solución:** Verifica que existan los usuarios:
- `testrbac` / `Test123!` (admin, ID: 13)
- `testmedico` / `Test123!` (medico, ID: 14)

### Tests muy lentos (~10s por request)
**Esto es normal** si la BD está en red institucional (`10.15.15.76`). La latencia es esperada en desarrollo.

### Error: "CSRF token not found"
**Problema:** Las cookies no se están seteando correctamente.

**Solución:** Verifica que JWT esté configurado para cookies en `.env`:
```
JWT_TOKEN_LOCATION=cookies
JWT_COOKIE_CSRF_PROTECT=True
```

## Siguiente Paso

Una vez que todos los tests pasen:
1. Revisa `README.md` en esta carpeta para documentación completa
2. Considera agregar tests unitarios en `unit/`
3. Migrar a pytest para mejor integración con CI/CD

## Referencias

- **Documentación CRUD completa:** `backend/USUARIOS_CRUD_IMPLEMENTATION.md`
- **Arquitectura del proyecto:** `PROJECT_GUIDE.md`
- **Convenciones:** `AGENTS.md`

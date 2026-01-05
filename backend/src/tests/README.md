# Tests - SIRES Backend

Esta carpeta contiene todos los tests del backend organizados por tipo.

## Estructura

```
tests/
├── integration/          # Tests de integración (API + BD real)
│   ├── users/           # Tests del módulo de usuarios
│   │   ├── test_users_read.py         # Phase 1: Operaciones READ
│   │   ├── test_users_update.py       # Phase 2: Operaciones UPDATE
│   │   ├── test_users_role_status.py  # Phase 3: Roles y Status
│   │   └── test_users_complete.py     # Suite completa (19 tests)
│   └── auth/            # Tests del módulo de autenticación (TODO)
├── unit/                # Tests unitarios (mocks, sin BD)
│   └── (TODO)
├── fixtures/            # Datos de prueba y helpers compartidos
│   ├── __init__.py
│   └── test_helpers.py
└── README.md            # Este archivo
```

## Tipos de Tests

### Integration Tests
Tests que verifican el comportamiento end-to-end de los endpoints:
- Hacen requests HTTP reales al servidor Flask
- Usan la base de datos real (actualmente `10.15.15.76:3306`)
- Verifican contratos de API (requests/responses)
- Incluyen setup/cleanup de datos de prueba

**Requisitos:**
- Servidor Flask corriendo en `http://localhost:5000`
- Base de datos accesible
- Usuario de prueba `testrbac` (admin, ID: 13)
- Usuario de prueba `testmedico` (doctor, ID: 14)

### Unit Tests
Tests que verifican la lógica de negocio aislada:
- No requieren servidor corriendo
- Usan mocks para dependencias (DB, email, etc.)
- Más rápidos de ejecutar
- **Estado:** Pendiente de implementación

## Ejecutar Tests

### Tests de Integración de Usuarios

```bash
# Asegurate de que el servidor esté corriendo
cd backend
python run.py &

# Ejecutar suite completa (19 tests)
cd src/tests/integration/users
python test_users_complete.py

# Ejecutar por fases
python test_users_read.py           # 5 tests READ
python test_users_update.py         # 6 tests UPDATE
python test_users_role_status.py    # 8 tests ROLE & STATUS
```

### Resultados Esperados

```
================================================================================
RESUMEN FINAL - TODOS LOS TESTS
================================================================================
[OK] PASS  Phase 1
[OK] PASS  Phase 2
[OK] PASS  Phase 3

--------------------------------------------------------------------------------
Fases completadas: 3/3
Fases fallidas: 0/3

================================================================================
TODAS LAS FASES EXITOSAS - 19 TESTS PASARON
================================================================================
```

## Notas Importantes

### Latencia de BD
Los tests pueden ser lentos (~10s por request) debido a que la BD está en red institucional (`10.15.15.76`). Esto es normal en ambiente de desarrollo actual.

### Datos de Prueba
Los tests usan el usuario `testmedico` (ID: 14) para operaciones no destructivas:
- Los datos se modifican temporalmente
- Se restaura el estado original en cleanup
- No afecta otros usuarios en la BD

### Redis Deshabilitado
Actualmente el rate limiting está deshabilitado (comentado) por problemas de conexión a Redis. Los tests funcionan correctamente sin rate limiting.

## Cobertura Actual

### ✅ Completado

**Módulo: Users CRUD**
- **READ Operations** (5 tests)
  - List users sin filtros
  - List users con filtros y paginación
  - Get user por ID
  - Get user inexistente (404)
  - Validación de paginación inválida (400)

- **UPDATE Operations** (6 tests)
  - Update nombre, paterno, materno
  - Update email
  - Email duplicado (409)
  - Email inválido (422)
  - Request vacío (400)
  - Update user inexistente (404)

- **ROLE & STATUS Operations** (8 tests)
  - Cambiar rol de usuario
  - Asignar mismo rol (409)
  - Rol inexistente (404)
  - Request sin id_rol (400)
  - Desactivar usuario
  - Verificar estado inactivo
  - Reactivar usuario
  - Desactivar user inexistente (404)

**Total:** 19 tests, 100% de éxito

### 🔲 Pendiente

- Tests de autenticación (login, logout, refresh, onboarding)
- Tests unitarios de use cases
- Tests de validación de seguridad (CSRF, JWT)
- Tests de rate limiting (cuando Redis esté disponible)

## Convenciones de Testing

### Nomenclatura
- Archivos: `test_<module>_<feature>.py`
- Funciones helper: `test()`, `result()`, `setup_login()`

### Estructura de Test
```python
# SETUP: Autenticación y preparación
# TEST X.Y: Descripción del test
# CLEANUP: Restauración de estado
# RESUMEN: Contadores de pass/fail
```

### Assertions
Los tests usan assertions manuales con contadores:
```python
passed = 0
failed = 0

if condition:
    passed += 1
    print("[OK] PASS")
else:
    failed += 1
    print("[FAIL] FAIL")
```

### Timeouts
Todos los requests tienen `timeout=30` debido a la latencia de BD.

## Migración a pytest (TODO)

Estos tests están escritos con `requests` + `subprocess` para validación rápida. 

**Plan de migración:**
1. Instalar pytest y pytest-flask
2. Convertir a test fixtures
3. Agregar parametrización
4. Integrar con CI/CD

```bash
# Futuro
pip install pytest pytest-flask
pytest src/tests/integration/users/
```

## Referencias

- Documentación completa: `backend/USUARIOS_CRUD_IMPLEMENTATION.md`
- Arquitectura del proyecto: `PROJECT_GUIDE.md`
- Convenciones de código: `AGENTS.md`

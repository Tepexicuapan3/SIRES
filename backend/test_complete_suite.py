"""
TEST SUITE COMPLETO - USUARIOS CRUD
Verifica todos los endpoints implementados en las 3 fases
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api/v1"
session = requests.Session()

def print_separator(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_test(number, description, expected_status=None):
    status_text = f" (esperado: {expected_status})" if expected_status else ""
    print(f"\n[TEST {number}] {description}{status_text}")
    print("-" * 80)

def check_status(actual, expected, test_name):
    if actual == expected:
        print(f"[OK] {test_name}: {actual}")
        return True
    else:
        print(f"[FAIL] {test_name}: esperado {expected}, obtuvo {actual}")
        return False

# Contadores
tests_passed = 0
tests_failed = 0

try:
    print_separator("SETUP: Login como Admin")
    resp = session.post(f"{BASE_URL}/auth/login", json={
        "usuario": "testrbac",
        "clave": "Test123!"
    })
    
    if resp.status_code != 200:
        print(f"[FATAL] No se pudo hacer login: {resp.status_code}")
        print(resp.text)
        exit(1)
    
    admin_data = resp.json()
    admin_id = admin_data['user']['id_usuario']
    csrf_token = [c.value for c in session.cookies if c.name == 'csrf_access_token'][0]
    print(f"[OK] Login exitoso. Admin ID: {admin_id}")
    print(f"[OK] CSRF Token obtenido: {csrf_token[:20]}...")

    # PHASE 1: READ OPERATIONS
    print_separator("PHASE 1: READ OPERATIONS")
    
    # TEST 1.1: List Users (sin filtros)
    print_test("1.1", "GET /users (sin filtros)", 200)
    resp = session.get(f"{BASE_URL}/users")
    if check_status(resp.status_code, 200, "List users"):
        data = resp.json()
        assert "items" in data, "Falta campo 'items'"
        assert "page" in data, "Falta campo 'page'"
        assert "page_size" in data, "Falta campo 'page_size'"
        assert "total" in data, "Falta campo 'total'"
        assert len(data["items"]) > 0, "Lista vacia"
        if "clave" in data["items"][0]:
            print("[FAIL] PASSWORD EXPUESTO EN LISTA")
            tests_failed += 1
        else:
            print("[OK] Password NO expuesto")
            tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 1.2: List Users (con filtros)
    print_test("1.2", "GET /users?search=test&estado=A", 200)
    resp = session.get(f"{BASE_URL}/users?search=test&estado=A&page=1&page_size=10")
    if check_status(resp.status_code, 200, "List users con filtros"):
        data = resp.json()
        assert data["page"] == 1, f"Page incorrecto: {data['page']}"
        assert data["page_size"] == 10, f"Page size incorrecto: {data['page_size']}"
        print(f"[OK] Filtros aplicados correctamente ({data['total']} resultados)")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 1.3: Get User by ID
    print_test("1.3", "GET /users/14 (usuario existente)", 200)
    test_user_id = 14
    resp = session.get(f"{BASE_URL}/users/{test_user_id}")
    if check_status(resp.status_code, 200, "Get user by ID"):
        data = resp.json()
        assert "user" in data, "Falta campo 'user'"
        assert "roles" in data, "Falta campo 'roles'"
        user = data["user"]
        assert user["id_usuario"] == test_user_id, "ID incorrecto"
        assert "clave" not in user, "PASSWORD EXPUESTO"
        assert len(data["roles"]) > 0, "Sin roles"
        print(f"[OK] Usuario: {user['usuario']}, Roles: {len(data['roles'])}")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 1.4: Get User inexistente
    print_test("1.4", "GET /users/99999 (inexistente)", 404)
    resp = session.get(f"{BASE_URL}/users/99999")
    if check_status(resp.status_code, 404, "Get user inexistente"):
        data = resp.json()
        assert data["code"] == "USER_NOT_FOUND", f"Codigo incorrecto: {data['code']}"
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 1.5: Paginacion invalida
    print_test("1.5", "GET /users?page=0 (invalido)", 400)
    resp = session.get(f"{BASE_URL}/users?page=0")
    if check_status(resp.status_code, 400, "Paginacion invalida"):
        tests_passed += 1
    else:
        tests_failed += 1

    # PHASE 2: UPDATE OPERATIONS
    print_separator("PHASE 2: UPDATE OPERATIONS")
    
    # Guardar estado original
    resp = session.get(f"{BASE_URL}/users/{test_user_id}")
    original_user = resp.json()["user"]
    
    # TEST 2.1: Update nombre, paterno, materno
    print_test("2.1", "PATCH /users/14 (update nombres)", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={
            "nombre": "Test UPDATE",
            "paterno": "Apellido1 Mod",
            "materno": "Apellido2 Mod"
        },
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 200, "Update nombres"):
        data = resp.json()
        user = data["user"]
        assert user["nombre"] == "Test UPDATE", "Nombre no actualizado"
        assert user["paterno"] == "Apellido1 Mod", "Paterno no actualizado"
        assert user["usr_modf"] == admin_id, "usr_modf incorrecto"
        assert user["fch_modf"] is not None, "fch_modf no actualizado"
        print(f"[OK] Audit trail: usr_modf={user['usr_modf']}, fch_modf={user['fch_modf']}")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 2.2: Update solo email
    print_test("2.2", "PATCH /users/14 (update email)", 200)
    new_email = f"test.update.{int(datetime.now().timestamp())}@metro.test.mx"
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={"correo": new_email},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 200, "Update email"):
        user = resp.json()["user"]
        assert user["correo"] == new_email, f"Email no actualizado: {user['correo']}"
        print(f"[OK] Email actualizado: {new_email}")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 2.3: Email duplicado
    print_test("2.3", "PATCH /users/14 (email duplicado)", 409)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={"correo": "test@rbac.local"},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 409, "Email duplicado"):
        data = resp.json()
        assert data["code"] == "EMAIL_DUPLICATE", f"Codigo incorrecto: {data['code']}"
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 2.4: Email invalido
    print_test("2.4", "PATCH /users/14 (email invalido)", 422)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={"correo": "esto-no-es-email"},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 422, "Email invalido"):
        data = resp.json()
        assert data["code"] == "INVALID_EMAIL", f"Codigo incorrecto: {data['code']}"
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 2.5: Request vacio
    print_test("2.5", "PATCH /users/14 (sin campos)", 400)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 400, "Request vacio"):
        data = resp.json()
        assert data["code"] == "NO_FIELDS_TO_UPDATE", f"Codigo incorrecto: {data['code']}"
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 2.6: Usuario inexistente
    print_test("2.6", "PATCH /users/99999 (inexistente)", 404)
    resp = session.patch(
        f"{BASE_URL}/users/99999",
        json={"nombre": "Test"},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 404, "Update usuario inexistente"):
        tests_passed += 1
    else:
        tests_failed += 1

    # PHASE 3A: CHANGE USER ROLE
    print_separator("PHASE 3A: CHANGE USER ROLE")
    
    resp = session.get(f"{BASE_URL}/users/{test_user_id}")
    current_role = [r for r in resp.json()["roles"] if r["is_primary"]][0]
    original_role_id = current_role["id_rol"]
    print(f"Rol actual: {current_role['rol']} (ID: {original_role_id})")
    
    # TEST 3.1: Cambiar a ESPECIALISTAS (ID 3)
    print_test("3.1", "PATCH /users/14/role (cambiar a ESPECIALISTAS)", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/role",
        json={"id_rol": 3},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 200, "Change role"):
        data = resp.json()
        new_role = [r for r in data["roles"] if r["is_primary"]][0]
        assert new_role["id_rol"] == 3, f"Rol no cambio: {new_role['id_rol']}"
        print(f"[OK] Nuevo rol: {new_role['rol']}")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 3.2: Mismo rol (debe fallar)
    print_test("3.2", "PATCH /users/14/role (mismo rol)", 409)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/role",
        json={"id_rol": 3},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 409, "Mismo rol"):
        data = resp.json()
        assert data["code"] == "SAME_ROLE", f"Codigo incorrecto: {data['code']}"
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 3.3: Rol inexistente
    print_test("3.3", "PATCH /users/14/role (rol inexistente)", 404)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/role",
        json={"id_rol": 99999},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 404, "Rol inexistente"):
        data = resp.json()
        assert data["code"] == "ROLE_NOT_FOUND", f"Codigo incorrecto: {data['code']}"
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 3.4: Sin id_rol en body
    print_test("3.4", "PATCH /users/14/role (sin id_rol)", 400)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/role",
        json={},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 400, "Sin id_rol"):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Restaurar rol original
    print(f"\nRestaurando rol original (ID: {original_role_id})...")
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/role",
        json={"id_rol": original_role_id},
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if resp.status_code == 200:
        print("[OK] Rol restaurado")

    # PHASE 3B: DEACTIVATE/ACTIVATE USER
    print_separator("PHASE 3B: DEACTIVATE/ACTIVATE USER")
    
    # TEST 4.1: Deactivate user
    print_test("4.1", "PATCH /users/14/deactivate", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/deactivate",
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 200, "Deactivate user"):
        user = resp.json()["user"]
        assert user["est_usuario"] == "B", f"Estado incorrecto: {user['est_usuario']}"
        print(f"[OK] Usuario desactivado: est_usuario=B")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 4.2: Verificar estado inactivo
    print_test("4.2", "GET /users/14 (verificar inactivo)", 200)
    resp = session.get(f"{BASE_URL}/users/{test_user_id}")
    if check_status(resp.status_code, 200, "Verificar estado"):
        user = resp.json()["user"]
        if user["est_usuario"] == "B":
            print("[OK] Estado confirmado: INACTIVO")
            tests_passed += 1
        else:
            print(f"[FAIL] Estado esperado B, obtuvo {user['est_usuario']}")
            tests_failed += 1
    else:
        tests_failed += 1
    
    # TEST 4.3: Activate user
    print_test("4.3", "PATCH /users/14/activate", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}/activate",
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 200, "Activate user"):
        user = resp.json()["user"]
        assert user["est_usuario"] == "A", f"Estado incorrecto: {user['est_usuario']}"
        print(f"[OK] Usuario reactivado: est_usuario=A")
        tests_passed += 1
    else:
        tests_failed += 1
    
    # TEST 4.4: Deactivate usuario inexistente
    print_test("4.4", "PATCH /users/99999/deactivate (inexistente)", 404)
    resp = session.patch(
        f"{BASE_URL}/users/99999/deactivate",
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    if check_status(resp.status_code, 404, "Deactivate inexistente"):
        tests_passed += 1
    else:
        tests_failed += 1

    # CLEANUP: Restaurar datos originales
    print_separator("CLEANUP: Restaurar datos originales")
    
    resp = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={
            "nombre": original_user["nombre"],
            "paterno": original_user["paterno"],
            "materno": original_user["materno"],
            "correo": original_user["correo"]
        },
        headers={"X-CSRF-TOKEN": csrf_token}
    )
    
    if resp.status_code == 200:
        print("[OK] Datos del usuario restaurados")

    # RESUMEN FINAL
    print_separator("RESUMEN FINAL")
    
    total_tests = tests_passed + tests_failed
    success_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"""
Total de tests ejecutados: {total_tests}
Tests pasados:             {tests_passed}
Tests fallidos:            {tests_failed}
Tasa de exito:             {success_rate:.1f}%

Desglose por fase:
- Phase 1 (READ):          5 tests
- Phase 2 (UPDATE):        6 tests
- Phase 3a (CHANGE ROLE):  4 tests
- Phase 3b (TOGGLE):       4 tests

Estado: {'[OK] TODOS LOS TESTS PASARON' if tests_failed == 0 else f'[FAIL] {tests_failed} tests fallaron'}
""")
    
    exit(0 if tests_failed == 0 else 1)

except KeyboardInterrupt:
    print("\n\n[WARN] Tests interrumpidos por el usuario")
    exit(1)
except Exception as e:
    print(f"\n\n[ERROR] Error inesperado: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

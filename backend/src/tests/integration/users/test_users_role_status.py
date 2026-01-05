"""
PHASE 3: ROLE & STATUS OPERATIONS
8 tests: 4 para cambio de rol + 4 para toggle status
"""
import requests
import sys

BASE_URL = "http://localhost:5000/api/v1"
session = requests.Session()
TEST_USER_ID = 14

def test(num, desc, expected):
    print(f"\n[TEST {num}] {desc} (esperado: {expected})")
    return num, desc, expected

def result(passed, msg=""):
    if passed:
        print(f"  [OK] PASS {msg}")
        return 1, 0
    else:
        print(f"  [FAIL] FAIL {msg}")
        return 0, 1

passed = failed = 0

# SETUP: Login
print("="*80)
print("SETUP: Login como testrbac (admin)")
print("="*80)
try:
    resp = session.post(f"{BASE_URL}/auth/login", json={
        "usuario": "testrbac",
        "clave": "Test123!"
    }, timeout=30)
    
    if resp.status_code != 200:
        print(f"FATAL: Login fallo con {resp.status_code}")
        sys.exit(1)
    
    admin_data = resp.json()
    admin_id = admin_data['user']['id_usuario']
    
    # Get CSRF token
    csrf_cookies = [c.value for c in session.cookies if c.name == 'csrf_access_token']
    csrf_token = csrf_cookies[0] if csrf_cookies else ""
    
    if not csrf_token:
        print("FATAL: No se obtuvo CSRF token")
        sys.exit(1)
    
    print(f"[OK] Login exitoso. Admin ID: {admin_id}")
    print(f"[OK] CSRF Token: {csrf_token[:20]}...")
except Exception as e:
    print(f"FATAL: Error en login: {e}")
    sys.exit(1)

# Guardar rol original del usuario
print("\n[SETUP] Guardando rol original del usuario...")
try:
    resp = session.get(f"{BASE_URL}/users/{TEST_USER_ID}", timeout=30)
    if resp.status_code != 200:
        print(f"FATAL: No se pudo obtener usuario {TEST_USER_ID}")
        sys.exit(1)
    original_data = resp.json()
    original_roles = original_data["roles"]
    print(f"[OK] Roles originales guardados: {len(original_roles)} roles")
    for role in original_roles:
        print(f"    - {role['rol']} (ID: {role['id_rol']})")
except Exception as e:
    print(f"FATAL: Error guardando roles: {e}")
    sys.exit(1)

print("\n" + "="*80)
print("PHASE 3A: CHANGE ROLE OPERATIONS")
print("="*80)

# TEST 3.1: Cambiar rol a ESPECIALISTAS (ID 3)
try:
    test(3.1, "PATCH /users/14/role (cambiar a ESPECIALISTAS)", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}/role",
        json={"id_rol": 3},
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  [OK] mensaje: {data.get('message')}")
        
        # Verificar que el rol cambio
        resp2 = session.get(f"{BASE_URL}/users/{TEST_USER_ID}", timeout=30)
        user_data = resp2.json()
        roles = user_data.get("roles", [])
        has_especialistas = any(r.get("id_rol") == 3 for r in roles)
        
        print(f"  [{'OK' if has_especialistas else 'FAIL'}] rol ESPECIALISTAS asignado")
        p, f = result(has_especialistas)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}: {resp.text[:100]}")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 3.2: Intentar asignar mismo rol (debe fallar con 409)
try:
    test(3.2, "PATCH /users/14/role (mismo rol)", 409)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}/role",
        json={"id_rol": 3},
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 409:
        data = resp.json()
        # Acepta tanto ROLE_ALREADY_ASSIGNED como SAME_ROLE
        code_ok = data.get("code") in ["ROLE_ALREADY_ASSIGNED", "SAME_ROLE"]
        print(f"  [{'OK' if code_ok else 'FAIL'}] codigo = {data.get('code')}")
        p, f = result(code_ok)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}, esperado 409")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 3.3: Rol inexistente
try:
    test(3.3, "PATCH /users/14/role (rol inexistente)", 404)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}/role",
        json={"id_rol": 99999},
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 404:
        data = resp.json()
        code_ok = data.get("code") == "ROLE_NOT_FOUND"
        print(f"  [{'OK' if code_ok else 'FAIL'}] codigo = {data.get('code')}")
        p, f = result(code_ok)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}, esperado 404")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 3.4: Request sin id_rol
try:
    test(3.4, "PATCH /users/14/role (sin id_rol)", 400)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}/role",
        json={},
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 400:
        p, f = result(True)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}, esperado 400")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

print("\n" + "="*80)
print("PHASE 3B: TOGGLE STATUS OPERATIONS")
print("="*80)

# TEST 3.5: Desactivar usuario
try:
    test(3.5, "PATCH /users/14/deactivate", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}/deactivate",
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  [OK] mensaje: {data.get('message')}")
        p, f = result(True)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}: {resp.text[:100]}")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 3.6: Verificar que usuario esta inactivo
try:
    test(3.6, "GET /users/14 (verificar est_usuario=B)", 200)
    resp = session.get(f"{BASE_URL}/users/{TEST_USER_ID}", timeout=30)
    
    if resp.status_code == 200:
        user = resp.json().get("user", {})
        estado = user.get("est_usuario")
        estado_ok = estado == "B"
        print(f"  [{'OK' if estado_ok else 'FAIL'}] est_usuario = '{estado}' (esperado 'B' para Baja)")
        p, f = result(estado_ok)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 3.7: Reactivar usuario
try:
    test(3.7, "PATCH /users/14/activate", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}/activate",
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  [OK] mensaje: {data.get('message')}")
        
        # Verificar que estado volvio a A
        resp2 = session.get(f"{BASE_URL}/users/{TEST_USER_ID}", timeout=30)
        user = resp2.json().get("user", {})
        estado = user.get("est_usuario")
        estado_ok = estado == "A"
        print(f"  [{'OK' if estado_ok else 'FAIL'}] est_usuario = '{estado}' (esperado 'A' para Activo)")
        
        p, f = result(estado_ok)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}: {resp.text[:100]}")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 3.8: Desactivar usuario inexistente
try:
    test(3.8, "PATCH /users/99999/deactivate (inexistente)", 404)
    resp = session.patch(
        f"{BASE_URL}/users/99999/deactivate",
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 404:
        data = resp.json()
        code_ok = data.get("code") == "USER_NOT_FOUND"
        print(f"  [{'OK' if code_ok else 'FAIL'}] codigo = {data.get('code')}")
        p, f = result(code_ok)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}, esperado 404")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# CLEANUP: Restaurar rol original
print("\n" + "="*80)
print("CLEANUP: Restaurando rol original")
print("="*80)
try:
    if len(original_roles) > 0:
        # Restaurar el primer rol que tenia
        original_rol_id = original_roles[0]['id_rol']
        resp = session.patch(
            f"{BASE_URL}/users/{TEST_USER_ID}/role",
            json={"id_rol": original_rol_id},
            headers={"X-CSRF-TOKEN": csrf_token},
            timeout=30
        )
        
        if resp.status_code in [200, 409]:  # 409 si ya tenia ese rol
            print(f"[OK] Rol restaurado a ID {original_rol_id}")
        else:
            print(f"[WARN] No se pudo restaurar rol completamente: {resp.status_code}")
    else:
        print("[WARN] No habia roles originales para restaurar")
except Exception as e:
    print(f"[WARN] Error en cleanup: {e}")

# RESUMEN
print("\n" + "="*80)
print("RESUMEN PHASE 3")
print("="*80)
print(f"Passed: {passed}/8")
print(f"Failed: {failed}/8")
print("="*80)

sys.exit(0 if failed == 0 else 1)

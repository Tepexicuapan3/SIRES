"""
PHASE 2: UPDATE OPERATIONS
6 tests de operaciones de actualizacion
"""
import requests
import sys
from datetime import datetime

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
        print(resp.text)
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

# Guardar estado original del usuario
print("\n[SETUP] Guardando estado original del usuario...")
try:
    resp = session.get(f"{BASE_URL}/users/{TEST_USER_ID}", timeout=30)
    if resp.status_code != 200:
        print(f"FATAL: No se pudo obtener usuario {TEST_USER_ID}")
        sys.exit(1)
    original_user = resp.json()["user"]
    print(f"[OK] Estado original guardado: {original_user['usuario']}")
except Exception as e:
    print(f"FATAL: Error guardando estado: {e}")
    sys.exit(1)

print("\n" + "="*80)
print("PHASE 2: UPDATE OPERATIONS")
print("="*80)

# TEST 2.1: Update nombre, paterno, materno
try:
    test(2.1, "PATCH /users/14 (update nombres)", 200)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}",
        json={
            "nombre": "Test UPDATE",
            "paterno": "Apellido1 Mod",
            "materno": "Apellido2 Mod"
        },
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 200:
        data = resp.json()
        user = data.get("user", {})
        
        checks = [
            (user.get("nombre") == "Test UPDATE", "nombre actualizado"),
            (user.get("paterno") == "Apellido1 Mod", "paterno actualizado"),
            (user.get("materno") == "Apellido2 Mod", "materno actualizado"),
            (str(user.get("usr_modf")) == str(admin_id), f"usr_modf = {admin_id}"),
            (user.get("fch_modf") is not None, "fch_modf actualizado"),
        ]
        
        all_ok = all(check[0] for check in checks)
        for check_ok, msg in checks:
            print(f"  [{'OK' if check_ok else 'FAIL'}] {msg}")
        
        p, f = result(all_ok)
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

# TEST 2.2: Update solo email
try:
    test(2.2, "PATCH /users/14 (update email)", 200)
    new_email = f"test.update.{int(datetime.now().timestamp())}@metro.test.mx"
    
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}",
        json={"correo": new_email},
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 200:
        user = resp.json().get("user", {})
        email_ok = user.get("correo") == new_email
        print(f"  [{'OK' if email_ok else 'FAIL'}] email = {user.get('correo')}")
        p, f = result(email_ok)
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

# TEST 2.3: Email duplicado
try:
    test(2.3, "PATCH /users/14 (email duplicado)", 409)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}",
        json={"correo": "test@rbac.local"},  # Email del admin
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 409:
        data = resp.json()
        code_ok = data.get("code") == "EMAIL_DUPLICATE"
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

# TEST 2.4: Email invalido
try:
    test(2.4, "PATCH /users/14 (email invalido)", 422)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}",
        json={"correo": "esto-no-es-email"},
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 422:
        data = resp.json()
        code_ok = data.get("code") == "INVALID_EMAIL"
        print(f"  [{'OK' if code_ok else 'FAIL'}] codigo = {data.get('code')}")
        p, f = result(code_ok)
        passed += p
        failed += f
    else:
        p, f = result(False, f"status {resp.status_code}, esperado 422")
        passed += p
        failed += f
except Exception as e:
    p, f = result(False, f"excepcion: {e}")
    passed += p
    failed += f

# TEST 2.5: Request vacio
try:
    test(2.5, "PATCH /users/14 (sin campos)", 400)
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}",
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

# TEST 2.6: Usuario inexistente
try:
    test(2.6, "PATCH /users/99999 (inexistente)", 404)
    resp = session.patch(
        f"{BASE_URL}/users/99999",
        json={"nombre": "Test"},
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

# CLEANUP: Restaurar estado original
print("\n" + "="*80)
print("CLEANUP: Restaurando estado original")
print("="*80)
try:
    resp = session.patch(
        f"{BASE_URL}/users/{TEST_USER_ID}",
        json={
            "nombre": original_user["nombre"],
            "paterno": original_user["paterno"],
            "materno": original_user["materno"],
            "correo": original_user["correo"],
        },
        headers={"X-CSRF-TOKEN": csrf_token},
        timeout=30
    )
    
    if resp.status_code == 200:
        print("[OK] Usuario restaurado al estado original")
    else:
        print(f"[WARN] No se pudo restaurar completamente: {resp.status_code}")
except Exception as e:
    print(f"[WARN] Error en cleanup: {e}")

# RESUMEN
print("\n" + "="*80)
print("RESUMEN PHASE 2")
print("="*80)
print(f"Passed: {passed}/6")
print(f"Failed: {failed}/6")
print("="*80)

sys.exit(0 if failed == 0 else 1)

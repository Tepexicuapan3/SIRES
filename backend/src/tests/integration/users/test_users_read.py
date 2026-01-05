"""
PHASE 1: READ OPERATIONS
5 tests de operaciones de lectura
"""
import requests
import sys

BASE_URL = "http://localhost:5000/api/v1"
session = requests.Session()

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
    print(f"[OK] Login exitoso. Admin ID: {admin_data['user']['id_usuario']}")
except Exception as e:
    print(f"FATAL: Error en login: {e}")
    sys.exit(1)

print("\n" + "="*80)
print("PHASE 1: READ OPERATIONS")
print("="*80)

# TEST 1.1: List users sin filtros
try:
    test(1.1, "GET /users (sin filtros)", 200)
    resp = session.get(f"{BASE_URL}/users", timeout=30)
    
    if resp.status_code == 200:
        data = resp.json()
        checks = [
            ("items" in data, "tiene campo 'items'"),
            ("page" in data, "tiene campo 'page'"),
            ("page_size" in data, "tiene campo 'page_size'"),
            ("total" in data, "tiene campo 'total'"),
            (len(data["items"]) > 0, "lista no vacia"),
            ("clave" not in data["items"][0], "password NO expuesto"),
        ]
        
        all_ok = all(check[0] for check in checks)
        for check_ok, msg in checks:
            print(f"  {'[OK]' if check_ok else '[FAIL]'} {msg}")
        
        p, f = result(all_ok)
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

# TEST 1.2: List users con filtros
try:
    test(1.2, "GET /users?search=test&estado=A&page=1&page_size=10", 200)
    resp = session.get(f"{BASE_URL}/users?search=test&estado=A&page=1&page_size=10", timeout=30)
    
    if resp.status_code == 200:
        data = resp.json()
        checks = [
            (data["page"] == 1, "page = 1"),
            (data["page_size"] == 10, "page_size = 10"),
        ]
        
        all_ok = all(check[0] for check in checks)
        for check_ok, msg in checks:
            print(f"  {'[OK]' if check_ok else '[FAIL]'} {msg}")
        
        print(f"  Total resultados: {data['total']}")
        p, f = result(all_ok)
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

# TEST 1.3: Get user by ID
try:
    test(1.3, "GET /users/14 (usuario existente)", 200)
    resp = session.get(f"{BASE_URL}/users/14", timeout=30)
    
    if resp.status_code == 200:
        data = resp.json()
        user = data.get("user", {})
        roles = data.get("roles", [])
        
        checks = [
            ("user" in data, "tiene campo 'user'"),
            ("roles" in data, "tiene campo 'roles'"),
            (user.get("id_usuario") == 14, "id_usuario correcto"),
            ("clave" not in user, "password NO expuesto"),
            (len(roles) > 0, "tiene roles asignados"),
        ]
        
        all_ok = all(check[0] for check in checks)
        for check_ok, msg in checks:
            print(f"  {'[OK]' if check_ok else '[FAIL]'} {msg}")
        
        print(f"  Usuario: {user.get('usuario')}, Roles: {len(roles)}")
        p, f = result(all_ok)
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

# TEST 1.4: Get user inexistente
try:
    test(1.4, "GET /users/99999 (inexistente)", 404)
    resp = session.get(f"{BASE_URL}/users/99999", timeout=30)
    
    if resp.status_code == 404:
        data = resp.json()
        code_ok = data.get("code") == "USER_NOT_FOUND"
        print(f"  {'[OK]' if code_ok else '[FAIL]'} codigo correcto: {data.get('code')}")
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

# TEST 1.5: Paginacion invalida
try:
    test(1.5, "GET /users?page=0 (invalido)", 400)
    resp = session.get(f"{BASE_URL}/users?page=0", timeout=30)
    
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

# RESUMEN
print("\n" + "="*80)
print("RESUMEN PHASE 1")
print("="*80)
print(f"Passed: {passed}/5")
print(f"Failed: {failed}/5")
print("="*80)

sys.exit(0 if failed == 0 else 1)

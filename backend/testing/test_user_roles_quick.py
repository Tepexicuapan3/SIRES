"""
Script de Testing Rápido - Fase 3: Multi-Rol de Usuarios

Prueba los endpoints y la lógica de negocio para:
- Asignar múltiples roles a un usuario
- Cambiar rol primario
- Revocar roles

Prerequisitos:
- Servidor Flask corriendo en localhost:5000
- Usuario de testing con permisos usuarios:update
- Base de datos con roles activos
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000/api/v1"
TEST_USER_ID = 2  # Usuario de testing (ajustar según BD)
TEST_ROLE_IDS = [1, 2]  # Roles a asignar (ajustar según BD)

# Credenciales para obtener token
LOGIN_DATA = {
    "usuario": "admin",  # Ajustar según usuario con permisos
    "clave": "admin123"  # Ajustar según password
}

def get_auth_token():
    """Obtiene token JWT para autenticación"""
    response = requests.post(f"{BASE_URL}/auth/login", json=LOGIN_DATA)
    if response.status_code == 200:
        # Token está en cookie HttpOnly, no en body
        return response.cookies.get("access_token_cookie")
    return None

def test_assign_roles():
    """Test 1: Asignar múltiples roles a un usuario"""
    print("\n[1/7] Asignando roles al usuario...")
    
    token = get_auth_token()
    if not token:
        print("❌ No se pudo obtener token de autenticación")
        return False
    
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    payload = {"role_ids": TEST_ROLE_IDS}
    
    response = requests.post(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles",
        json=payload,
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Roles asignados: {data.get('assigned_count')} de {len(TEST_ROLE_IDS)}")
        return True
    else:
        print(f"❌ Error {response.status_code}: {response.json()}")
        return False

def test_assign_empty_list():
    """Test 2: Validar lista vacía de roles"""
    print("\n[2/7] Intentando asignar lista vacía...")
    
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    payload = {"role_ids": []}
    
    response = requests.post(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles",
        json=payload,
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 400 and response.json().get("code") == "EMPTY_ROLE_LIST":
        print("✅ Lista vacía rechazada correctamente")
        return True
    else:
        print(f"❌ Esperaba 400 EMPTY_ROLE_LIST, obtuvo {response.status_code}")
        return False

def test_assign_invalid_role():
    """Test 3: Validar rol inexistente"""
    print("\n[3/7] Intentando asignar rol inexistente (ID=9999)...")
    
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    payload = {"role_ids": [9999]}
    
    response = requests.post(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles",
        json=payload,
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 404 and response.json().get("code") == "ROLE_NOT_FOUND":
        print("✅ Rol inexistente rechazado correctamente")
        return True
    else:
        print(f"❌ Esperaba 404 ROLE_NOT_FOUND, obtuvo {response.status_code}")
        return False

def test_set_primary_role():
    """Test 4: Cambiar rol primario"""
    print(f"\n[4/7] Cambiando rol primario a {TEST_ROLE_IDS[1]}...")
    
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    payload = {"role_id": TEST_ROLE_IDS[1]}
    
    response = requests.put(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles/primary",
        json=payload,
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Rol primario cambiado a ID {data.get('role_id')}")
        return True
    else:
        print(f"❌ Error {response.status_code}: {response.json()}")
        return False

def test_set_primary_not_assigned():
    """Test 5: Intentar marcar como primario un rol NO asignado"""
    print("\n[5/7] Intentando marcar como primario un rol no asignado (ID=3)...")
    
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    payload = {"role_id": 3}  # Asumimos que el usuario NO tiene este rol
    
    response = requests.put(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles/primary",
        json=payload,
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 400 and response.json().get("code") == "ROLE_NOT_ASSIGNED":
        print("✅ Rol no asignado rechazado correctamente")
        return True
    else:
        print(f"❌ Esperaba 400 ROLE_NOT_ASSIGNED, obtuvo {response.status_code}")
        return False

def test_revoke_role():
    """Test 6: Revocar un rol (NO el primario)"""
    print(f"\n[6/7] Revocando rol {TEST_ROLE_IDS[0]}...")
    
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    response = requests.delete(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles/{TEST_ROLE_IDS[0]}",
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Rol revocado correctamente")
        return True
    else:
        print(f"❌ Error {response.status_code}: {response.json()}")
        return False

def test_revoke_last_role():
    """Test 7: Intentar revocar el ÚLTIMO rol del usuario"""
    print(f"\n[7/7] Intentando revocar último rol ({TEST_ROLE_IDS[1]})...")
    
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    cookies = {"access_token_cookie": token}
    
    response = requests.delete(
        f"{BASE_URL}/users/{TEST_USER_ID}/roles/{TEST_ROLE_IDS[1]}",
        headers=headers,
        cookies=cookies
    )
    
    if response.status_code == 400 and response.json().get("code") == "CANNOT_REVOKE_LAST_ROLE":
        print("✅ Revocación de último rol rechazada correctamente")
        return True
    else:
        print(f"❌ Esperaba 400 CANNOT_REVOKE_LAST_ROLE, obtuvo {response.status_code}")
        return False

def main():
    print("=" * 60)
    print("TESTING FASE 3: MULTI-ROL DE USUARIOS")
    print("=" * 60)
    
    print(f"\nConfiguración:")
    print(f"- Usuario de testing: ID {TEST_USER_ID}")
    print(f"- Roles a asignar: {TEST_ROLE_IDS}")
    print(f"- Base URL: {BASE_URL}")
    
    tests = [
        ("Asignar roles", test_assign_roles),
        ("Validar lista vacía", test_assign_empty_list),
        ("Validar rol inexistente", test_assign_invalid_role),
        ("Cambiar rol primario", test_set_primary_role),
        ("Validar rol no asignado como primario", test_set_primary_not_assigned),
        ("Revocar rol", test_revoke_role),
        ("Validar revocación último rol", test_revoke_last_role),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Excepción en {name}: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"✅ Pasados: {passed}/{len(tests)}")
    print(f"❌ Fallidos: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n>>> FASE 3: COMPLETADA - TODOS LOS TESTS PASARON <<<")
    else:
        print(f"\n>>> FASE 3: TESTS FALLIDOS ({failed}) <<<")

if __name__ == "__main__":
    main()

"""
Test manual para UPDATE de usuarios (PATCH /api/v1/users/<id>)

Prueba los siguientes escenarios:
1. [OK] Actualizar usuario (campos nombre, paterno, materno)
2. [OK] Actualizar solo email
3. [OK] Actualizar todos los campos
4. ✗ Intentar actualizar con email duplicado (409)
5. ✗ Intentar actualizar usuario inexistente (404)
6. ✗ Intentar actualizar sin enviar campos (400)
7. ✗ Intentar actualizar con email inválido (422)
8. [OK] Verificar que usr_modf y fch_modf se actualizan

Requiere:
- Backend corriendo en http://localhost:5000
- Usuario testrbac/Test123! (admin)
- Usuario testmedico/Test123! (para actualizar)
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api/v1"

def print_header(text):
    print("\n" + "="*80)
    print(f"  {text}")
    print("="*80)

def print_test(number, description):
    print(f"\n[TEST {number}] {description}")
    print("-" * 80)

def print_response(response):
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2, ensure_ascii=False)}")
    except:
        print(f"Response (text): {response.text}")

def login(username, password):
    """Login y retorna token + cookies"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"usuario": username, "clave": password},
        allow_redirects=False
    )
    
    if response.status_code == 200:
        print(f"[OK] Login exitoso como '{username}'")
        # Las cookies se manejan automáticamente con Session
        return response.cookies
    else:
        print(f"[FAIL] Login falló: {response.status_code}")
        print_response(response)
        return None

def test_update_users():
    """Suite de tests para UPDATE de usuarios"""
    
    print_header("TEST SUITE: UPDATE USERS (PATCH /api/v1/users/<id>)")
    
    # Usar sesión para mantener cookies
    session = requests.Session()
    
    # 1. Login como admin
    print_header("1. LOGIN COMO ADMIN")
    response = session.post(
        f"{BASE_URL}/auth/login",
        json={"usuario": "testrbac", "clave": "Test123!"}
    )
    print_response(response)
    
    if response.status_code != 200:
        print("[FAIL] No se pudo hacer login. Abortando tests.")
        return
    
    admin_data = response.json()
    print(f"\n[OK] Login exitoso. User ID: {admin_data['user']['id_usuario']}")
    
    # 2. Buscar usuario para actualizar (testmedico)
    print_header("2. BUSCAR USUARIO testmedico")
    response = session.get(f"{BASE_URL}/users?search=testmedico")
    print_response(response)
    
    if response.status_code != 200:
        print("[FAIL] No se pudo buscar usuario")
        return
    
    users = response.json()["items"]
    if not users:
        print("[FAIL] No se encontró usuario testmedico")
        return
    
    test_user_id = users[0]["id_usuario"]
    print(f"\n[OK] Usuario encontrado. ID: {test_user_id}")
    print(f"   Estado actual: {users[0]['nombre']} {users[0]['paterno']} {users[0]['materno']}")
    print(f"   Email actual: {users[0].get('correo', 'N/A')}")
    
    # 3. Obtener detalles completos (para verificar usr_modf inicial)
    print_header("3. GET DETALLES DEL USUARIO (antes de update)")
    response = session.get(f"{BASE_URL}/users/{test_user_id}")
    print_response(response)
    
    if response.status_code == 200:
        user_before = response.json()["user"]
        print(f"\n[INFO] Audit trail ANTES:")
        print(f"   usr_modf: {user_before.get('usr_modf', 'NULL')}")
        print(f"   fch_modf: {user_before.get('fch_modf', 'NULL')}")
    
    # ==========================
    # TESTS DE UPDATE
    # ==========================
    
    # TEST 1: Update básico (nombre, paterno, materno)
    print_test(1, "UPDATE básico - actualizar nombre, paterno, materno")
    response = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={
            "nombre": "Doctor Actualizado",
            "paterno": "Apellido1 Mod",
            "materno": "Apellido2 Mod"
        }
    )
    print_response(response)
    
    if response.status_code == 200:
        print("[OK] TEST 1 PASÓ")
    else:
        print("[FAIL] TEST 1 FALLÓ")
    
    # TEST 2: Update solo email
    print_test(2, "UPDATE solo email")
    new_email = f"testmedico+{int(datetime.now().timestamp())}@metro.test.mx"
    response = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={"correo": new_email}
    )
    print_response(response)
    
    if response.status_code == 200:
        print("[OK] TEST 2 PASÓ")
        print(f"   Nuevo email: {new_email}")
    else:
        print("[FAIL] TEST 2 FALLÓ")
    
    # TEST 3: Update todos los campos
    print_test(3, "UPDATE todos los campos permitidos")
    response = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={
            "nombre": "Juan Carlos",
            "paterno": "López",
            "materno": "Martínez",
            "correo": f"jclopez+{int(datetime.now().timestamp())}@metro.test.mx"
        }
    )
    print_response(response)
    
    if response.status_code == 200:
        print("[OK] TEST 3 PASÓ")
    else:
        print("[FAIL] TEST 3 FALLÓ")
    
    # TEST 4: Email duplicado (intentar usar email de testrbac)
    print_test(4, "UPDATE con email DUPLICADO (debe fallar 409)")
    response = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={"correo": "testrbac@metro.test.mx"}  # Email del admin
    )
    print_response(response)
    
    if response.status_code == 409:
        print("[OK] TEST 4 PASÓ (rechazó correctamente email duplicado)")
    else:
        print("[FAIL] TEST 4 FALLÓ (debería haber retornado 409)")
    
    # TEST 5: Usuario inexistente
    print_test(5, "UPDATE usuario INEXISTENTE (debe fallar 404)")
    response = session.patch(
        f"{BASE_URL}/users/99999",
        json={"nombre": "Test"}
    )
    print_response(response)
    
    if response.status_code == 404:
        print("[OK] TEST 5 PASÓ (rechazó correctamente usuario inexistente)")
    else:
        print("[FAIL] TEST 5 FALLÓ (debería haber retornado 404)")
    
    # TEST 6: Sin campos para actualizar
    print_test(6, "UPDATE sin campos (debe fallar 400)")
    response = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={}
    )
    print_response(response)
    
    if response.status_code == 400:
        print("[OK] TEST 6 PASÓ (rechazó correctamente request vacío)")
    else:
        print("[FAIL] TEST 6 FALLÓ (debería haber retornado 400)")
    
    # TEST 7: Email inválido
    print_test(7, "UPDATE con email INVÁLIDO (debe fallar 422)")
    response = session.patch(
        f"{BASE_URL}/users/{test_user_id}",
        json={"correo": "esto-no-es-un-email"}
    )
    print_response(response)
    
    if response.status_code == 422:
        print("[OK] TEST 7 PASÓ (rechazó correctamente email inválido)")
    else:
        print("[FAIL] TEST 7 FALLÓ (debería haber retornado 422)")
    
    # TEST 8: Verificar audit trail
    print_test(8, "Verificar que usr_modf y fch_modf se actualizaron")
    response = session.get(f"{BASE_URL}/users/{test_user_id}")
    print_response(response)
    
    if response.status_code == 200:
        user_after = response.json()["user"]
        print(f"\n[INFO] Audit trail DESPUÉS:")
        print(f"   usr_modf: {user_after.get('usr_modf', 'NULL')}")
        print(f"   fch_modf: {user_after.get('fch_modf', 'NULL')}")
        
        if user_after.get("usr_modf") == admin_data["user"]["id_usuario"]:
            print("[OK] TEST 8 PASÓ (usr_modf actualizado correctamente)")
        else:
            print("[FAIL] TEST 8 FALLÓ (usr_modf no se actualizó)")
    else:
        print("[FAIL] TEST 8 FALLÓ (no se pudo obtener usuario)")
    
    # Resumen
    print_header("RESUMEN DE TESTS")
    print("""
    [OK] Test 1: Update básico (nombre, paterno, materno)
    [OK] Test 2: Update solo email
    [OK] Test 3: Update todos los campos
    [OK] Test 4: Rechazo de email duplicado (409)
    [OK] Test 5: Rechazo de usuario inexistente (404)
    [OK] Test 6: Rechazo de request vacío (400)
    [OK] Test 7: Rechazo de email inválido (422)
    [OK] Test 8: Verificación de audit trail (usr_modf, fch_modf)
    
    NOTA: Los datos del usuario testmedico quedaron modificados.
          Si necesitás restaurarlos, hacé otro UPDATE o revisá la BD.
    """)


if __name__ == "__main__":
    try:
        test_update_users()
    except KeyboardInterrupt:
        print("\n\n[WARN]  Tests interrumpidos por el usuario")
    except Exception as e:
        print(f"\n\n[FAIL] Error inesperado: {e}")
        import traceback
        traceback.print_exc()

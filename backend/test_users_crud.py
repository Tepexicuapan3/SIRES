#!/usr/bin/env python3
"""
Script de testing para CRUD de Usuarios - Fase 1 (List + Get)

Este script prueba:
1. Login como admin (obtener JWT)
2. GET /api/v1/users (listar usuarios)
3. GET /api/v1/users/<id> (obtener usuario específico)
4. Filtros: search, estado, rol_id, paginación

Uso:
    python test_users_crud.py
"""

import requests
import json
from typing import Optional, Dict, Any

# Configuración
BASE_URL = "http://localhost:5000/api/v1"
ADMIN_USER = "testrbac"
ADMIN_PASS = "Test123!"

# Sesión con cookies
session = requests.Session()


def print_section(title: str):
    """Imprime un separador visual"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_test(name: str, passed: bool, details: str = ""):
    """Imprime resultado de un test"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"       {details}")


def login() -> Optional[str]:
    """
    Login como admin y obtener CSRF token
    Returns: CSRF token si tiene éxito
    """
    print_section("1. LOGIN COMO ADMIN")
    
    try:
        response = session.post(
            f"{BASE_URL}/auth/login",
            json={
                "usuario": ADMIN_USER,
                "clave": ADMIN_PASS
            }
        )
        
        if response.status_code == 200:
            # El JWT viene en cookies HttpOnly automáticamente
            # Necesitamos extraer el CSRF token
            csrf_token = session.cookies.get("csrf_access_token")
            
            data = response.json()
            print_test(
                "Login exitoso",
                True,
                f"Usuario: {data.get('user', {}).get('usuario', 'N/A')}"
            )
            print(f"   CSRF Token: {csrf_token[:20]}..." if csrf_token else "   ⚠️ No CSRF token")
            
            return csrf_token
        else:
            print_test(
                "Login fallido",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
            
    except Exception as e:
        print_test("Login exception", False, str(e))
        return None


def test_list_users(csrf_token: str):
    """Prueba GET /api/v1/users - Lista básica"""
    print_section("2. LISTAR USUARIOS (básico)")
    
    try:
        response = session.get(
            f"{BASE_URL}/users",
            headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
        )
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            total = data.get("total", 0)
            
            print_test(
                "Listado de usuarios",
                True,
                f"Total: {total}, En página: {len(items)}"
            )
            
            # Mostrar primeros 3 usuarios
            print("\n   Primeros usuarios:")
            for user in items[:3]:
                print(f"   - ID: {user.get('id_usuario')}, "
                      f"Usuario: {user.get('usuario')}, "
                      f"Nombre: {user.get('nombre')} {user.get('paterno')}, "
                      f"Rol: {user.get('rol_primario', 'Sin rol')}")
            
            # Verificar que NO venga el password
            has_password = any("clave" in user for user in items)
            print_test(
                "Seguridad: NO devuelve password",
                not has_password,
                "Campo 'clave' ausente" if not has_password else "⚠️ EXPONE PASSWORDS"
            )
            
            return items[0]["id_usuario"] if items else None
            
        else:
            print_test(
                "Listado fallido",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
            
    except Exception as e:
        print_test("Listado exception", False, str(e))
        return None


def test_list_with_pagination(csrf_token: str):
    """Prueba paginación"""
    print_section("3. PAGINACIÓN")
    
    tests = [
        {"params": {"page": 1, "page_size": 5}, "name": "Página 1, 5 registros"},
        {"params": {"page": 2, "page_size": 5}, "name": "Página 2, 5 registros"},
        {"params": {"page": 1, "page_size": 100}, "name": "Página grande (100)"},
    ]
    
    for test in tests:
        try:
            response = session.get(
                f"{BASE_URL}/users",
                params=test["params"],
                headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
            )
            
            if response.status_code == 200:
                data = response.json()
                items_count = len(data.get("items", []))
                print_test(
                    test["name"],
                    True,
                    f"Recibidos: {items_count} registros"
                )
            else:
                print_test(test["name"], False, f"Status: {response.status_code}")
                
        except Exception as e:
            print_test(test["name"], False, str(e))


def test_list_with_filters(csrf_token: str):
    """Prueba filtros"""
    print_section("4. FILTROS")
    
    tests = [
        {"params": {"estado": "A"}, "name": "Filtro: Solo activos"},
        {"params": {"search": "test"}, "name": "Búsqueda: 'test'"},
        {"params": {"rol_id": 1}, "name": "Filtro: Rol Admin (id=1)"},
        {"params": {"estado": "A", "page_size": 10}, "name": "Combinado: Activos + paginación"},
    ]
    
    for test in tests:
        try:
            response = session.get(
                f"{BASE_URL}/users",
                params=test["params"],
                headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
            )
            
            if response.status_code == 200:
                data = response.json()
                items_count = len(data.get("items", []))
                total = data.get("total", 0)
                print_test(
                    test["name"],
                    True,
                    f"Resultados: {items_count}/{total}"
                )
            else:
                print_test(test["name"], False, f"Status: {response.status_code}")
                
        except Exception as e:
            print_test(test["name"], False, str(e))


def test_get_user_by_id(csrf_token: str, user_id: Optional[int]):
    """Prueba GET /api/v1/users/<id>"""
    print_section("5. OBTENER USUARIO POR ID")
    
    if not user_id:
        print_test("Obtener usuario", False, "No hay user_id disponible")
        return
    
    try:
        response = session.get(
            f"{BASE_URL}/users/{user_id}",
            headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            roles = data.get("roles", [])
            
            print_test(
                f"Obtener usuario ID {user_id}",
                True,
                f"Usuario: {user.get('usuario')}"
            )
            
            print(f"\n   Detalles completos:")
            print(f"   - Nombre: {user.get('nombre')} {user.get('paterno')} {user.get('materno')}")
            print(f"   - Expediente: {user.get('expediente')}")
            print(f"   - CURP: {user.get('curp')}")
            print(f"   - Correo: {user.get('correo')}")
            print(f"   - Estado: {user.get('est_usuario')}")
            print(f"   - Creado por: {user.get('usr_alta')} el {user.get('fch_alta')}")
            print(f"   - Última conexión: {user.get('last_conexion', 'Nunca')}")
            
            print(f"\n   Roles asignados ({len(roles)}):")
            for role in roles:
                primary = "⭐ PRIMARIO" if role.get("is_primary") else ""
                print(f"   - {role.get('rol')}: {role.get('desc_rol')} {primary}")
            
            # Verificaciones de seguridad
            has_password = "clave" in user
            print_test(
                "Seguridad: NO devuelve password",
                not has_password,
                "Campo 'clave' ausente" if not has_password else "⚠️ EXPONE PASSWORD"
            )
            
            has_audit_fields = all(k in user for k in ["usr_alta", "fch_alta"])
            print_test(
                "Incluye campos de auditoría",
                has_audit_fields,
                "usr_alta, fch_alta presentes"
            )
            
        else:
            print_test(
                f"Obtener usuario ID {user_id}",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            
    except Exception as e:
        print_test(f"Obtener usuario ID {user_id}", False, str(e))


def test_get_nonexistent_user(csrf_token: str):
    """Prueba obtener usuario que no existe"""
    print_section("6. MANEJO DE ERRORES")
    
    try:
        response = session.get(
            f"{BASE_URL}/users/99999",
            headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
        )
        
        # Esperamos 404
        if response.status_code == 404:
            data = response.json()
            print_test(
                "Usuario no existe (404)",
                True,
                f"Code: {data.get('code')}, Message: {data.get('message')}"
            )
        else:
            print_test(
                "Usuario no existe",
                False,
                f"Expected 404, got {response.status_code}"
            )
            
    except Exception as e:
        print_test("Usuario no existe", False, str(e))
    
    # Prueba parámetros inválidos
    try:
        response = session.get(
            f"{BASE_URL}/users",
            params={"page": 0, "page_size": 1000},  # Inválidos
            headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
        )
        
        if response.status_code == 400:
            data = response.json()
            print_test(
                "Parámetros inválidos (400)",
                True,
                f"Code: {data.get('code')}"
            )
        else:
            print_test(
                "Parámetros inválidos",
                response.status_code == 400,
                f"Status: {response.status_code}"
            )
            
    except Exception as e:
        print_test("Parámetros inválidos", False, str(e))


def test_permissions():
    """Prueba acceso sin autenticación"""
    print_section("7. SEGURIDAD - Sin autenticación")
    
    # Nueva sesión sin login
    anon_session = requests.Session()
    
    try:
        response = anon_session.get(f"{BASE_URL}/users")
        
        # Esperamos 401 Unauthorized
        if response.status_code == 401:
            print_test(
                "Rechaza request sin JWT",
                True,
                "401 Unauthorized"
            )
        else:
            print_test(
                "Rechaza request sin JWT",
                False,
                f"Expected 401, got {response.status_code}"
            )
            
    except Exception as e:
        print_test("Request sin JWT", False, str(e))


def main():
    """Ejecuta todas las pruebas"""
    print("\n" + "█" * 60)
    print("█" + " " * 58 + "█")
    print("█" + "  TESTING CRUD USUARIOS - FASE 1 (List + Get)".center(58) + "█")
    print("█" + " " * 58 + "█")
    print("█" * 60)
    
    # 1. Login
    csrf_token = login()
    if not csrf_token:
        print("\n❌ No se pudo hacer login. Abortando tests.")
        print("   Asegurate de que:")
        print("   - El backend esté corriendo (python run.py)")
        print("   - La BD esté accesible")
        print("   - El usuario testrbac exista con password Test123!")
        return
    
    # 2. Listar usuarios (obtener ID para test posterior)
    user_id = test_list_users(csrf_token)
    
    # 3. Paginación
    test_list_with_pagination(csrf_token)
    
    # 4. Filtros
    test_list_with_filters(csrf_token)
    
    # 5. Obtener usuario específico
    test_get_user_by_id(csrf_token, user_id)
    
    # 6. Manejo de errores
    test_get_nonexistent_user(csrf_token)
    
    # 7. Seguridad
    test_permissions()
    
    print_section("RESUMEN")
    print("✅ Tests completados. Revisá los resultados arriba.")
    print("\nSi todos los tests pasaron:")
    print("- Los endpoints funcionan correctamente")
    print("- La seguridad está OK (no expone passwords, requiere JWT)")
    print("- La paginación y filtros funcionan")
    print("- El manejo de errores es consistente")


if __name__ == "__main__":
    main()

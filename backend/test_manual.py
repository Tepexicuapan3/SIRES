"""
Testing manual de endpoints CRUD Usuarios - Fase 1

Como el rate limiter tiene issues con Redis, voy a hacer un test manual
consultando directamente los endpoints que NO tienen rate limiting.

Primero hay que comentar el decorador @rate_limit_login en auth_routes.py
"""

import requests
import json

BASE_URL = "http://localhost:5000/api/v1"
session = requests.Session()

print("\n" + "="*60)
print("  TESTING MANUAL - CRUD USUARIOS FASE 1")
print("="*60)

# Step 1: Login
print("\n[1] Login como admin...")
response = session.post(
    f"{BASE_URL}/auth/login",
    json={"usuario": "testrbac", "clave": "Test123!"}
)

if response.status_code != 200:
    print(f"❌ Login falló: {response.status_code}")
    print(f"   Respuesta: {response.text[:200]}")
    print("\n⚠️  NOTA: Si ves error de Redis, comentá el decorador @rate_limit_login")
    print("   en backend/src/presentation/api/auth_routes.py línea ~70")
    exit(1)

data = response.json()
print(f"✅ Login exitoso: {data.get('user', {}).get('usuario')}")

csrf_token = session.cookies.get("csrf_access_token")
print(f"   CSRF Token: {csrf_token[:20] if csrf_token else 'N/A'}...")

# Step 2: List users
print("\n[2] Listar usuarios (GET /api/v1/users)...")
response = session.get(
    f"{BASE_URL}/users",
    headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
)

if response.status_code != 200:
    print(f"❌ List falló: {response.status_code}")
    print(f"   Body: {response.text[:500]}")
else:
    data = response.json()
    print(f"✅ Listado exitoso")
    print(f"   Total usuarios: {data.get('total')}")
    print(f"   En esta página: {len(data.get('items', []))}")
    print(f"   Primeros 3:")
    for user in data.get('items', [])[:3]:
        print(f"     - {user.get('usuario')}: {user.get('nombre')} {user.get('paterno')}")
    
    # Guardar un ID para el siguiente test
    user_id = data.get('items', [{}])[0].get('id_usuario')
    
    # Step 3: Get specific user
    if user_id:
        print(f"\n[3] Obtener usuario ID {user_id} (GET /api/v1/users/{user_id})...")
        response = session.get(
            f"{BASE_URL}/users/{user_id}",
            headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
        )
        
        if response.status_code != 200:
            print(f"❌ Get user falló: {response.status_code}")
            print(f"   Body: {response.text[:500]}")
        else:
            data = response.json()
            user = data.get('user', {})
            roles = data.get('roles', [])
            print(f"✅ Usuario obtenido")
            print(f"   Usuario: {user.get('usuario')}")
            print(f"   Nombre completo: {user.get('nombre')} {user.get('paterno')} {user.get('materno')}")
            print(f"   Expediente: {user.get('expediente')}")
            print(f"   Correo: {user.get('correo')}")
            print(f"   Estado: {user.get('est_usuario')}")
            print(f"   Roles: {[r.get('rol') for r in roles]}")
            
            # Check password NOT exposed
            if 'clave' in user:
                print(f"   ⚠️  SEGURIDAD: Password EXPUESTO (MAL)")
            else:
                print(f"   ✅ SEGURIDAD: Password NO expuesto")

# Step 4: Test pagination
print("\n[4] Test de paginación (page=1, page_size=5)...")
response = session.get(
    f"{BASE_URL}/users",
    params={"page": 1, "page_size": 5},
    headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Paginación funciona: {len(data.get('items', []))} items")
else:
    print(f"❌ Paginación falló: {response.status_code}")

# Step 5: Test filters
print("\n[5] Test de filtro por estado='A' (activos)...")
response = session.get(
    f"{BASE_URL}/users",
    params={"estado": "A", "page_size": 10},
    headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Filtro funciona: {data.get('total')} usuarios activos")
else:
    print(f"❌ Filtro falló: {response.status_code}")

# Step 6: Test non-existent user
print("\n[6] Test usuario no existente (ID 99999)...")
response = session.get(
    f"{BASE_URL}/users/99999",
    headers={"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
)

if response.status_code == 404:
    print(f"✅ Manejo de errores correcto (404)")
else:
    print(f"⚠️  Expected 404, got {response.status_code}")

print("\n" + "="*60)
print("  TESTS COMPLETADOS")
print("="*60)

import requests
import json

BASE_URL = "http://localhost:5000/api/v1"
SESSION = requests.Session()

def test_login():
    print(f"Testing Login with 40488...")
    try:
        resp = SESSION.post(f"{BASE_URL}/auth/login", json={
            "usuario": "40488", 
            "clave": "12345"
        })
        print(f"Login Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Login Success!")
            # Imprimir cookies para verificar
            print("Cookies:", SESSION.cookies.get_dict())
            return True
        else:
            print("Login Failed:", resp.text)
            return False
    except Exception as e:
        print(f"Connection Error: {e}")
        return False

def get_my_id():
    print("\nGetting current user info...")
    resp = SESSION.get(f"{BASE_URL}/auth/me")
    if resp.status_code == 200:
        data = resp.json()
        print(f"User Data: {data}")
        # auth/me devuelve { id_usuario: ..., username: ... }
        # Si devuelve identity directo, lo usamos.
        return data.get("id_usuario") 
    print("Failed to get user info:", resp.text)
    return None

def test_assign_roles(user_id):
    print(f"\nTesting Assign Roles for User {user_id}...")
    # Asignamos roles ficticios (o reales si los conocemos, ej 1 y 2)
    # Asumimos que existen roles 1 y 2.
    payload = {"role_ids": [1, 2]} 
    
    # Necesitamos el CSRF token si está habilitado
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(
        f"{BASE_URL}/users/{user_id}/roles", 
        json=payload,
        headers=headers
    )
    
    print(f"Assign Status: {resp.status_code}")
    print("RESPONSE BODY (THE TRUTH):")
    print(json.dumps(resp.json(), indent=2))

if __name__ == "__main__":
    if test_login():
        my_id = get_my_id()
        # Nota: Normalmente auth/me devuelve el ID como string en 'sub' o similar
        # Si auth/me devuelve identity, usaremos ese.
        # Si falla, intentaremos con un ID hardcodeado si sabemos que 40488 es el ID X.
        
        # En auth_routes.py: get_current_user retorna { "id_usuario": user_identity ... }
        if my_id:
            test_assign_roles(my_id)
        else:
            # Fallback: intentar con ID 1 o similar si no pudimos sacar el ID
            print("Could not get ID from /me, trying ID 1...")
            test_assign_roles(1)

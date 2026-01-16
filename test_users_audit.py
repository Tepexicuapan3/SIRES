import requests
import json
import time

BASE_URL = "http://localhost:5000/api/v1"
SESSION = requests.Session()

def login():
    print(">>> LOGIN...")
    resp = SESSION.post(f"{BASE_URL}/auth/login", json={"usuario": "40488", "clave": "12345"})
    return resp.status_code == 200

def audit_list_users():
    print("\n>>> AUDIT: GET /users (List)")
    resp = SESSION.get(f"{BASE_URL}/users", params={"page": 1, "page_size": 1})
    if resp.status_code == 200:
        data = resp.json()
        print("Structure keys:", list(data.keys()))
        if "items" in data and len(data["items"]) > 0:
            print("User Item Sample:")
            print(json.dumps(data["items"][0], indent=2))
        else:
            print("No items found to audit user structure.")
    else:
        print(f"Failed: {resp.status_code}")

def audit_create_user():
    print("\n>>> AUDIT: POST /users (Create)")
    # Usuario random para evitar colisiones
    ts = int(time.time())
    payload = {
        "usuario": f"test{ts}",
        "expediente": str(ts)[-8:], # 8 dígitos
        "nombre": "Test",
        "paterno": "Audit",
        "materno": "User",
        "correo": f"test{ts}@audit.com",
        "id_rol": 1
    }
    
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(f"{BASE_URL}/users", json=payload, headers=headers)
    if resp.status_code == 201:
        data = resp.json()
        print("Create Response:")
        print(json.dumps(data, indent=2))
        
        # Retornamos ID para usar en detalle y update
        # Dependiendo de la estructura, puede estar en data['user']['id_usuario']
        if "user" in data:
            return data["user"].get("id_usuario")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")
    return None

def audit_user_detail(user_id):
    print(f"\n>>> AUDIT: GET /users/{user_id} (Detail)")
    resp = SESSION.get(f"{BASE_URL}/users/{user_id}")
    if resp.status_code == 200:
        data = resp.json()
        print("Detail Response:")
        print(json.dumps(data, indent=2))
    else:
        print(f"Failed: {resp.status_code}")

def audit_update_user(user_id):
    print(f"\n>>> AUDIT: PATCH /users/{user_id} (Update)")
    payload = {"nombre": "Updated Name"}
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.patch(f"{BASE_URL}/users/{user_id}", json=payload, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print("Update Response:")
        print(json.dumps(data, indent=2))
    else:
        print(f"Failed: {resp.status_code}")

if __name__ == "__main__":
    if login():
        audit_list_users()
        new_id = audit_create_user()
        if new_id:
            audit_user_detail(new_id)
            audit_update_user(new_id)

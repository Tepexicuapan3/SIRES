import requests
import json
import time

BASE_URL = "http://localhost:5000/api/v1"
SESSION = requests.Session()

def login():
    print(">>> LOGIN...")
    resp = SESSION.post(f"{BASE_URL}/auth/login", json={"usuario": "40488", "clave": "12345"})
    return resp.status_code == 200

def audit_list_roles():
    print("\n>>> AUDIT: GET /roles (List)")
    # El endpoint soporta ?include_inactive=true
    resp = SESSION.get(f"{BASE_URL}/roles", params={"include_inactive": "true"})
    if resp.status_code == 200:
        data = resp.json()
        print("List Structure:", list(data.keys()))
        if "roles" in data and len(data["roles"]) > 0:
            print("Role Item Sample:")
            print(json.dumps(data["roles"][0], indent=2))
    else:
        print(f"Failed: {resp.status_code}")

def audit_create_role():
    print("\n>>> AUDIT: POST /roles (Create)")
    ts = int(time.time())
    payload = {
        "rol": f"TEST_ROLE_{ts}",
        "desc_rol": "Rol de prueba auditoria",
        "tp_rol": "X", # Ajustado según auditoría
        "landing_route": "/test",
        "priority": 100,
        "is_admin": False
    }
    
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(f"{BASE_URL}/roles", json=payload, headers=headers)
    if resp.status_code == 201:
        data = resp.json()
        print("Create Response:")
        print(json.dumps(data, indent=2))
        return data.get("id_rol")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")
    return None

def audit_role_detail(role_id):
    print(f"\n>>> AUDIT: GET /roles/{role_id} (Detail)")
    resp = SESSION.get(f"{BASE_URL}/roles/{role_id}")
    if resp.status_code == 200:
        data = resp.json()
        print("Detail Response:")
        print(json.dumps(data, indent=2))
    else:
        print(f"Failed: {resp.status_code}")

def audit_update_role(role_id):
    print(f"\n>>> AUDIT: PUT /roles/{role_id} (Update)")
    payload = {"desc_rol": "Updated Description"}
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.put(f"{BASE_URL}/roles/{role_id}", json=payload, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print("Update Response:")
        print(json.dumps(data, indent=2))
    else:
        print(f"Failed: {resp.status_code}")

def audit_delete_role(role_id):
    print(f"\n>>> AUDIT: DELETE /roles/{role_id} (Delete)")
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.delete(f"{BASE_URL}/roles/{role_id}", headers=headers)
    print(f"Delete Status: {resp.status_code}")
    # 204 No Content no tiene body

if __name__ == "__main__":
    if login():
        audit_list_roles()
        new_id = audit_create_role()
        if new_id:
            audit_role_detail(new_id)
            audit_update_role(new_id)
            audit_delete_role(new_id)

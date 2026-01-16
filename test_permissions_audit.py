import requests
import json
import time

BASE_URL = "http://localhost:5000/api/v1"
SESSION = requests.Session()

def login():
    print(">>> LOGIN...")
    resp = SESSION.post(f"{BASE_URL}/auth/login", json={"usuario": "40488", "clave": "12345"})
    return resp.status_code == 200

def audit_list_permissions():
    print("\n>>> AUDIT: GET /permissions")
    resp = SESSION.get(f"{BASE_URL}/permissions")
    if resp.status_code == 200:
        data = resp.json()
        print("Keys:", list(data.keys()))
        if "permissions" in data and len(data["permissions"]) > 0:
            print("Permission Sample:")
            print(json.dumps(data["permissions"][0], indent=2))
    else:
        print(f"Failed: {resp.status_code}")

def audit_create_permission():
    print("\n>>> AUDIT: POST /permissions (Create)")
    ts = int(time.time())
    payload = {
        "code": f"test:action_{ts}",
        "resource": "test",
        "action": f"action_{ts}",
        "description": "Permiso de prueba para auditoria",
        "category": "AUDIT"
    }
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(f"{BASE_URL}/permissions/", json=payload, headers=headers)
    if resp.status_code == 201:
        data = resp.json()
        print("Create Response:")
        print(json.dumps(data, indent=2))
        # Retorna { message, permission }
        return data.get("permission", {}).get("id_permission")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")
    return None

def audit_add_override(user_id):
    print(f"\n>>> AUDIT: POST /permissions/users/{user_id}/overrides")
    payload = {
        "permission_code": "expedientes:delete",
        "effect": "DENY",
        "expires_at": "2026-12-31T23:59:59"
    }
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(f"{BASE_URL}/permissions/users/{user_id}/overrides", json=payload, headers=headers)
    if resp.status_code == 201:
        print("Override Added:")
        print(json.dumps(resp.json(), indent=2))
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    if login():
        audit_list_permissions()
        perm_id = audit_create_permission()
        # Probar override con el usuario actual (id 1)
        audit_add_override(1)

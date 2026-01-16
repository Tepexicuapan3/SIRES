import requests
import json

BASE_URL = "http://localhost:5000/api/v1"
SESSION = requests.Session()

def test_login():
    resp = SESSION.post(f"{BASE_URL}/auth/login", json={"usuario": "40488", "clave": "12345"})
    return resp.status_code == 200

def test_set_primary(user_id):
    print(f"\nTesting Set Primary Role 1 for User {user_id}...")
    payload = {"role_id": 1}
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.put(
        f"{BASE_URL}/users/{user_id}/roles/primary", 
        json=payload,
        headers=headers
    )
    
    print(f"Set Primary Status: {resp.status_code}")
    print("RESPONSE BODY (THE TRUTH):")
    print(json.dumps(resp.json(), indent=2))

if __name__ == "__main__":
    if test_login():
        test_set_primary(1)


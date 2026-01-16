import requests
import json

BASE_URL = "http://localhost:5000/api/v1"
SESSION = requests.Session()

def audit_login():
    print(">>> AUDIT: POST /auth/login")
    try:
        resp = SESSION.post(f"{BASE_URL}/auth/login", json={
            "usuario": "40488", 
            "clave": "12345"
        })
        
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("Login Response Body:")
            print(json.dumps(data, indent=2))
            
            # Verificar cookies
            print("Cookies received:", list(SESSION.cookies.get_dict().keys()))
            return True
        else:
            print("Login Failed:", resp.text)
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def audit_me():
    print("\n>>> AUDIT: GET /auth/me")
    resp = SESSION.get(f"{BASE_URL}/auth/me")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Me Response Body:")
        print(json.dumps(resp.json(), indent=2))
    else:
        print("Failed:", resp.text)

def audit_refresh():
    print("\n>>> AUDIT: POST /auth/refresh")
    # Necesitamos el CSRF token de la cookie para el refresh si aplica
    # Nota: El endpoint de refresh a veces tiene lógica especial para CSRF
    csrf_token = SESSION.cookies.get("csrf_refresh_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(f"{BASE_URL}/auth/refresh", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Refresh Response Body:")
        print(json.dumps(resp.json(), indent=2))
        print("New Cookies:", list(resp.cookies.get_dict().keys()))
    else:
        print("Failed:", resp.text)

def audit_logout():
    print("\n>>> AUDIT: POST /auth/logout")
    csrf_token = SESSION.cookies.get("csrf_access_token")
    headers = {"X-CSRF-TOKEN": csrf_token} if csrf_token else {}
    
    resp = SESSION.post(f"{BASE_URL}/auth/logout", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Logout Response Body:")
        print(json.dumps(resp.json(), indent=2))
    else:
        print("Failed:", resp.text)

if __name__ == "__main__":
    if audit_login():
        audit_me()
        audit_refresh()
        audit_logout()

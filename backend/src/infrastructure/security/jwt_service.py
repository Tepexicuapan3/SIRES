"""# src/infrastructure/security/jwt_service.py
#SEGUNDA VERSION
import os
import jwt
from datetime import datetime, timedelta, timezone

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret")
JWT_ALGO = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 60*30))   # default 30 min
RESET_EXPIRES = int(os.getenv("JWT_RESET_EXPIRES", 60*5))          # 5 min
PREAUTH_EXPIRES = int(os.getenv("JWT_PREAUTH_EXPIRES", 60*15))     # 15 min
REFRESH_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 60*60*24*7))  # 7 days

def _now_ts():
    return datetime.now(timezone.utc)

def generate_access_token(user_payload: dict, scope: str = "full_access", expires_seconds: int = None) -> str:
    if expires_seconds is None:
        if scope == "password_reset":
            expires_seconds = RESET_EXPIRES
        elif scope == "pre_auth_onboarding":
            expires_seconds = PREAUTH_EXPIRES
        else:
            expires_seconds = ACCESS_EXPIRES

    iat = _now_ts()
    exp = iat + timedelta(seconds=expires_seconds)
    payload = {
        "sub": user_payload.get("id_usuario"),
        "username": user_payload.get("usuario"),
        "scope": scope,
        "iat": int(iat.timestamp()),
        "exp": int(exp.timestamp())
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    # PyJWT >=2.0 returns str; if bytes, decode
    if isinstance(token, bytes):
        token = token.decode()
    return token

def generate_refresh_token(user_payload: dict) -> str:
    iat = _now_ts()
    exp = iat + timedelta(seconds=REFRESH_EXPIRES)
    payload = {
        "sub": user_payload.get("id_usuario"),
        "username": user_payload.get("usuario"),
        "scope": "refresh",
        "iat": int(iat.timestamp()),
        "exp": int(exp.timestamp())
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    if isinstance(token, bytes):
        token = token.decode()
    return token

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload
    except Exception:
        return None

"""
#PRIMERA VERSION
import jwt
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET_KEY")
ACCESS_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))
REFRESH_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 604800))


def generate_access_token(user):
    payload = {
        'user_id': user["id_usuario"],
        'username': user["usuario"],
        'roles': user["roles"],
        'expediente': user["expediente"],
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(seconds=ACCESS_EXPIRES),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def generate_refresh_token(user):
    payload = {
        'user_id': user["id_usuario"],
        'username': user["usuario"],
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(seconds=REFRESH_EXPIRES),
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

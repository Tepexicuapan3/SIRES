# src/infrastructure/security/jwt_service.py
#SEGUNDA VERSION
import os
import jwt #generar y decodificar tokens en JWT
from datetime import datetime, timedelta, timezone #hora, fecha y zona horaria

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret") #clave para firmar tokens
JWT_ALGO = os.getenv("JWT_ALGORITHM", "HS256") #HS256 para firma del token
ACCESS_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 60*30))   # default 30 min
RESET_EXPIRES = int(os.getenv("JWT_RESET_EXPIRES", 60*5))          # 5 min
PREAUTH_EXPIRES = int(os.getenv("JWT_PREAUTH_EXPIRES", 60*15))     # 15 min
REFRESH_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 60*60*24*7))  # 7 days

def _now_ts():
    return datetime.now(timezone.utc) #fecha y hora actual en UTC

#genera access token
def generate_access_token(user_payload: dict, scope: str = "full_access", expires_seconds: int = None) -> str:
    if expires_seconds is None:
        if scope == "password_reset": #define el tiempo de expiracion
            expires_seconds = RESET_EXPIRES
        elif scope == "pre_auth_onboarding": 
            expires_seconds = PREAUTH_EXPIRES
        else:
            expires_seconds = ACCESS_EXPIRES

    iat = _now_ts() # fecha de creacion el token 
    exp = iat + timedelta(seconds=expires_seconds) #fecha de espiracion
    payload = {
        "sub": user_payload.get("id_usuario"), #identificador del usuario
        "username": user_payload.get("usuario"), #nombre del usuario 
        "scope": scope,   #alcance del token
        "iat": int(iat.timestamp()), #fecha de creacion
        "exp": int(exp.timestamp()) #expiracion
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO) #se genera el token firmado
    
    # PyJWT retorna en string
    if isinstance(token, bytes):
        token = token.decode() #si esta en bytes se convierte a string
    return token

#se genera el refresh token
def generate_refresh_token(user_payload: dict) -> str:
    iat = _now_ts() #fecha de creacion
    exp = iat + timedelta(seconds=REFRESH_EXPIRES) #fecha de expiracion
    payload = {
        "sub": user_payload.get("id_usuario"), #identificador del usuario
        "username": user_payload.get("usuario"), #nombre del usuario
        "scope": "refresh", #alcanse del token (especifico para refresh)
        "iat": int(iat.timestamp()), #fecha de creacion
        "exp": int(exp.timestamp()) #fecha de espiracion
    }
    #se genera el refresh token firmado
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    if isinstance(token, bytes):
        token = token.decode()  #si esta en bytes se convierte a string
    return token

#decodifica y valida el token
def decode_token(token: str):
    try:
        #intenta decodificar el token con la clave y algoritmo
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload #si es valido retorna el payload
    except Exception:
        return None #en caso que el token no sea valido o expirado

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
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")"""

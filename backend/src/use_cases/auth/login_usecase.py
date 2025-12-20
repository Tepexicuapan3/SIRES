# src/use_cases/auth/login_usecase.py
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.repositories.det_user_repository import DetUserRepository
from werkzeug.security import check_password_hash
from src.infrastructure.security.jwt_service import generate_access_token, generate_refresh_token
from datetime import datetime, timezone, timedelta

from src.infrastructure.audit.access_log_repository import AccessLogRepository

class LoginUseCase:
    def __init__(self):
        self.user_repo = UserRepository()
        self.det_repo = DetUserRepository()
        self.access_repo = AccessLogRepository()

    def execute(self, username: str, password: str, client_ip: str):
        user = self.user_repo.get_user_by_username(username)
        if not user:
            return None, "INVALID_CREDENTIALS"

        det = self.det_repo.get_det_by_userid(user["id_usuario"])
        if not det:
            return None, "SERVER_ERROR"

        # ============================
        # 1. REVISAR SI ESTA BLOQUEADO
        # ============================
        fecha_bloqueo = det.get("fecha_bloqueo")

        if fecha_bloqueo:
            desbloqueo = fecha_bloqueo + timedelta(minutes=5)

            if datetime.now() < desbloqueo:
                return None, "USER_LOCKED"
            else:
                # bloqueo expirado → limpiar estado
                self.det_repo.reset_lock_status(det["id_detusr"])
                # recargar datos después del reset
                det = self.det_repo.get_det_by_userid(user["id_usuario"])

        # ============================
        # 2. VALIDAR CONTRASEÑA
        # ============================
        if not check_password_hash(user["clave"], password):

            # fallos actuales
            intentos = det.get("intentos_fallidos", 0)

            # incrementa internamente +1 (corregido en el repo)
            self.det_repo.increment_failed_attempts(det["id_detusr"], intentos)

            return None, "INVALID_CREDENTIALS"

        # ============================
        # *** BLOQUEO AÚN VIGENTE ***
        # Aunque la contraseña sea correcta
        # ============================
        det = self.det_repo.get_det_by_userid(user["id_usuario"])  # refrescar
        fecha_bloqueo = det.get("fecha_bloqueo")

        if fecha_bloqueo:
            desbloqueo = fecha_bloqueo + timedelta(minutes=5)
            if datetime.now() < desbloqueo:
                return None, "USER_LOCKED"

        # ============================
        # 3. LOGIN EXITOSO
        # ============================
        self.det_repo.update_on_success_login(det["id_detusr"], client_ip)

        # Registrar acceso
        self.access_repo.registrar_acceso(user["id_usuario"], client_ip, "EN SESIÓN")

        # Verificar si requiere onboarding (cambio de contrasena obligatorio)
        requires_onboarding = det.get("cambiar_clave") == "T"

        roles = self.user_repo.get_user_roles(user["id_usuario"])
        
        if requires_onboarding:
            # ============================
            # FLUJO DE ONBOARDING
            # Token limitado, sin refresh, expiracion corta
            # ============================
            onboarding_payload = {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"]
            }
            
            # Token con scope limitado para onboarding
            access = generate_access_token(onboarding_payload, scope="onboarding")
            
            result = {
                "access_token": access,
                "refresh_token": None,  # Sin refresh token hasta completar
                "token_type": "Bearer",
                "expires_in": 600,  # 10 minutos para completar onboarding
                "user": {
                    "id_usuario": user["id_usuario"],
                    "usuario": user["usuario"],
                    "nombre": user["nombre"],
                    "paterno": user.get("paterno", ""),
                    "materno": user.get("materno", ""),
                    "nombre_completo": f"{user['nombre']} {user.get('paterno', '')} {user.get('materno', '')}".strip(),
                    "expediente": user.get("expediente", ""),
                    "curp": "",
                    "correo": user.get("correo", ""),
                    "ing_perfil": "Nuevo Usuario",
                    "roles": [],  # Sin roles hasta completar onboarding
                    "must_change_password": True
                }
            }
        else:
            # ============================
            # FLUJO NORMAL
            # Token completo con refresh
            # ============================
            user_payload = {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "nombre": user["nombre"],
                "paterno": user.get("paterno"),
                "materno": user.get("materno"),
                "correo": user.get("correo"),
                "expediente": user.get("expediente"),
                "roles": roles
            }

            access = generate_access_token(user_payload, scope="full_access")
            refresh = generate_refresh_token(user_payload)

            result = {
                "access_token": access,
                "refresh_token": refresh,
                "token_type": "Bearer",
                "expires_in": 3600,
                "user": {
                    "id_usuario": user_payload["id_usuario"],
                    "usuario": user_payload["usuario"],
                    "nombre": user_payload["nombre"],
                    "paterno": user_payload.get("paterno", ""),
                    "materno": user_payload.get("materno", ""),
                    "nombre_completo": f"{user['nombre']} {user.get('paterno', '')} {user.get('materno', '')}".strip(),
                    "expediente": user.get("expediente", ""),
                    "curp": user.get("curp", ""),
                    "correo": user_payload.get("correo", ""),
                    "ing_perfil": "Usuario",
                    "roles": roles,
                    "must_change_password": False
                }
            }
        
        return result, None



"""from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.repositories.user_repository import DetUserRepository
from src.infrastructure.security.jwt_service import generate_access_token, generate_refresh_token
from werkzeug.security import check_password_hash
from datetime import datetime, timezone

class LoginUseCase:
    def __init__(self):
        self.user_repo = UserRepository()
        self.det_repo = DetUserRepository()

    def execute(self, username: str, password: str, client_ip: str):
        # 1. buscar usuario (sy_usuarios)
        user = self.user_repo.get_user_by_username(username)
        if not user:
            # no distinguir usuario inexistente / pass wrong -> generic
            return None, "INVALID_CREDENTIALS"

        # 2. cargar registro de det_usuarios
        det = self.det_repo.get_det_by_userid(user["id_usuario"])
        if not det:
            # si no existe registro det, considerarlo no bloqueado y crear/continue (opcional)
            # por ahora devolvemos error de servidor si falta detalle
            return None, "SERVER_ERROR"

        # 3. comprobar bloqueo
        if det.get("fecha_bloqueo"):
            try:
                fb = det["fecha_bloqueo"]
                # MySQL connector returns datetime; compare to now
                now = datetime.now(timezone.utc)
                # normalize fb to aware if needed (we assume db returns naive in local TZ)
                # For safety, compare as naive now:
                if fb and fb > datetime.now():
                    # still locked
                    return None, "USER_LOCKED"
            except Exception:
                pass

        # 4. verificar contraseña
        if not check_password_hash(user["clave"], password):
            # incrementar intentos
            self.det_repo.increment_failed_attempts(det["id_detusr"], det.get("intentos_fallidos", 0))
            return None, "INVALID_CREDENTIALS"

        # 5. contraseña correcta -> resetear contadores y actualizar conexiones e ip
        self.det_repo.update_on_success_login(det["id_detusr"], client_ip)

        # 6. obtener roles
        roles = self.user_repo.get_user_roles(user["id_usuario"])
        # inject roles into user dict to return
        user_payload = {
            "id_usuario": user["id_usuario"],
            "usuario": user["usuario"],
            "nombre": user["nombre"],
            "paterno": user.get("paterno"),
            "materno": user.get("materno"),
            "correo": user.get("correo"),
            "expediente": user.get("expediente"),
            "roles": roles
        }

        # 7. decide scope según cambiar_clave (T/N)
        cambiar = det.get("cambiar_clave")
        if cambiar == "T":
            # pre-auth onboarding: no roles in response (as requested)
            token = generate_access_token({"id_usuario": user["id_usuario"], "usuario": user["usuario"]},
                                          scope="pre_auth_onboarding")
            # return minimal user payload for frontend
            user_min = {
                "id": user["id_usuario"],
                "username": user["usuario"],
                "nombre": user["nombre"],
                "must_change_password": True,
                "roles": []
            }
            return {"access_token": token, "user": user_min}, None

        # 8. normal flow: create full access & refresh
        access = generate_access_token(user_payload, scope="full_access")
        refresh = generate_refresh_token(user_payload)

        # Optionally: persist refresh token in DB via AuthRepository (not shown here)
        result = {
            "access_token": access,
            "refresh_token": refresh,
            "user": {
                "id": user_payload["id_usuario"],
                "username": user_payload["usuario"],
                "nombre": user_payload["nombre"],
                "paterno": user_payload["paterno"],
                "materno": user_payload["materno"],
                "correo": user_payload["correo"],
                "roles": roles,
                "must_change_password": False
            }
        }
        return result, None """

"""from werkzeug.security import check_password_hash
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.jwt_service import (
    generate_access_token, generate_refresh_token
)
from src.infrastructure.security.aes_service import encrypt_token_aes
from src.infrastructure.audit.access_log_repository import AccessLogRepository


class LoginUseCase:

    def __init__(self):
        self.repo = UserRepository()
        self.audit = AccessLogRepository()

    def execute(self, username, password, client_ip):

        user = self.repo.get_user_by_username(username)

        # Usuario no encontrado
        if not user:
            return None, "INVALID_CREDENTIALS"

        # Usuario inactivo
        if user["est_usuario"] != "A":
            return None, "USER_INACTIVE"

        # Contraseña incorrecta
        if not check_password_hash(user["clave"], password):
            return None, "INVALID_CREDENTIALS"

        # Obtener roles
        roles = self.repo.get_user_roles(user["id_usuario"])
        user["roles"] = roles

        # Eliminar clave antes de enviar respuesta
        if "clave" in user:
            del user["clave"]

        # Crear tokens
        access = generate_access_token(user)
        refresh = generate_refresh_token(user)

        # Registrar auditoría
        self.audit.registrar_acceso(user["id_usuario"], client_ip, "LOGIN")

        return {
            "access_token": encrypt_token_aes(access),
            "refresh_token": encrypt_token_aes(refresh),
            "user": user
        }, None
"""

"""
from werkzeug.security import check_password_hash
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.jwt_service import (
    generate_access_token, generate_refresh_token
)
from src.infrastructure.security.aes_service import encrypt_token_aes
from src.infrastructure.audit.access_log_repository import AccessLogRepository


class LoginUseCase:

    def __init__(self):
        self.repo = UserRepository()
        self.audit = AccessLogRepository()

    def execute(self, username, password, client_ip):
        user = self.repo.get_user_by_username(username)
        if not user:
            return None, "INVALID_CREDENTIALS"

        if not check_password_hash(user["clave"], password):
            return None, "INVALID_CREDENTIALS"

        roles = self.repo.get_user_roles(user["id_usuario"])
        user["roles"] = roles

        access = generate_access_token(user)
        refresh = generate_refresh_token(user)

        self.audit.registrar_acceso(user["id_usuario"], client_ip, "LOGIN")

        return {
            "access_token": encrypt_token_aes(access),
            "refresh_token": encrypt_token_aes(refresh),
            "user": user
        }, None
"""
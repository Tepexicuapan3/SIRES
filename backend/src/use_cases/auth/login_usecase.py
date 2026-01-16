# src/use_cases/auth/login_usecase.py
"""LoginUseCase - Valida credenciales y retorna datos del usuario.

IMPORTANTE: Este use case NO genera tokens JWT.
Los tokens son generados por el route usando Flask-JWT-Extended
para mantener consistencia con el sistema de cookies HttpOnly.
"""

from datetime import datetime, timedelta

from src.infrastructure.audit.access_log_repository import AccessLogRepository
from src.infrastructure.authorization.authorization_service import \
    authorization_service
from src.infrastructure.repositories.det_user_repository import \
    DetUserRepository
from src.infrastructure.repositories.user_repository import UserRepository
from werkzeug.security import check_password_hash


class LoginUseCase:
    def __init__(self):
        self.user_repo = UserRepository()
        self.det_repo = DetUserRepository()
        self.access_repo = AccessLogRepository()

    def execute(self, username: str, password: str, client_ip: str):
        """Valida credenciales y retorna datos del usuario.

        Returns:
            tuple: (result_dict, error_code)
            - result_dict contiene: user (datos), requires_onboarding (bool)
            - error_code: None si éxito, string con código de error si falla
        """
        user = self.user_repo.get_user_by_username(username)
        if not user:
            # No distinguimos entre user inexistente/clave incorrecta
            return None, "INVALID_CREDENTIALS"

        # ============================
        # VALIDACIÓN DE ESTADO DEL USUARIO
        # ============================
        # Verificar que el usuario esté activo antes de validar contraseña
        # para prevenir que usuarios dados de baja accedan al sistema
        if user.get("est_usuario") != "A":
            return None, "USER_INACTIVE"

        det = self.det_repo.get_det_by_userid(user["id_usuario"])
        if not det:
            return None, "SERVER_ERROR"

        # ============================
        # 1. REVISAR SI ESTÁ BLOQUEADO
        # ============================
        fecha_bloqueo = det.get("fecha_bloqueo")
        if fecha_bloqueo:
            desbloqueo = fecha_bloqueo + timedelta(minutes=5)
            if datetime.now() < desbloqueo:
                return None, "USER_LOCKED"

            # bloqueo expirado → limpiar estado
            self.det_repo.reset_lock_status(det["id_detusr"])
            det = self.det_repo.get_det_by_userid(user["id_usuario"])

        # ============================
        # 2. VALIDAR CONTRASEÑA
        # ============================
        if not check_password_hash(user["clave"], password):
            intentos = det.get("intentos_fallidos", 0)
            self.det_repo.increment_failed_attempts(det["id_detusr"], intentos)
            return None, "INVALID_CREDENTIALS"

        # ============================
        # 3. BLOQUEO AÚN VIGENTE (inclusive si la clave es correcta)
        # ============================
        det = self.det_repo.get_det_by_userid(user["id_usuario"])  # refrescar
        fecha_bloqueo = det.get("fecha_bloqueo")
        if fecha_bloqueo:
            desbloqueo = fecha_bloqueo + timedelta(minutes=5)
            if datetime.now() < desbloqueo:
                return None, "USER_LOCKED"

        # ============================
        # 4. LOGIN EXITOSO
        # ============================
        self.det_repo.update_on_success_login(det["id_detusr"], client_ip)

        # Auditoría
        self.access_repo.registrar_acceso(user["id_usuario"], client_ip, "EN SESIÓN")

        # Verificar si requiere onboarding (cambio de contraseña obligatorio)
        requires_onboarding = det.get("cambiar_clave") == "T"

        # Obtener roles (vacío si requiere onboarding)
        roles = [] if requires_onboarding else self.user_repo.get_user_roles(user["id_usuario"])

        # Obtener permisos y landing route (solo si NO requiere onboarding)
        permissions = []
        landing_route = "/dashboard"  # default
        is_admin = False
        
        if not requires_onboarding:
            auth_data = authorization_service.get_user_permissions(user["id_usuario"])
            permissions = auth_data.get("permissions", [])
            landing_route = auth_data.get("landing_route", "/dashboard")
            is_admin = auth_data.get("is_admin", False)

        user_data = {
            "id_usuario": user["id_usuario"],
            "usuario": user["usuario"],
            "nombre": user["nombre"],
            "paterno": user.get("paterno", ""),
            "materno": user.get("materno", ""),
            "nombre_completo": f"{user['nombre']} {user.get('paterno', '')} {user.get('materno', '')}".strip(),
            "expediente": user.get("expediente", ""),
            "id_clin": user.get("id_clin"),
            "correo": user.get("correo", ""),
            "ing_perfil": "Nuevo Usuario" if requires_onboarding else "Usuario",
            "roles": roles,
            "permissions": permissions,
            "landing_route": landing_route,
            "is_admin": is_admin,
            "must_change_password": requires_onboarding,
        }

        return {
            "user": user_data,
            "requires_onboarding": requires_onboarding,
        }, None

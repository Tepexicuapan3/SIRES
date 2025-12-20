# src/use_cases/auth/reset_password_usecase.py

import re
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.repositories.det_user_repository import DetUserRepository
from src.infrastructure.security.password_hasher import PasswordHasher
from src.infrastructure.security.jwt_service import generate_access_token, generate_refresh_token


class ResetPasswordUseCase:
    """
    Caso de uso para restablecer la contraseña de un usuario.
    
    Valida la fuerza de la contraseña y genera nuevos tokens
    para que el usuario quede logueado automáticamente.
    """

    def __init__(self):
        self.user_repo = UserRepository()
        self.det_repo = DetUserRepository()

    def execute(self, user_id: int, new_password: str, client_ip: str = ""):
        """
        Restablece la contraseña del usuario.
        
        Args:
            user_id: ID del usuario (extraído del JWT)
            new_password: Nueva contraseña en texto plano
            client_ip: IP del cliente para auditoría
            
        Returns:
            tuple: (result_dict, error_code) donde error_code es None si éxito
        """
        
        # ============================
        # 1. VALIDAR CONTRASEÑA
        # ============================
        password_error = self._validate_password_strength(new_password)
        if password_error:
            return None, password_error
        
        # ============================
        # 2. OBTENER USUARIO
        # ============================
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"
        
        # ============================
        # 3. ACTUALIZAR CONTRASEÑA
        # ============================
        hashed_password = PasswordHasher.hash_password(new_password)
        updated = self.user_repo.update_password_by_id(user_id, hashed_password)
        
        if not updated:
            return None, "PASSWORD_UPDATE_FAILED"
        
        # ============================
        # 4. OBTENER ROLES Y DATOS COMPLETOS
        # ============================
        roles = self.user_repo.get_user_roles(user_id)
        det = self.det_repo.get_det_by_userid(user_id)
        
        # ============================
        # 5. GENERAR NUEVOS TOKENS (full_access)
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
        
        access_token = generate_access_token(user_payload, scope="full_access")
        refresh_token = generate_refresh_token(user_payload)
        
        # ============================
        # 6. CONSTRUIR RESPUESTA (LoginResponse)
        # ============================
        result = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "user": {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "nombre": user["nombre"],
                "paterno": user.get("paterno", ""),
                "materno": user.get("materno", ""),
                "nombre_completo": f"{user['nombre']} {user.get('paterno', '')} {user.get('materno', '')}".strip(),
                "expediente": user.get("expediente", ""),
                "curp": user.get("curp", ""),
                "correo": user.get("correo", ""),
                "ing_perfil": "Usuario",
                "roles": roles,
                "must_change_password": False
            }
        }
        
        return result, None
    
    def _validate_password_strength(self, password: str) -> str | None:
        """
        Valida que la contraseña cumpla con los requisitos de seguridad.
        
        Returns:
            str | None: Código de error si falla, None si es válida
        """
        if not password:
            return "PASSWORD_REQUIRED"
        
        if len(password) < 8:
            return "PASSWORD_TOO_SHORT"
        
        if not re.search(r"[A-Z]", password):
            return "PASSWORD_NO_UPPERCASE"
        
        if not re.search(r"[0-9]", password):
            return "PASSWORD_NO_NUMBER"
        
        if not re.search(r"[^a-zA-Z0-9]", password):
            return "PASSWORD_NO_SPECIAL"
        
        return None

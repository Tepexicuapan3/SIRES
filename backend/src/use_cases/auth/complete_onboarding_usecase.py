# src/use_cases/auth/complete_onboarding_usecase.py

"""
Caso de uso para completar el proceso de onboarding de un usuario nuevo.

El onboarding incluye:
1. Aceptacion de terminos y condiciones
2. Cambio obligatorio de contrasena
3. Generacion de tokens con acceso completo

Seguridad:
- El user_id se obtiene del JWT, NO del body
- Se valida que el token tenga scope 'onboarding'
- Se valida fuerza de contrasena en backend
- Se generan nuevos tokens con scope 'full_access'
"""

import re
from src.infrastructure.repositories.det_user_repository import DetUserRepository
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.password_hasher import PasswordHasher
from src.infrastructure.security.jwt_service import generate_access_token, generate_refresh_token


class CompleteOnboardingUseCase:

    # Requisitos de contrasena (deben coincidir con frontend)
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REGEX_UPPER = r'[A-Z]'
    PASSWORD_REGEX_NUMBER = r'[0-9]'
    PASSWORD_REGEX_SPECIAL = r'[^a-zA-Z0-9]'

    def __init__(self):
        self.det_user_repo = DetUserRepository()
        self.user_repo = UserRepository()

    def execute(self, user_id: int, new_password: str, terms_accepted: bool, client_ip: str):
        """
        Completa el proceso de onboarding:
        1. Valida que el usuario necesite onboarding
        2. Valida la aceptacion de terminos
        3. Valida y actualiza la contrasena
        4. Genera nuevos tokens con scope completo
        
        Args:
            user_id: ID del usuario (extraido del JWT, NO del body)
            new_password: Nueva contrasena en texto plano
            terms_accepted: Si acepto los terminos
            client_ip: IP del cliente
            
        Returns:
            tuple: (resultado, error)
            - Exito: (LoginResponse dict, None)
            - Error: (None, "ERROR_CODE")
        """
        
        # 1. Validar que se aceptaron los terminos
        if not terms_accepted:
            return None, "TERMS_NOT_ACCEPTED"
        
        # 2. Obtener datos del usuario en det_usuarios
        det = self.det_user_repo.get_det_by_userid(user_id)
        if not det:
            return None, "USER_NOT_FOUND"
        
        # 3. Validar que el usuario realmente necesite onboarding
        if det.get("cambiar_clave") != "T":
            return None, "ONBOARDING_NOT_REQUIRED"
        
        # 4. Validar fuerza de contrasena
        password_error = self._validate_password_strength(new_password)
        if password_error:
            return None, password_error
        
        # 5. Hashear y actualizar contrasena
        hashed_password = PasswordHasher.hash_password(new_password)
        password_updated = self.user_repo.update_password_by_id(user_id, hashed_password)
        
        if not password_updated:
            return None, "PASSWORD_UPDATE_FAILED"
        
        # 6. Actualizar estado de onboarding (terminos + cambiar_clave)
        onboarding_updated = self.det_user_repo.update_onboarding(
            id_usuario=user_id,
            terminos="T",
            cambiar_clave="F"
        )
        
        if not onboarding_updated:
            return None, "ONBOARDING_UPDATE_FAILED"
        
        # 7. Obtener datos completos del usuario para el token
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"
        
        roles = self.user_repo.get_user_roles(user_id)
        
        # 8. Generar payload para tokens
        user_payload = {
            "id_usuario": user_id,
            "usuario": user["usuario"],
            "nombre": user["nombre"],
            "paterno": user.get("paterno"),
            "materno": user.get("materno"),
            "correo": user.get("correo"),
            "expediente": user.get("expediente"),
            "roles": roles
        }
        
        # 9. Generar nuevos tokens con scope completo
        access_token = generate_access_token(user_payload, scope="full_access")
        refresh_token = generate_refresh_token(user_payload)
        
        # 10. Actualizar IP y timestamp de conexion
        self.det_user_repo.update_on_success_login(det["id_detusr"], client_ip)
        
        # 11. Construir nombre completo
        nombre_completo = " ".join(filter(None, [
            user.get("nombre", ""),
            user.get("paterno", ""),
            user.get("materno", "")
        ]))
        
        # 12. Retornar respuesta completa (mismo formato que login)
        result = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "user": {
                "id_usuario": user_id,
                "usuario": user["usuario"],
                "nombre": user.get("nombre", ""),
                "paterno": user.get("paterno", ""),
                "materno": user.get("materno", ""),
                "nombre_completo": nombre_completo,
                "expediente": user.get("expediente", ""),
                "curp": user.get("curp", ""),
                "correo": user.get("correo", ""),
                "ing_perfil": "Usuario",  # Podria venir de otra tabla
                "roles": roles,
                "must_change_password": False
            }
        }
        
        return result, None
    
    def _validate_password_strength(self, password: str):
        """
        Valida que la contrasena cumpla los requisitos de seguridad.
        
        Requisitos:
        - Minimo 8 caracteres
        - Al menos una mayuscula
        - Al menos un numero
        - Al menos un caracter especial
        
        Returns:
            str | None: Codigo de error si no cumple, None si es valida
        """
        if not password:
            return "PASSWORD_REQUIRED"
        
        if len(password) < self.PASSWORD_MIN_LENGTH:
            return "PASSWORD_TOO_SHORT"
        
        if not re.search(self.PASSWORD_REGEX_UPPER, password):
            return "PASSWORD_NO_UPPERCASE"
        
        if not re.search(self.PASSWORD_REGEX_NUMBER, password):
            return "PASSWORD_NO_NUMBER"
        
        if not re.search(self.PASSWORD_REGEX_SPECIAL, password):
            return "PASSWORD_NO_SPECIAL"
        
        return None

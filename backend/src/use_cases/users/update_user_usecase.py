# src/use_cases/users/update_user_usecase.py
import re
from src.infrastructure.repositories.user_repository import UserRepository


class UpdateUserUseCase:
    """
    Caso de uso: Actualizar datos de perfil de un usuario.
    
    Reglas de negocio:
    - Solo se pueden actualizar: nombre, paterno, materno, correo
    - El correo debe tener formato válido
    - El correo debe ser único (no usado por otro usuario)
    - Se actualiza audit trail (usr_modf, fch_modf)
    - Al menos un campo debe ser enviado
    
    Casos de error:
    - USER_NOT_FOUND: Usuario no existe
    - EMAIL_DUPLICATE: Email ya usado por otro usuario  
    - INVALID_EMAIL: Formato de email inválido
    - NO_FIELDS_TO_UPDATE: No se enviaron campos para actualizar
    - UPDATE_FAILED: Error al ejecutar la actualización
    """
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def execute(self, user_id: int, data: dict, modified_by: int):
        """
        Ejecuta la actualización del usuario.
        
        Args:
            user_id: ID del usuario a actualizar
            data: Diccionario con campos a actualizar (nombre, paterno, materno, correo)
            modified_by: ID del usuario que realiza la modificación
            
        Returns:
            (user_updated, error_code)
            - user_updated: dict con datos actualizados del usuario
            - error_code: None si OK, string con código de error si falló
        """
        try:
            # 1. Verificar que el usuario existe
            user = self.user_repo.get_user_by_id(user_id)
            if not user:
                return None, "USER_NOT_FOUND"
            
            # 2. Validar que se enviaron campos para actualizar
            allowed_fields = {"nombre", "paterno", "materno", "correo"}
            fields_to_update = {k: v for k, v in data.items() if k in allowed_fields}
            
            if not fields_to_update:
                return None, "NO_FIELDS_TO_UPDATE"
            
            # 3. Si se está actualizando el correo, validar formato y unicidad
            if "correo" in fields_to_update:
                email = fields_to_update["correo"]
                
                # Validar formato (regex simple)
                if not self._is_valid_email(email):
                    return None, "INVALID_EMAIL"
                
                # Verificar que no esté en uso por otro usuario
                if self.user_repo.email_exists_for_other_user(email, user_id):
                    return None, "EMAIL_DUPLICATE"
            
            # 4. Ejecutar update
            success = self.user_repo.update_user(user_id, fields_to_update, modified_by)
            
            if not success:
                return None, "UPDATE_FAILED"
            
            # 5. Retornar usuario actualizado
            updated_user = self.user_repo.get_user_by_id_with_audit(user_id)
            
            return updated_user, None
            
        except Exception as e:
            print(f"Error in UpdateUserUseCase: {e}")
            return None, "SERVER_ERROR"
    
    def _is_valid_email(self, email: str) -> bool:
        """
        Validación básica de formato de email.
        
        Args:
            email: Email a validar
            
        Returns:
            True si el formato es válido
        """
        if not email or len(email) > 255:
            return False
        
        # Regex simple para email
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

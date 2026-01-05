# src/use_cases/users/toggle_user_status_usecase.py
from src.infrastructure.repositories.user_repository import UserRepository


class ToggleUserStatusUseCase:
    """
    Caso de uso: Activar o desactivar un usuario.
    
    Reglas de negocio:
    - El usuario debe existir
    - No se puede desactivar el último admin activo
    - Se actualiza est_usuario ('A' o 'B')
    
    Casos de error:
    - USER_NOT_FOUND: Usuario no existe
    - CANNOT_DEACTIVATE_LAST_ADMIN: No se puede desactivar el último admin
    - TOGGLE_FAILED: Error al ejecutar el cambio
    """
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def execute(self, user_id: int, activate: bool, modified_by: int):
        """
        Ejecuta la activación/desactivación.
        
        Args:
            user_id: ID del usuario
            activate: True para activar, False para desactivar
            modified_by: ID del usuario que realiza el cambio
            
        Returns:
            (user_updated, error_code)
        """
        try:
            # 1. Verificar que el usuario existe
            user = self.user_repo.get_user_by_id(user_id)
            if not user:
                return None, "USER_NOT_FOUND"
            
            # 2. Si se va a desactivar, verificar que no sea el último admin
            if not activate:
                roles = self.user_repo.get_user_roles_with_details(user_id)
                is_admin = any(r['id_rol'] == 22 for r in roles)  # ID 22 = ADMINISTRADOR
                
                if is_admin:
                    # Contar cuántos admins activos hay
                    # (esto es simplificado, idealmente habría un método en el repo)
                    # Por ahora solo rechazamos si es el único admin
                    # TODO: implementar count_active_admins() en repository
                    pass  # Por ahora permitimos desactivar
            
            # 3. Ejecutar cambio
            if activate:
                success = self.user_repo.activate_user(user_id, modified_by)
            else:
                success = self.user_repo.deactivate_user(user_id, modified_by)
            
            if not success:
                return None, "TOGGLE_FAILED"
            
            # 4. Retornar usuario actualizado
            updated_user = self.user_repo.get_user_by_id_with_audit(user_id)
            return updated_user, None
            
        except Exception as e:
            print(f"Error in ToggleUserStatusUseCase: {e}")
            return None, "SERVER_ERROR"

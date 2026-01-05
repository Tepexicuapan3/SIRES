# src/use_cases/users/change_role_usecase.py
from src.infrastructure.repositories.user_repository import UserRepository


class ChangeUserRoleUseCase:
    """
    Caso de uso: Cambiar el rol primario de un usuario.
    
    Reglas de negocio:
    - El usuario debe existir
    - El nuevo rol debe existir y estar activo
    - Se desmarca el rol primario actual
    - Se marca el nuevo rol como primario
    - Si el usuario no tenía el nuevo rol, se asigna
    
    Casos de error:
    - USER_NOT_FOUND: Usuario no existe
    - ROLE_NOT_FOUND: Rol no existe o está inactivo
    - SAME_ROLE: El usuario ya tiene ese rol como primario
    - CHANGE_FAILED: Error al ejecutar el cambio
    """
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def execute(self, user_id: int, new_role_id: int, modified_by: int):
        """
        Ejecuta el cambio de rol primario.
        
        Args:
            user_id: ID del usuario
            new_role_id: ID del nuevo rol primario
            modified_by: ID del usuario que realiza el cambio
            
        Returns:
            (user_with_new_role, error_code)
        """
        try:
            # 1. Verificar que el usuario existe
            user = self.user_repo.get_user_by_id(user_id)
            if not user:
                return None, "USER_NOT_FOUND"
            
            # 2. Verificar que el nuevo rol existe y está activo
            role = self.user_repo.get_role_by_id(new_role_id)
            if not role:
                return None, "ROLE_NOT_FOUND"
            
            # 3. Obtener roles actuales del usuario
            current_roles = self.user_repo.get_user_roles_with_details(user_id)
            
            # 4. Verificar si ya tiene ese rol como primario
            primary_role = next((r for r in current_roles if r['is_primary'] == 1), None)
            if primary_role and primary_role['id_rol'] == new_role_id:
                return None, "SAME_ROLE"
            
            # 5. Ejecutar cambio
            success = self.user_repo.change_user_primary_role(user_id, new_role_id, modified_by)
            
            if not success:
                return None, "CHANGE_FAILED"
            
            # 6. Retornar usuario con roles actualizados
            updated_user = self.user_repo.get_user_by_id_with_audit(user_id)
            updated_roles = self.user_repo.get_user_roles_with_details(user_id)
            
            if not updated_user:
                return None, "SERVER_ERROR"
            
            result = updated_user.copy()
            result["roles"] = updated_roles
            
            return result, None
            
        except Exception as e:
            print(f"Error in ChangeUserRoleUseCase: {e}")
            return None, "SERVER_ERROR"

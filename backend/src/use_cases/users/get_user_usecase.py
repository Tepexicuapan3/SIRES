"""
Get User Use Case - Lógica de negocio para obtener detalles de un usuario

Responsabilidades:
- Obtener usuario por ID con todos sus detalles
- Incluir información de roles asignados
- Incluir información de det_usuarios (onboarding, conexiones)
- NO retornar password
"""

from typing import Dict, Optional, Tuple

from src.infrastructure.repositories.det_user_repository import \
    DetUserRepository
from src.infrastructure.repositories.user_repository import UserRepository


class GetUserUseCase:
    """Use case para obtener detalles completos de un usuario"""

    def __init__(self):
        self.user_repo = UserRepository()
        self.det_user_repo = DetUserRepository()

    def execute(self, user_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Obtiene detalles completos de un usuario por ID.
        
        Args:
            user_id: ID del usuario a obtener
            
        Returns:
            (result, error_code)
            - result: {
                id_usuario: int,
                usuario: str,
                nombre: str,
                paterno: str,
                materno: str,
                expediente: str,
                id_clin: int | None,
                correo: str,
                est_usuario: str,
                roles: List[str],
                det_usuario: {
                    terminos_acept: bool,
                    cambiar_clave: bool,
                    last_conexion: str | None,
                    act_conexion: str | None,
                    ip_ultima: str | None
                },
                usr_alta: str,
                fch_alta: str,
                usr_modf: str | None,
                fch_modf: str | None
              }
            - error_code: "USER_NOT_FOUND" | "SERVER_ERROR"
        """
        
        # 1. Obtener datos del usuario en sy_usuarios
        try:
            user = self.user_repo.get_user_by_id_with_audit(user_id)
            
            if not user:
                return None, "USER_NOT_FOUND"
            
            # 2. Obtener roles asignados
            roles = self.user_repo.get_user_roles_with_details(user_id)
            
            # 3. Obtener detalles de det_usuarios
            det_user = self.det_user_repo.get_det_by_userid(user_id)
            
            # 4. Construir respuesta completa
            result = {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "nombre": user["nombre"],
                "paterno": user["paterno"],
                "materno": user["materno"],
                "expediente": user["expediente"],
                "id_clin": user.get("id_clin"),
                "correo": user["correo"],
                "est_usuario": user["est_usuario"],
                "roles": roles,
                "det_usuario": None,
                "usr_alta": user.get("usr_alta"),
                "fch_alta": user.get("fch_alta").isoformat() if user.get("fch_alta") else None,
                "usr_modf": user.get("usr_modf"),
                "fch_modf": user.get("fch_modf").isoformat() if user.get("fch_modf") else None,
            }
            
            # 5. Agregar detalles si existen
            if det_user:
                result["det_usuario"] = {
                    "terminos_acept": det_user.get("terminos_acept") == 'T',
                    "cambiar_clave": det_user.get("cambiar_clave") == 'T',
                    "last_conexion": det_user.get("last_conexion").isoformat() if det_user.get("last_conexion") else None,
                    "act_conexion": det_user.get("act_conexion").isoformat() if det_user.get("act_conexion") else None,
                    "ip_ultima": det_user.get("ip_ultima"),
                    "intentos_fallidos": det_user.get("intentos_fallidos", 0),
                    "fecha_bloqueo": det_user.get("fecha_bloqueo").isoformat() if det_user.get("fecha_bloqueo") else None,
                }
            
            return result, None
        
        except Exception as e:
            print(f"Error getting user: {e}")
            return None, "SERVER_ERROR"

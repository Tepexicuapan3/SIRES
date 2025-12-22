from src.infrastructure.audit.access_log_repository import AccessLogRepository


class LogoutUseCase:
    """
    Caso de uso para cerrar sesión de usuario.
    
    NOTA: Este use case ya NO necesita recibir el token ni decodificarlo.
    El user_id se obtiene desde el JWT que viene en la cookie (manejado por el route).
    """

    def __init__(self):
        self.access_repo = AccessLogRepository()

    def execute(self, user_id: int, ip: str):
        """
        Registra el cierre de sesión del usuario.
        
        Args:
            user_id: ID del usuario (extraído del JWT por el route)
            ip: IP del cliente
            
        Returns:
            tuple: (result, error) donde error es None si éxito
        """
        try:
            # Registrar cierre de sesión en auditoría
            self.access_repo.registrar_acceso(user_id, ip, "FUERA DE SESIÓN")

            return {"message": "Logout exitoso"}, None

        except Exception as e:
            print("Error en LogoutUseCase:", e)
            return None, "SERVER_ERROR"

from src.infrastructure.audit.access_log_repository import AccessLogRepository
from src.infrastructure.security.jwt_service import decode_token 

class LogoutUseCase:

    def __init__(self):
        self.access_repo = AccessLogRepository()

    def execute(self, token, ip):
        """
        token: access token enviado desde front
        ip: ip del cliente
        """
        try:
            payload = decode_token(token)
            if not payload:
                return None, "INVALID_TOKEN"

            id_usuario = payload.get("id_usuario")

            # registra las sesiones
            self.access_repo.registrar_acceso(id_usuario, ip, "FUERA DE SESIÓN")

            return {"message": "Logout exitoso"}, None

        except Exception as e:
            print("Error en LogoutUseCase:", e)
            return None, "SERVER_ERROR"

# src/application/use_cases/complete_onboarding_usecase.py

from src.infrastructure.repositories.det_user_repository import DetUserRepository

class CompleteOnboardingUseCase:

    def __init__(self):
        self.det_user_repo = DetUserRepository()

    def execute(self, id_usuario: int):
        """
        Marca que el usuario ya aceptó términos y completó el onboarding.
        """
        updated = self.det_user_repo.update_onboarding(
            id_usuario=id_usuario,
            terminos="T",
            cambiar_clave="F"     # Ya no necesita cambiar clave
        )

        if not updated:
            return {
                "success": False,
                "message": "No se pudo completar el onboarding."
            }

        return {
            "success": True,
            "message": "Onboarding completado exitosamente."
        }

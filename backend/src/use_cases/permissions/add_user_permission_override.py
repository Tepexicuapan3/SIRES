"""
AddUserPermissionOverrideUseCase - Lógica de negocio para agregar override de permiso

Responsabilidades:
- Validar que el permiso existe
- Validar que el usuario existe
- Validar effect ('ALLOW' o 'DENY')
- Validar formato de fecha de expiración (opcional)
- Agregar override
- Invalidar cache de permisos del usuario

Reglas de Negocio:
- Un usuario puede tener solo un override por permiso
- Effect debe ser 'ALLOW' o 'DENY'
- Fecha de expiración es opcional
- Permisos requeridos: usuarios:update

Migración (Fase 5 - CRIT-08):
- ANTES: Invalidaba cache directamente en Redis
- DESPUÉS: Usa AuthorizationService.invalidate_cache() (centralizado)
"""

from datetime import datetime
from typing import Optional, Tuple

from src.infrastructure.authorization.authorization_service import \
    authorization_service
from src.infrastructure.repositories.permission_repository import \
    PermissionRepository
from src.infrastructure.repositories.user_repository import UserRepository


class AddUserPermissionOverrideUseCase:
    def __init__(
        self,
        permission_repo: Optional[PermissionRepository] = None,
        user_repo: Optional[UserRepository] = None
    ):
        self.permission_repo = permission_repo or PermissionRepository()
        self.user_repo = user_repo or UserRepository()

    def execute(
        self,
        user_id: int,
        permission_code: str,
        effect: str,
        expires_at: Optional[str],  # ISO datetime string
        usr_alta: str
    ) -> Tuple[Optional[dict], Optional[str]]:
        """
        Agrega un override de permiso a un usuario.

        Args:
            user_id: ID del usuario
            permission_code: Código del permiso (ej: "expedientes:read")
            effect: 'ALLOW' o 'DENY'
            expires_at: Fecha de expiración (ISO format) o None
            usr_alta: Usuario que crea el override

        Returns:
            Tupla (result, error_code):
            - result: { "user_id": int, "permission_code": str, "effect": str, "expires_at": str|None }
            - error_code: Código de error si falla, None si OK

        Códigos de Error:
            - USER_NOT_FOUND: Usuario no existe
            - PERMISSION_NOT_FOUND: Permiso no existe
            - INVALID_EFFECT: Effect debe ser ALLOW o DENY
            - INVALID_EXPIRATION_DATE: Formato de fecha inválido
            - DB_CONNECTION_FAILED: Error de conexión
            - OVERRIDE_CREATION_FAILED: Error al crear override
        """
        # Validación: effect válido
        if effect not in ['ALLOW', 'DENY']:
            return None, "INVALID_EFFECT"

        # Validación: usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"

        # Validación: permiso existe
        permission = self.permission_repo.get_permission_by_code(permission_code)
        if not permission:
            return None, "PERMISSION_NOT_FOUND"

        # Validación: fecha de expiración (si se proporciona)
        if expires_at:
            try:
                # Validar formato ISO
                datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return None, "INVALID_EXPIRATION_DATE"

        # Agregar override
        success, error = self.permission_repo.add_user_permission_override(
            user_id=user_id,
            permission_id=permission['id_permission'],
            effect=effect,
            expires_at=expires_at,
            usr_alta=usr_alta
        )

        if error:
            return None, error

        # Invalidar cache de permisos del usuario (centralizado en AuthorizationService)
        # Esto invalida cache en TODAS las instancias del backend (Redis compartido)
        authorization_service.invalidate_cache(user_id)

        return {
            "user_id": user_id,
            "permission_code": permission_code,
            "effect": effect,
            "expires_at": expires_at
        }, None


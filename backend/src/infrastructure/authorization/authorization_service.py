"""
Authorization Service - Lógica de autorización RBAC 2.0

Responsabilidades:
- Resolver permisos efectivos de usuarios (con cache opcional)
- Validar si un usuario tiene un permiso específico
- Proveer metadata de autorización (roles, landing route, is_admin)
- Cache de permisos en memoria (puede extenderse a Redis)

Principios aplicados:
- Single Responsibility: Solo se encarga de autorización, no de autenticación
- Dependency Injection: Recibe repository (facilita testing)
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from src.infrastructure.repositories.permission_repository import PermissionRepository


class AuthorizationService:
    """Servicio de autorización con cache en memoria"""

    def __init__(self, permission_repo: Optional[PermissionRepository] = None):
        """
        Args:
            permission_repo: Repository de permisos (inyectado para facilitar testing)
        """
        self.repo = permission_repo or PermissionRepository()
        
        # Cache en memoria: {user_id: {"permissions": [...], "cached_at": datetime, ...}}
        # En producción: considerar Redis con TTL
        self._cache: Dict[int, Dict] = {}
        self._cache_ttl_seconds = 300  # 5 minutos (balance entre seguridad y performance)

    def get_user_permissions(self, user_id: int, use_cache: bool = True) -> Dict:
        """
        Obtiene permisos efectivos de un usuario (con cache).
        
        Args:
            user_id: ID del usuario
            use_cache: Si usar cache (False para forzar refresh)
            
        Returns:
            {
                "permissions": ["expedientes:read", ...],
                "is_admin": bool,
                "roles": [...],
                "landing_route": "/consultas"
            }
        """
        # Verificar cache
        if use_cache and user_id in self._cache:
            cached_data = self._cache[user_id]
            cached_at = cached_data.get("cached_at")
            
            if cached_at and (datetime.now() - cached_at).total_seconds() < self._cache_ttl_seconds:
                # Cache válido
                return {
                    "permissions": cached_data["permissions"],
                    "is_admin": cached_data["is_admin"],
                    "roles": cached_data["roles"],
                    "landing_route": cached_data["landing_route"]
                }

        # Cache miss o expirado → consultar DB
        effective = self.repo.get_user_effective_permissions(user_id)

        # Guardar en cache
        self._cache[user_id] = {
            **effective,
            "cached_at": datetime.now()
        }

        return effective

    def has_permission(self, user_id: int, required_permission: str) -> bool:
        """
        Verifica si un usuario tiene un permiso específico.
        
        Args:
            user_id: ID del usuario
            required_permission: Código del permiso (ej: "expedientes:delete")
            
        Returns:
            True si tiene el permiso, False si no
        """
        user_perms = self.get_user_permissions(user_id)
        
        # Admin bypass
        if user_perms["is_admin"]:
            return True
        
        return required_permission in user_perms["permissions"]

    def has_any_permission(self, user_id: int, required_permissions: List[str]) -> bool:
        """
        Verifica si un usuario tiene AL MENOS UNO de los permisos listados.
        Útil para endpoints con múltiples permisos alternativos.
        
        Args:
            user_id: ID del usuario
            required_permissions: Lista de códigos de permisos
            
        Returns:
            True si tiene al menos uno, False si no tiene ninguno
        """
        user_perms = self.get_user_permissions(user_id)
        
        if user_perms["is_admin"]:
            return True
        
        return any(perm in user_perms["permissions"] for perm in required_permissions)

    def has_all_permissions(self, user_id: int, required_permissions: List[str]) -> bool:
        """
        Verifica si un usuario tiene TODOS los permisos listados.
        Útil para operaciones que requieren múltiples permisos simultáneos.
        
        Args:
            user_id: ID del usuario
            required_permissions: Lista de códigos de permisos
            
        Returns:
            True si tiene todos, False si falta alguno
        """
        user_perms = self.get_user_permissions(user_id)
        
        if user_perms["is_admin"]:
            return True
        
        user_perm_set = set(user_perms["permissions"])
        return all(perm in user_perm_set for perm in required_permissions)

    def get_landing_route(self, user_id: int) -> str:
        """
        Obtiene la ruta de redirección post-login para un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Ruta de landing (ej: "/consultas") basada en rol primario
        """
        user_perms = self.get_user_permissions(user_id)
        return user_perms.get("landing_route", "/dashboard")

    def get_user_roles(self, user_id: int) -> List[Dict]:
        """
        Obtiene la lista de roles de un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de roles con metadata
        """
        user_perms = self.get_user_permissions(user_id)
        return user_perms.get("roles", [])

    def is_admin(self, user_id: int) -> bool:
        """
        Verifica si un usuario tiene privilegios de administrador.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            True si es admin (bypass total de permisos)
        """
        user_perms = self.get_user_permissions(user_id)
        return user_perms.get("is_admin", False)

    def invalidate_cache(self, user_id: Optional[int] = None):
        """
        Invalida el cache de permisos.
        Llamar cuando se modifican roles/permisos de un usuario.
        
        Args:
            user_id: Si se especifica, solo invalida ese usuario. Si es None, limpia todo el cache.
        """
        if user_id is not None:
            self._cache.pop(user_id, None)
        else:
            self._cache.clear()

    def get_permission_summary(self, user_id: int) -> Dict:
        """
        Obtiene un resumen completo de permisos de un usuario.
        Útil para debugging y UIs de perfil de usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            {
                "user_id": 123,
                "is_admin": False,
                "roles": [...],
                "permissions_count": 25,
                "permissions": [...],
                "landing_route": "/consultas",
                "cached": True/False
            }
        """
        user_perms = self.get_user_permissions(user_id)
        is_cached = user_id in self._cache

        return {
            "user_id": user_id,
            "is_admin": user_perms["is_admin"],
            "roles": user_perms["roles"],
            "permissions_count": len(user_perms["permissions"]),
            "permissions": user_perms["permissions"],
            "landing_route": user_perms["landing_route"],
            "cached": is_cached
        }

    def validate_permission_format(self, permission_code: str) -> bool:
        """
        Valida que un código de permiso siga el formato 'resource:action'.
        
        Args:
            permission_code: Código a validar
            
        Returns:
            True si el formato es válido
        """
        if not permission_code or not isinstance(permission_code, str):
            return False
        
        parts = permission_code.split(":")
        if len(parts) != 2:
            return False
        
        resource, action = parts
        return bool(resource.strip()) and bool(action.strip())


# Singleton global (instancia por defecto)
# Los routes pueden importar esta instancia o crear la suya con DI
authorization_service = AuthorizationService()

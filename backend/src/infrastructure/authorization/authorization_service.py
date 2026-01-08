"""
Authorization Service - Lógica de autorización RBAC 2.0

Responsabilidades:
- Resolver permisos efectivos de usuarios (con cache en Redis)
- Validar si un usuario tiene un permiso específico
- Proveer metadata de autorización (roles, landing route, is_admin)
- Invalidación de cache distribuida (múltiples instancias)

Principios aplicados:
- Single Responsibility: Solo se encarga de autorización, no de autenticación
- Dependency Injection: Recibe repository y redis manager (facilita testing)
- Single Source of Truth: Redis es la única fuente de cache (no memoria local)
- Graceful Degradation: Si Redis falla, consulta directo a BD

Migración (Fase 5 - CRIT-08):
- ANTES: Cache en memoria local (self._cache) → problema con múltiples instancias
- DESPUÉS: Cache en Redis compartido → consistencia entre instancias
"""

import json
from typing import Dict, List, Optional

from src.infrastructure.cache.redis_manager import RedisManager
from src.infrastructure.repositories.permission_repository import \
    PermissionRepository


class AuthorizationService:
    """Servicio de autorización con cache distribuido en Redis"""

    def __init__(
        self, 
        permission_repo: Optional[PermissionRepository] = None,
        redis_manager: Optional[RedisManager] = None
    ):
        """
        Args:
            permission_repo: Repository de permisos (inyectado para facilitar testing)
            redis_manager: Manager de Redis para cache (inyectado para facilitar testing)
        """
        self.repo = permission_repo or PermissionRepository()
        self.redis = redis_manager or RedisManager()
        
        # TTL de cache: 5 minutos (balance entre seguridad y performance)
        # Mismo valor que usaban los use cases para consistencia
        self._cache_ttl_seconds = 300

    def get_user_permissions(self, user_id: int, use_cache: bool = True) -> Dict:
        """
        Obtiene permisos efectivos de un usuario (con cache en Redis).
        
        Args:
            user_id: ID del usuario
            use_cache: Si usar cache (False para forzar refresh desde BD)
            
        Returns:
            {
                "permissions": ["expedientes:read", ...],
                "is_admin": bool,
                "roles": [...],
                "landing_route": "/consultas"
            }
            
        Comportamiento:
            1. Si use_cache=True: Intenta leer de Redis
            2. Si cache miss o expirado: Consulta BD y guarda en Redis
            3. Si Redis falla: Consulta BD directamente (graceful degradation)
        """
        cache_key = f"user_permissions:{user_id}"
        
        # Intentar leer de cache
        if use_cache:
            try:
                cached_data = self.redis.get(cache_key)
                if cached_data:
                    # Cache hit → deserializar JSON
                    return json.loads(cached_data)
            except Exception as e:
                # Redis falló → log warning y continuar sin cache
                print(f"[AuthorizationService] Redis error (graceful degradation): {e}")

        # Cache miss o use_cache=False → consultar DB
        effective = self.repo.get_user_effective_permissions(user_id)

        # Guardar en cache (best-effort, no falla si Redis está caído)
        try:
            self.redis.set(cache_key, json.dumps(effective), ttl=self._cache_ttl_seconds)
        except Exception as e:
            print(f"[AuthorizationService] Could not cache permissions for user {user_id}: {e}")

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
        Invalida el cache de permisos en Redis.
        Llamar cuando se modifican roles/permisos de un usuario.
        
        Args:
            user_id: Si se especifica, solo invalida ese usuario. 
                     Si es None, limpia TODOS los permisos cacheados.
                     
        Comportamiento:
            - Si user_id especificado: DELETE user_permissions:{user_id}
            - Si user_id=None: DELETE user_permissions:* (todos los usuarios)
            
        Nota:
            Esto invalida cache en TODAS las instancias del backend (Redis compartido).
            Los use cases ya no necesitan invalidar cache manualmente.
        """
        try:
            if user_id is not None:
                # Invalidar usuario específico
                cache_key = f"user_permissions:{user_id}"
                self.redis.delete(cache_key)
            else:
                # Invalidar TODOS los permisos
                self.redis.delete_pattern("user_permissions:*")
        except Exception as e:
            print(f"[AuthorizationService] Could not invalidate cache: {e}")

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
        
        # Verificar si está cacheado en Redis
        is_cached = False
        try:
            cache_key = f"user_permissions:{user_id}"
            is_cached = self.redis.exists(cache_key)
        except Exception:
            pass  # Si Redis falla, asumimos no cacheado

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

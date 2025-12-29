"""
Permission Repository - Acceso a datos de permisos RBAC 2.0

Responsabilidades:
- Queries para obtener permisos efectivos de un usuario
- Resolución de permisos con prioridad DENY > ALLOW
- Obtención de landing routes por rol
- NO contiene lógica de negocio (eso va en AuthorizationService)
"""

from typing import List, Dict, Optional
from src.infrastructure.database.mysql_connection import get_db_connection, close_db


class PermissionRepository:
    """Repository para gestionar permisos RBAC 2.0"""

    def get_user_roles(self, user_id: int) -> List[Dict]:
        """
        Obtiene los roles de un usuario (con flag is_primary).
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de dicts con: id_rol, cod_rol, nom_rol, is_primary, landing_route, is_admin
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    cr.id_rol,
                    cr.rol as cod_rol,
                    cr.desc_rol as nom_rol,
                    cr.landing_route,
                    cr.priority,
                    cr.is_admin,
                    ur.is_primary
                FROM users_roles ur
                INNER JOIN cat_roles cr ON ur.id_rol = cr.id_rol
                WHERE ur.id_usuario = %s
                  AND ur.est_usr_rol = 'A'
                  AND cr.est_rol = 'A'
                ORDER BY ur.is_primary DESC, cr.priority ASC
            """
            cursor.execute(query, (user_id,))
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

    def get_role_permissions(self, role_ids: List[int]) -> List[str]:
        """
        Obtiene todos los permisos asignados a una lista de roles.
        
        Args:
            role_ids: Lista de IDs de roles
            
        Returns:
            Lista de códigos de permisos únicos (ej: ["expedientes:read", "usuarios:create"])
        """
        if not role_ids:
            return []

        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            # Usar IN con placeholders seguros
            placeholders = ", ".join(["%s"] * len(role_ids))
            query = f"""
                SELECT DISTINCT cp.code
                FROM role_permissions rp
                INNER JOIN cat_permissions cp ON rp.id_permission = cp.id_permission
                WHERE rp.id_rol IN ({placeholders})
                  AND rp.fch_baja IS NULL
                  AND cp.est_permission = 'A'
            """
            cursor.execute(query, tuple(role_ids))
            results = cursor.fetchall()
            return [row["code"] for row in results]
        finally:
            close_db(conn, cursor)

    def get_user_permission_overrides(self, user_id: int) -> List[Dict]:
        """
        Obtiene los overrides de permisos específicos del usuario (ALLOW/DENY).
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de dicts con: code, effect, expires_at
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    cp.code,
                    up.effect,
                    up.expires_at
                FROM user_permissions up
                INNER JOIN cat_permissions cp ON up.id_permission = cp.id_permission
                WHERE up.id_usuario = %s
                  AND up.fch_baja IS NULL
                  AND cp.est_permission = 'A'
                  AND (up.expires_at IS NULL OR up.expires_at > NOW())
            """
            cursor.execute(query, (user_id,))
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

    def get_user_effective_permissions(self, user_id: int) -> Dict:
        """
        Calcula los permisos efectivos de un usuario aplicando la lógica:
        1. Obtiene permisos de roles
        2. Aplica overrides de usuario (DENY > ALLOW)
        3. Retorna set final de permisos permitidos + metadata
        
        Args:
            user_id: ID del usuario
            
        Returns:
            {
                "permissions": ["expedientes:read", "usuarios:create", ...],
                "is_admin": bool,
                "roles": [{"id_rol": 1, "cod_rol": "MEDICOS", "nom_rol": "Médicos", ...}],
                "landing_route": "/consultas"  # del rol primario
            }
        """
        # 1. Obtener roles del usuario
        roles = self.get_user_roles(user_id)
        if not roles:
            return {
                "permissions": [],
                "is_admin": False,
                "roles": [],
                "landing_route": "/dashboard"  # default
            }

        # 2. Detectar si es admin (bypass total)
        is_admin = any(role.get("is_admin") == 1 for role in roles)
        
        # 3. Landing route = primer rol con is_primary=1, o el de mayor prioridad
        primary_role = next((r for r in roles if r.get("is_primary") == 1), roles[0])
        landing_route = primary_role.get("landing_route") or "/dashboard"

        # 4. Si es admin, retornar todo sin calcular permisos
        if is_admin:
            return {
                "permissions": ["*"],  # Wildcard = todos los permisos
                "is_admin": True,
                "roles": roles,
                "landing_route": landing_route
            }

        # 5. Obtener permisos de roles
        role_ids = [r["id_rol"] for r in roles]
        role_permissions = set(self.get_role_permissions(role_ids))

        # 6. Aplicar overrides de usuario
        overrides = self.get_user_permission_overrides(user_id)
        
        # DENY tiene prioridad absoluta
        denied_permissions = {o["code"] for o in overrides if o["effect"] == "DENY"}
        allowed_permissions = {o["code"] for o in overrides if o["effect"] == "ALLOW"}

        # Cálculo final: (role_permissions + allowed) - denied
        effective_permissions = (role_permissions | allowed_permissions) - denied_permissions

        return {
            "permissions": sorted(list(effective_permissions)),
            "is_admin": False,
            "roles": roles,
            "landing_route": landing_route
        }

    def has_permission(self, user_id: int, required_permission: str) -> bool:
        """
        Verifica si un usuario tiene un permiso específico.
        
        Args:
            user_id: ID del usuario
            required_permission: Código del permiso (ej: "expedientes:delete")
            
        Returns:
            True si tiene el permiso, False si no
        """
        effective = self.get_user_effective_permissions(user_id)
        
        # Admin bypass
        if effective["is_admin"]:
            return True
        
        return required_permission in effective["permissions"]

    def get_landing_route(self, user_id: int) -> str:
        """
        Obtiene la ruta de landing para un usuario basado en su rol primario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Ruta de landing (ej: "/consultas") o "/dashboard" por defecto
        """
        roles = self.get_user_roles(user_id)
        if not roles:
            return "/dashboard"
        
        primary_role = next((r for r in roles if r.get("is_primary") == 1), roles[0])
        return primary_role.get("landing_route") or "/dashboard"

    def get_all_permissions(self) -> List[Dict]:
        """
        Obtiene el catálogo completo de permisos disponibles.
        Útil para UIs de administración de permisos.
        
        Returns:
            Lista de permisos con: id_permission, code, resource, action, description, category
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    id_permission,
                    code,
                    resource,
                    action,
                    description,
                    category
                FROM cat_permissions
                WHERE est_permission = 'A'
                ORDER BY category, resource, action
            """
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

    def assign_permission_to_role(self, role_id: int, permission_id: int, user_id: int) -> bool:
        """
        Asigna un permiso a un rol.
        
        Args:
            role_id: ID del rol
            permission_id: ID del permiso
            user_id: ID del usuario que hace la asignación (auditoría)
            
        Returns:
            True si se asignó correctamente
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor()
        try:
            # Verificar si ya existe (incluyendo bajas lógicas)
            cursor.execute(
                """
                SELECT id_role_permission, fch_baja 
                FROM role_permissions 
                WHERE id_rol = %s AND id_permission = %s
                """,
                (role_id, permission_id)
            )
            existing = cursor.fetchone()

            if existing:
                # Si existe pero está dado de baja, reactivar
                if existing[1] is not None:
                    cursor.execute(
                        """
                        UPDATE role_permissions 
                        SET fch_baja = NULL, usr_baja = NULL 
                        WHERE id_role_permission = %s
                        """,
                        (existing[0],)
                    )
                # Si ya existe y está activo, no hacer nada
            else:
                # Insertar nuevo
                cursor.execute(
                    """
                    INSERT INTO role_permissions (id_rol, id_permission, usr_alta, fch_alta)
                    VALUES (%s, %s, %s, NOW())
                    """,
                    (role_id, permission_id, user_id)
                )

            conn.commit()
            return True
        except Exception:
            conn.rollback()
            raise
        finally:
            close_db(conn, cursor)

    def revoke_permission_from_role(self, role_id: int, permission_id: int, user_id: int) -> bool:
        """
        Revoca un permiso de un rol (baja lógica).
        
        Args:
            role_id: ID del rol
            permission_id: ID del permiso
            user_id: ID del usuario que hace la baja (auditoría)
            
        Returns:
            True si se revocó correctamente
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                UPDATE role_permissions 
                SET fch_baja = NOW(), usr_baja = %s
                WHERE id_rol = %s AND id_permission = %s AND fch_baja IS NULL
                """,
                (user_id, role_id, permission_id)
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception:
            conn.rollback()
            raise
        finally:
            close_db(conn, cursor)

    def get_all_roles(self) -> List[Dict]:
        """
        Obtiene todos los roles activos con cuenta de permisos asignados.
        Útil para UIs de administración de roles/permisos.
        
        Returns:
            Lista de roles con: id_rol, cod_rol, nom_rol, landing_route, priority, is_admin, permissions_count
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    cr.id_rol,
                    cr.rol as cod_rol,
                    cr.desc_rol as nom_rol,
                    cr.landing_route,
                    cr.priority,
                    cr.is_admin,
                    COUNT(rp.id_permission) as permissions_count
                FROM cat_roles cr
                LEFT JOIN role_permissions rp ON cr.id_rol = rp.id_rol AND rp.fch_baja IS NULL
                WHERE cr.est_rol = 'A'
                GROUP BY cr.id_rol, cr.rol, cr.desc_rol, cr.landing_route, cr.priority, cr.is_admin
                ORDER BY cr.priority ASC
            """
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

    def get_permissions_by_role_id(self, role_id: int) -> List[Dict]:
        """
        Obtiene todos los permisos asignados a un rol específico con detalles completos.
        
        Args:
            role_id: ID del rol
            
        Returns:
            Lista de permisos con: id_permission, code, resource, action, description, category
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    cp.id_permission,
                    cp.code,
                    cp.resource,
                    cp.action,
                    cp.description,
                    cp.category
                FROM role_permissions rp
                INNER JOIN cat_permissions cp ON rp.id_permission = cp.id_permission
                WHERE rp.id_rol = %s
                  AND rp.fch_baja IS NULL
                  AND cp.est_permission = 'A'
                ORDER BY cp.category, cp.resource, cp.action
            """
            cursor.execute(query, (role_id,))
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

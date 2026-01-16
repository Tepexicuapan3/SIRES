"""
Permission Repository - Acceso a datos de permisos RBAC 2.0

Responsabilidades:
- Queries para obtener permisos efectivos de un usuario
- Resolución de permisos con prioridad DENY > ALLOW
- Obtención de landing routes por rol
- NO contiene lógica de negocio (eso va en AuthorizationService)
"""

import logging
from typing import Dict, List, Optional

from src.infrastructure.database.mysql_connection import (close_db,
                                                          get_db_connection)

logger = logging.getLogger(__name__)


class PermissionRepository:
    """Repository para gestionar permisos RBAC 2.0"""

    def get_user_roles(self, user_id: int) -> List[Dict]:
        """
        Obtiene los roles de un usuario (con flag is_primary).
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de dicts con: id_rol, rol, desc_rol, is_primary, landing_route, is_admin
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    cr.id_rol,
                    cr.rol,
                    cr.desc_rol,
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
                FROM user_permission_overrides up
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
        
        IMPORTANTE: DENY overrides tienen prioridad ABSOLUTA, incluso para administradores.
        Esto permite revocar permisos específicos a cualquier usuario, respetando
        principios de seguridad como Segregation of Duties y Least Privilege.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            {
                "permissions": ["expedientes:read", "usuarios:create", ...],
                "is_admin": bool,
                "roles": [{"id_rol": 1, "rol": "MEDICOS", "desc_rol": "Médicos", ...}],
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

        # 2. Detectar si es admin
        is_admin = any(role.get("is_admin") == 1 for role in roles)
        
        # 3. Landing route = primer rol con is_primary=1, o el de mayor prioridad
        primary_role = next((r for r in roles if r.get("is_primary") == 1), roles[0])
        landing_route = primary_role.get("landing_route") or "/dashboard"

        # 4. Obtener overrides ANTES de hacer bypass de admin
        # DENY tiene prioridad absoluta sobre cualquier rol, incluso admin
        overrides = self.get_user_permission_overrides(user_id)
        denied_permissions = {o["code"] for o in overrides if o["effect"] == "DENY"}
        allowed_permissions = {o["code"] for o in overrides if o["effect"] == "ALLOW"}

        # 5. Si es admin pero tiene DENY overrides, calcular permisos explícitamente
        if is_admin:
            if denied_permissions:
                # Admin con restricciones → calcular permisos explícitos
                # (todos los permisos de roles + ALLOW overrides) - DENY overrides
                role_ids = [r["id_rol"] for r in roles]
                role_permissions = set(self.get_role_permissions(role_ids))
                effective_permissions = (role_permissions | allowed_permissions) - denied_permissions
                
                return {
                    "permissions": sorted(list(effective_permissions)),
                    "is_admin": True,  # Sigue siendo admin para otros propósitos
                    "roles": roles,
                    "landing_route": landing_route
                }
            else:
                # Admin sin DENY overrides → bypass total
                return {
                    "permissions": ["*"],  # Wildcard = todos los permisos
                    "is_admin": True,
                    "roles": roles,
                    "landing_route": landing_route
                }

        # 6. Usuario normal → calcular permisos con overrides
        role_ids = [r["id_rol"] for r in roles]
        role_permissions = set(self.get_role_permissions(role_ids))

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
            Lista de permisos con: id_permission, code, resource, action, description, category, is_system
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
                    category,
                    is_system
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
            True si se asignó correctamente, False si el rol no existe o está inactivo
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            # Validar que el rol existe y está activo
            cursor.execute("""
                SELECT id_rol FROM cat_roles 
                WHERE id_rol = %s AND est_rol = 'A'
            """, (role_id,))
            
            if not cursor.fetchone():
                return False  # Rol no existe o está inactivo
            
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
                if existing['fch_baja'] is not None:
                    cursor.execute(
                        """
                        UPDATE role_permissions 
                        SET fch_baja = NULL, usr_baja = NULL 
                        WHERE id_role_permission = %s
                        """,
                        (existing['id_role_permission'],)
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
            Lista de roles con: id_rol, rol, desc_rol, landing_route, priority, is_admin, permissions_count
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    cr.id_rol,
                    cr.rol,
                    cr.desc_rol,
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

    # ========== MÉTODOS CRUD DE PERMISOS (Fase 2) ==========

    def create_permission(
        self,
        code: str,
        resource: str,
        action: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        usr_alta: str = "system"
    ) -> tuple[Optional[Dict], Optional[str]]:
        """
        Crea un nuevo permiso custom (is_system=FALSE).
        
        Args:
            code: Código único del permiso (ej: "expedientes:read")
            resource: Recurso (ej: "expedientes")
            action: Acción (ej: "read")
            description: Descripción del permiso
            category: Categoría para agrupar (ej: "Gestión de Expedientes")
            usr_alta: Usuario que crea
            
        Returns:
            tuple: (permission_dict, error_code)
            - permission_dict con datos del permiso creado
            - error_code: None si éxito, string si error
        """
        conn = get_db_connection()
        if conn is None:
            return None, "DB_CONNECTION_FAILED"

        cursor = conn.cursor(dictionary=True)
        try:
            # Verificar que el código no exista
            cursor.execute(
                "SELECT id_permission FROM cat_permissions WHERE code = %s",
                (code,)
            )
            if cursor.fetchone():
                return None, "PERMISSION_CODE_EXISTS"

            # Insertar permiso (is_system=FALSE por defecto)
            cursor.execute(
                """
                INSERT INTO cat_permissions 
                (code, resource, action, description, category, is_system, usr_alta, fch_alta, est_permission)
                VALUES (%s, %s, %s, %s, %s, FALSE, %s, NOW(), 'A')
                """,
                (code, resource, action, description, category, usr_alta)
            )
            
            permission_id = cursor.lastrowid
            conn.commit()

            # Retornar el permiso creado
            cursor.execute(
                """
                SELECT id_permission, code, resource, action, description, category, is_system, est_permission
                FROM cat_permissions
                WHERE id_permission = %s
                """,
                (permission_id,)
            )
            return cursor.fetchone(), None

        except Exception as e:
            conn.rollback()
            return None, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    def update_permission(
        self,
        permission_id: int,
        description: Optional[str] = None,
        category: Optional[str] = None,
        usr_modf: str = "system"
    ) -> tuple[Optional[Dict], Optional[str]]:
        """
        Actualiza un permiso custom (solo descripción y categoría).
        NO permite editar permisos del sistema (is_system=TRUE).
        
        Args:
            permission_id: ID del permiso
            description: Nueva descripción
            category: Nueva categoría
            usr_modf: Usuario que modifica
            
        Returns:
            tuple: (permission_dict, error_code)
        """
        conn = get_db_connection()
        if conn is None:
            return None, "DB_CONNECTION_FAILED"

        cursor = conn.cursor(dictionary=True)
        try:
            # Verificar que existe y no es del sistema
            cursor.execute(
                """
                SELECT id_permission, is_system 
                FROM cat_permissions 
                WHERE id_permission = %s AND est_permission = 'A'
                """,
                (permission_id,)
            )
            perm = cursor.fetchone()
            
            if not perm:
                return None, "PERMISSION_NOT_FOUND"
            
            if perm["is_system"]:
                return None, "PERMISSION_SYSTEM_PROTECTED"

            # Actualizar solo campos permitidos
            updates = []
            params = []
            
            if description is not None:
                updates.append("description = %s")
                params.append(description)
            
            if category is not None:
                updates.append("category = %s")
                params.append(category)
            
            if not updates:
                # No hay nada que actualizar, retornar actual
                cursor.execute(
                    """
                    SELECT id_permission, code, resource, action, description, category, is_system, est_permission
                    FROM cat_permissions
                    WHERE id_permission = %s
                    """,
                    (permission_id,)
                )
                return cursor.fetchone(), None

            # Agregar auditoría
            updates.append("usr_modf = %s")
            updates.append("fch_modf = NOW()")
            params.append(usr_modf)
            params.append(permission_id)

            query = f"""
                UPDATE cat_permissions 
                SET {', '.join(updates)}
                WHERE id_permission = %s
            """
            cursor.execute(query, params)
            conn.commit()

            # Retornar permiso actualizado
            cursor.execute(
                """
                SELECT id_permission, code, resource, action, description, category, is_system, est_permission
                FROM cat_permissions
                WHERE id_permission = %s
                """,
                (permission_id,)
            )
            return cursor.fetchone(), None

        except Exception as e:
            conn.rollback()
            return None, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    def delete_permission(
        self,
        permission_id: int,
        usr_baja: str = "system"
    ) -> tuple[bool, Optional[str]]:
        """
        Elimina un permiso custom (baja lógica).
        NO permite eliminar permisos del sistema (is_system=TRUE).
        NO permite eliminar permisos asignados a roles.
        
        Args:
            permission_id: ID del permiso
            usr_baja: Usuario que elimina
            
        Returns:
            tuple: (success, error_code)
        """
        conn = get_db_connection()
        if conn is None:
            return False, "DB_CONNECTION_FAILED"

        cursor = conn.cursor(dictionary=True)
        try:
            # Verificar que existe y no es del sistema
            cursor.execute(
                """
                SELECT id_permission, is_system 
                FROM cat_permissions 
                WHERE id_permission = %s AND est_permission = 'A'
                """,
                (permission_id,)
            )
            perm = cursor.fetchone()
            
            if not perm:
                return False, "PERMISSION_NOT_FOUND"
            
            if perm["is_system"]:
                return False, "PERMISSION_SYSTEM_PROTECTED"

            # Verificar que no esté asignado a ningún rol
            cursor.execute(
                """
                SELECT COUNT(*) as count
                FROM role_permissions
                WHERE id_permission = %s AND fch_baja IS NULL
                """,
                (permission_id,)
            )
            count = cursor.fetchone()["count"]
            
            if count > 0:
                return False, "PERMISSION_IN_USE"

            # Baja lógica
            cursor.execute(
                """
                UPDATE cat_permissions
                SET est_permission = 'B', usr_baja = %s, fch_baja = NOW()
                WHERE id_permission = %s
                """,
                (usr_baja, permission_id)
            )
            conn.commit()
            return True, None

        except Exception as e:
            conn.rollback()
            return False, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    def get_permission_by_id(self, permission_id: int) -> Optional[Dict]:
        """
        Obtiene un permiso por ID.
        
        Args:
            permission_id: ID del permiso
            
        Returns:
            Dict con datos del permiso o None si no existe
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    id_permission, code, resource, action, 
                    description, category, is_system, est_permission,
                    usr_alta, fch_alta, usr_modf, fch_modf
                FROM cat_permissions
                WHERE id_permission = %s AND est_permission = 'A'
            """
            cursor.execute(query, (permission_id,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def get_permission_by_code(self, code: str) -> Optional[Dict]:
        """
        Obtiene un permiso por su código único.
        
        Args:
            code: Código del permiso (ej: "expedientes:read")
            
        Returns:
            Dict con datos del permiso o None si no existe
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    id_permission, code, resource, action, 
                    description, category, is_system, est_permission,
                    usr_alta, fch_alta, usr_modf, fch_modf
                FROM cat_permissions
                WHERE code = %s AND est_permission = 'A'
            """
            cursor.execute(query, (code,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def permission_code_exists(self, code: str, exclude_id: Optional[int] = None) -> bool:
        """
        Verifica si un código de permiso ya existe.
        
        Args:
            code: Código del permiso
            exclude_id: ID a excluir de la búsqueda (útil para updates)
            
        Returns:
            True si existe, False si no
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            if exclude_id:
                cursor.execute(
                    "SELECT id_permission FROM cat_permissions WHERE code = %s AND id_permission != %s",
                    (code, exclude_id)
                )
            else:
                cursor.execute(
                    "SELECT id_permission FROM cat_permissions WHERE code = %s",
                    (code,)
                )
            return cursor.fetchone() is not None
        finally:
            close_db(conn, cursor)

    def assign_permissions_to_role(
        self,
        role_id: int,
        permission_ids: List[int],
        usr_alta: str = "system"
    ) -> tuple[bool, Optional[str]]:
        """
        Asigna múltiples permisos a un rol (operación transaccional).
        
        Args:
            role_id: ID del rol
            permission_ids: Lista de IDs de permisos
            usr_alta: Usuario que asigna
            
        Returns:
            tuple: (success, error_code)
        """
        conn = get_db_connection()
        if conn is None:
            return False, "DB_CONNECTION_FAILED"

        cursor = conn.cursor(dictionary=True)
        try:
            # Verificar que el rol existe
            cursor.execute(
                "SELECT id_rol FROM cat_roles WHERE id_rol = %s AND est_rol = 'A'",
                (role_id,)
            )
            if not cursor.fetchone():
                return False, "ROLE_NOT_FOUND"

            # Verificar que todos los permisos existen
            if permission_ids:
                placeholders = ", ".join(["%s"] * len(permission_ids))
                cursor.execute(
                    f"""
                    SELECT COUNT(*) as count 
                    FROM cat_permissions 
                    WHERE id_permission IN ({placeholders}) AND est_permission = 'A'
                    """,
                    tuple(permission_ids)
                )
                count = cursor.fetchone()["count"]
                if count != len(permission_ids):
                    return False, "INVALID_PERMISSIONS"

            # Asignar cada permiso (usando el método existente)
            for perm_id in permission_ids:
                # Verificar si ya existe
                cursor.execute(
                    """
                    SELECT id_role_permission, fch_baja 
                    FROM role_permissions 
                    WHERE id_rol = %s AND id_permission = %s
                    """,
                    (role_id, perm_id)
                )
                existing = cursor.fetchone()

                if existing:
                    # Si existe pero está dado de baja, reactivar
                    if existing["fch_baja"] is not None:
                        cursor.execute(
                            """
                            UPDATE role_permissions 
                            SET fch_baja = NULL, usr_baja = NULL 
                            WHERE id_role_permission = %s
                            """,
                            (existing["id_role_permission"],)
                        )
                    # Si ya existe y está activo, no hacer nada
                else:
                    # Insertar nuevo
                    cursor.execute(
                        """
                        INSERT INTO role_permissions (id_rol, id_permission, usr_alta, fch_alta)
                        VALUES (%s, %s, %s, NOW())
                        """,
                        (role_id, perm_id, usr_alta)
                    )

            conn.commit()
            return True, None

        except Exception as e:
            conn.rollback()
            return False, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    # ========== MÉTODOS PARA USER PERMISSION OVERRIDES (FASE 4) ==========

    def add_user_permission_override(
        self,
        user_id: int,
        permission_id: int,
        effect: str,  # 'ALLOW' o 'DENY'
        expires_at: str | None,  # DateTime string o None
        usr_alta: str
    ) -> tuple[bool, str | None]:
        """
        Agrega un override de permiso para un usuario.

        Args:
            user_id: ID del usuario
            permission_id: ID del permiso
            effect: 'ALLOW' o 'DENY'
            expires_at: Fecha de expiración (ISO format) o None
            usr_alta: Usuario que crea el override

        Returns:
            Tupla (success, error_code)
        """
        conn = get_db_connection()
        if conn is None:
            return False, "DB_CONNECTION_FAILED"

        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            conn.start_transaction()

            # Verificar si ya existe un override para este usuario+permiso
            cursor.execute(
                """
                SELECT id_user_permission_override, fch_baja
                FROM user_permission_overrides
                WHERE id_usuario = %s AND id_permission = %s
                """,
                (user_id, permission_id)
            )
            existing = cursor.fetchone()

            if existing:
                # Si existe pero está dado de baja, reactivarlo y actualizar
                if existing["fch_baja"] is not None:
                    cursor.execute(
                        """
                        UPDATE user_permission_overrides
                        SET effect = %s, expires_at = %s, fch_baja = NULL, usr_baja = NULL
                        WHERE id_user_permission_override = %s
                        """,
                        (effect, expires_at, existing["id_user_permission_override"])
                    )
                else:
                    # Ya existe y está activo, solo actualizar effect y expires_at
                    cursor.execute(
                        """
                        UPDATE user_permission_overrides
                        SET effect = %s, expires_at = %s
                        WHERE id_user_permission_override = %s
                        """,
                        (effect, expires_at, existing["id_user_permission_override"])
                    )
            else:
                # Insertar nuevo override
                cursor.execute(
                    """
                    INSERT INTO user_permission_overrides
                    (id_usuario, id_permission, effect, expires_at, usr_alta, fch_alta)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    """,
                    (user_id, permission_id, effect, expires_at, usr_alta)
                )

            conn.commit()
            return True, None

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error adding user permission override: {e}", exc_info=True)
            return False, "OVERRIDE_CREATION_FAILED"
        finally:
            if cursor:
                close_db(conn, cursor)

    def remove_user_permission_override(
        self,
        user_id: int,
        permission_id: int,
        usr_baja: str
    ) -> tuple[bool, str | None]:
        """
        Elimina (soft delete) un override de permiso de un usuario.

        Args:
            user_id: ID del usuario
            permission_id: ID del permiso
            usr_baja: Usuario que elimina el override

        Returns:
            Tupla (success, error_code)
        """
        conn = get_db_connection()
        if conn is None:
            return False, "DB_CONNECTION_FAILED"

        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)

            # Verificar que existe y está activo
            cursor.execute(
                """
                SELECT id_user_permission_override, fch_baja
                FROM user_permission_overrides
                WHERE id_usuario = %s AND id_permission = %s
                """,
                (user_id, permission_id)
            )
            existing = cursor.fetchone()

            if not existing:
                return False, "OVERRIDE_NOT_FOUND"

            if existing["fch_baja"] is not None:
                return False, "OVERRIDE_ALREADY_DELETED"

            # Soft delete
            cursor.execute(
                """
                UPDATE user_permission_overrides
                SET fch_baja = NOW(), usr_baja = %s
                WHERE id_user_permission_override = %s
                """,
                (usr_baja, existing["id_user_permission_override"])
            )

            conn.commit()
            return True, None

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error removing user permission override: {e}", exc_info=True)
            return False, "OVERRIDE_DELETION_FAILED"
        finally:
            if cursor:
                close_db(conn, cursor)

    def get_user_permission_overrides_list(self, user_id: int) -> list[dict]:
        """
        Obtiene la lista de overrides activos de un usuario con información detallada.

        Args:
            user_id: ID del usuario

        Returns:
            Lista de diccionarios con información de overrides:
            [{
                "id_user_permission_override": int,
                "permission_code": str,
                "permission_description": str,
                "effect": "ALLOW"/"DENY",
                "expires_at": datetime | None,
                "is_expired": bool
            }, ...]
        """
        conn = get_db_connection()
        if conn is None:
            return []

        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT 
                    upo.id_user_permission_override,
                    upo.effect,
                    upo.expires_at,
                    cp.code as permission_code,
                    cp.description as permission_description,
                    CASE 
                        WHEN upo.expires_at IS NOT NULL AND upo.expires_at < NOW() THEN 1
                        ELSE 0
                    END as is_expired
                FROM user_permission_overrides upo
                INNER JOIN cat_permissions cp ON upo.id_permission = cp.id_permission
                WHERE upo.id_usuario = %s 
                  AND upo.fch_baja IS NULL
                ORDER BY upo.effect DESC, cp.code ASC
                """,
                (user_id,)
            )
            return cursor.fetchall()

        finally:
            if cursor:
                close_db(conn, cursor)

    def user_has_permission_override(self, user_id: int, permission_id: int) -> bool:
        """
        Verifica si un usuario tiene un override específico (activo).

        Args:
            user_id: ID del usuario
            permission_id: ID del permiso

        Returns:
            True si existe override activo, False si no
        """
        conn = get_db_connection()
        if conn is None:
            return False

        cursor = None
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT COUNT(*) 
                FROM user_permission_overrides
                WHERE id_usuario = %s 
                  AND id_permission = %s 
                  AND fch_baja IS NULL
                """,
                (user_id, permission_id)
            )
            result = cursor.fetchone()
            return result[0] > 0 if result else False

        finally:
            if cursor:
                close_db(conn, cursor)


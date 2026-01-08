"""
Role Repository - Acceso a datos de cat_roles para gestión RBAC

Responsabilidades:
- CRUD de roles (crear, actualizar, eliminar)
- Validaciones de integridad (nombres únicos, roles con usuarios)
- NO contiene lógica de negocio (eso va en Use Cases)
"""

from typing import Dict, List, Optional, Tuple

from src.infrastructure.database.mysql_connection import (close_db,
                                                          get_db_connection)


class RoleRepository:
    """Repository para gestión de cat_roles"""

    def create(
        self,
        rol: str,
        desc_rol: str,
        tp_rol: str = "ADMIN",
        landing_route: Optional[str] = None,
        priority: int = 999,
        is_admin: bool = False,
        usr_alta: str = "system"
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Crea un nuevo rol.
        
        Args:
            rol: Código/nombre único del rol (ej: "ENFERMERIA")
            desc_rol: Descripción del rol (ej: "Personal de enfermería")
            tp_rol: Tipo de rol (default: "ADMIN")
            landing_route: Ruta de destino al hacer login
            priority: Prioridad del rol (menor = mayor prioridad)
            is_admin: Si es rol administrador (bypass total)
            usr_alta: Usuario que crea el rol
            
        Returns:
            tuple: (role_dict, error_code)
            - role_dict con datos del rol creado
            - error_code: None si éxito, string si error
        """
        conn = get_db_connection()
        if conn is None:
            return None, "DB_CONNECTION_FAILED"

        cursor = conn.cursor(dictionary=True)
        try:
            # Verificar que el nombre no exista
            cursor.execute(
                "SELECT id_rol FROM cat_roles WHERE rol = %s AND est_rol = 'A'",
                (rol,)
            )
            if cursor.fetchone():
                return None, "ROLE_NAME_DUPLICATE"

            # Insertar nuevo rol
            query = """
                INSERT INTO cat_roles (
                    rol, desc_rol, tp_rol, landing_route, priority, is_admin,
                    usr_alta, fch_alta, est_rol
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), 'A')
            """
            cursor.execute(query, (
                rol, desc_rol, tp_rol, landing_route, priority, 
                1 if is_admin else 0, usr_alta
            ))
            conn.commit()

            role_id = cursor.lastrowid

            # Obtener el rol creado
            cursor.execute(
                """
                SELECT id_rol, rol, desc_rol, tp_rol, landing_route, 
                       priority, is_admin, est_rol, usr_alta, fch_alta
                FROM cat_roles
                WHERE id_rol = %s
                """,
                (role_id,)
            )
            role = cursor.fetchone()

            return role, None

        except Exception as e:
            conn.rollback()
            return None, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    def update(
        self,
        role_id: int,
        usr_modf: str,
        **kwargs
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Actualiza un rol existente.
        
        Args:
            role_id: ID del rol a actualizar
            usr_modf: Usuario que modifica
            **kwargs: Campos a actualizar (rol, desc_rol, landing_route, priority)
            
        Returns:
            tuple: (role_dict, error_code)
        """
        conn = get_db_connection()
        if conn is None:
            return None, "DB_CONNECTION_FAILED"

        cursor = conn.cursor(dictionary=True)
        try:
            # Verificar que el rol existe
            cursor.execute(
                "SELECT id_rol, rol, is_admin, is_system FROM cat_roles WHERE id_rol = %s AND est_rol = 'A'",
                (role_id,)
            )
            existing_role = cursor.fetchone()
            if not existing_role:
                return None, "ROLE_NOT_FOUND"

            # Proteger roles del sistema (basado en campo is_system)
            if existing_role.get('is_system', False):
                return None, "ROLE_SYSTEM_PROTECTED"

            # Si se cambia el nombre, verificar que no exista otro con ese nombre
            if 'rol' in kwargs and kwargs['rol'] != existing_role['rol']:
                cursor.execute(
                    "SELECT id_rol FROM cat_roles WHERE rol = %s AND id_rol != %s AND est_rol = 'A'",
                    (kwargs['rol'], role_id)
                )
                if cursor.fetchone():
                    return None, "ROLE_NAME_DUPLICATE"

            # Construir UPDATE dinámico solo con campos permitidos
            allowed_fields = ['rol', 'desc_rol', 'tp_rol', 'landing_route', 'priority']
            update_fields = []
            update_values = []

            for field in allowed_fields:
                if field in kwargs:
                    update_fields.append(f"{field} = %s")
                    update_values.append(kwargs[field])

            if not update_fields:
                return None, "NO_FIELDS_TO_UPDATE"

            # Agregar campos de auditoría
            update_fields.append("usr_modf = %s")
            update_fields.append("fch_modf = NOW()")
            update_values.append(usr_modf)
            update_values.append(role_id)

            query = f"""
                UPDATE cat_roles
                SET {', '.join(update_fields)}
                WHERE id_rol = %s
            """
            cursor.execute(query, tuple(update_values))
            conn.commit()

            # Obtener el rol actualizado
            cursor.execute(
                """
                SELECT id_rol, rol, desc_rol, tp_rol, landing_route, 
                       priority, is_admin, est_rol, usr_alta, fch_alta,
                       usr_modf, fch_modf
                FROM cat_roles
                WHERE id_rol = %s
                """,
                (role_id,)
            )
            role = cursor.fetchone()

            return role, None

        except Exception as e:
            conn.rollback()
            return None, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    def delete(
        self,
        role_id: int,
        usr_baja: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Elimina un rol (baja lógica).
        
        Args:
            role_id: ID del rol a eliminar
            usr_baja: Usuario que elimina
            
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
                "SELECT id_rol, is_admin, is_system FROM cat_roles WHERE id_rol = %s AND est_rol = 'A'",
                (role_id,)
            )
            existing_role = cursor.fetchone()
            if not existing_role:
                return False, "ROLE_NOT_FOUND"

            # Proteger roles del sistema (basado en campo is_system)
            if existing_role.get('is_system', False):
                return False, "ROLE_SYSTEM_PROTECTED"

            # Verificar que no tenga usuarios asignados
            user_count = self.count_users_with_role(role_id)
            if user_count > 0:
                return False, "ROLE_HAS_USERS"

            # Baja lógica
            cursor.execute(
                """
                UPDATE cat_roles
                SET est_rol = 'B', usr_baja = %s, fch_baja = NOW()
                WHERE id_rol = %s
                """,
                (usr_baja, role_id)
            )
            conn.commit()

            return True, None

        except Exception as e:
            conn.rollback()
            return False, f"DATABASE_ERROR: {str(e)}"
        finally:
            close_db(conn, cursor)

    def get_by_id(self, role_id: int) -> Optional[Dict]:
        """
        Obtiene un rol por ID.
        
        Args:
            role_id: ID del rol
            
        Returns:
            Dict con datos del rol o None si no existe
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    id_rol, rol, desc_rol, tp_rol, landing_route, 
                    priority, is_admin, est_rol, usr_alta, fch_alta,
                    usr_modf, fch_modf
                FROM cat_roles
                WHERE id_rol = %s AND est_rol = 'A'
            """
            cursor.execute(query, (role_id,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def get_all(self, include_inactive: bool = False) -> List[Dict]:
        """
        Lista todos los roles.
        
        Args:
            include_inactive: Si incluir roles inactivos (est_rol='B')
            
        Returns:
            Lista de roles con count de permisos
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor(dictionary=True)
        try:
            where_clause = "" if include_inactive else "WHERE cr.est_rol = 'A'"
            
            query = f"""
                SELECT 
                    cr.id_rol,
                    cr.rol,
                    cr.desc_rol,
                    cr.tp_rol,
                    cr.landing_route,
                    cr.priority,
                    cr.is_admin,
                    cr.est_rol,
                    COUNT(DISTINCT rp.id_permission) as permissions_count,
                    COUNT(DISTINCT ur.id_usuario) as users_count
                FROM cat_roles cr
                LEFT JOIN role_permissions rp ON cr.id_rol = rp.id_rol AND rp.fch_baja IS NULL
                LEFT JOIN users_roles ur ON cr.id_rol = ur.id_rol AND ur.est_usr_rol = 'A'
                {where_clause}
                GROUP BY cr.id_rol, cr.rol, cr.desc_rol, cr.tp_rol, cr.landing_route, 
                         cr.priority, cr.is_admin, cr.est_rol
                ORDER BY cr.priority ASC, cr.id_rol ASC
            """
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

    def count_users_with_role(self, role_id: int) -> int:
        """
        Cuenta usuarios que tienen este rol asignado.
        
        Args:
            role_id: ID del rol
            
        Returns:
            Número de usuarios con este rol activo
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                SELECT COUNT(*) as count
                FROM users_roles
                WHERE id_rol = %s AND est_usr_rol = 'A'
                """,
                (role_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else 0
        finally:
            close_db(conn, cursor)

    def role_name_exists(self, rol: str, exclude_id: Optional[int] = None) -> bool:
        """
        Verifica si un nombre de rol ya existe.
        
        Args:
            rol: Nombre del rol
            exclude_id: ID de rol a excluir (útil para updates)
            
        Returns:
            True si existe, False si no
        """
        conn = get_db_connection()
        if conn is None:
            raise RuntimeError("DB_CONNECTION_FAILED")

        cursor = conn.cursor()
        try:
            if exclude_id:
                cursor.execute(
                    "SELECT COUNT(*) FROM cat_roles WHERE rol = %s AND id_rol != %s AND est_rol = 'A'",
                    (rol, exclude_id)
                )
            else:
                cursor.execute(
                    "SELECT COUNT(*) FROM cat_roles WHERE rol = %s AND est_rol = 'A'",
                    (rol,)
                )
            
            result = cursor.fetchone()
            return result[0] > 0 if result else False
        finally:
            close_db(conn, cursor)

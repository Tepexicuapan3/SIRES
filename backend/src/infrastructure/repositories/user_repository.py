# src/infrastructure/repositories/user_repository.py
from src.infrastructure.database.mysql_connection import get_db_connection, close_db

class UserRepository:

    def get_user_by_username(self, usuario):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, clave, nombre, paterno, materno, 
                       expediente, curp, img_perfil, correo, est_usuario
                FROM sy_usuarios
                WHERE usuario = %s
                LIMIT 1
            """, (usuario,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def get_user_by_email(self, email):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, clave, nombre, paterno, materno,
                       expediente, curp, img_perfil, correo, est_usuario
                FROM sy_usuarios
                WHERE correo = %s
                LIMIT 1
            """, (email,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)


    def get_user_roles(self, id_usuario):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT cr.rol
                FROM users_roles ur
                INNER JOIN cat_roles cr ON ur.id_rol = cr.id_rol
                WHERE ur.id_usuario = %s AND ur.est_usr_rol = 'A'
            """, (id_usuario,))
            roles = cursor.fetchall()
            return [r["rol"] for r in roles]
        finally:
            close_db(conn, cursor)
            

    def get_user_by_id(self, user_id: int):
        """
        Obtiene un usuario por su ID.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            dict | None: Datos del usuario o None si no existe
        """
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, nombre, paterno, materno,
                       expediente, curp, img_perfil, correo, est_usuario
                FROM sy_usuarios
                WHERE id_usuario = %s
                LIMIT 1
            """, (user_id,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def update_password_by_id(self, user_id, hashed_password):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE sy_usuarios
                SET clave = %s, usr_modf = 'system', fch_modf = NOW()
                WHERE id_usuario = %s
            """, (hashed_password, user_id))

            conn.commit()
            return cursor.rowcount > 0

        except Exception as e:
            print("Error updating password by ID:", e)
            return False

        finally:
            close_db(conn, cursor)

    def create_user(
        self,
        usuario: str,
        clave: str,
        nombre: str,
        paterno: str,
        materno: str,
        expediente: str,
        curp: str,
        correo: str,
        created_by: int
    ) -> int | None:
        """
        Crea un nuevo usuario en sy_usuarios.
        
        Args:
            usuario: Nombre de usuario
            clave: Password hasheado
            nombre: Nombre(s)
            paterno: Apellido paterno
            materno: Apellido materno
            expediente: Número de expediente
            curp: CURP
            correo: Email
            created_by: ID del usuario que crea el registro
            
        Returns:
            ID del usuario creado o None si falla
        """
        conn = get_db_connection()
        if not conn:
            return None
        
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO sy_usuarios 
                (usuario, clave, nombre, paterno, materno, expediente, curp, correo, est_usuario, usr_alta, fch_alta)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'A', %s, NOW())
            """, (usuario, clave, nombre, paterno, materno, expediente, curp, correo, created_by))
            
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating user: {e}")
            conn.rollback()
            return None
        finally:
            close_db(conn, cursor)

    def assign_role_to_user(self, user_id: int, role_id: int, is_primary: bool, created_by: int) -> bool:
        """
        Asigna un rol a un usuario.
        
        Args:
            user_id: ID del usuario
            role_id: ID del rol
            is_primary: Si es el rol primario del usuario
            created_by: ID del usuario que crea la asignación
            
        Returns:
            True si se asignó correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        try:
            is_primary_int = 1 if is_primary else 0
            
            cursor.execute("""
                INSERT INTO users_roles 
                (id_usuario, id_rol, is_primary, est_usr_rol, usr_alta, fch_alta)
                VALUES (%s, %s, %s, 'A', %s, NOW())
            """, (user_id, role_id, is_primary_int, created_by))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error assigning role to user: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)

    def count_users(self, filters: dict) -> int:
        """
        Cuenta el total de usuarios que cumplen con los filtros especificados.
        
        Args:
            filters: Diccionario con filtros opcionales:
                - search_query: str - Búsqueda por usuario, nombre, expediente, CURP o correo
                - estado: str - 'A' (activo) o 'B' (baja)
                - rol_id: int - Filtrar por rol específico
                
        Returns:
            Total de usuarios que cumplen los filtros
        """
        conn = get_db_connection()
        if not conn:
            return 0
        
        cursor = None
        try:
            cursor = conn.cursor()
            
            # Query base
            query = "SELECT COUNT(DISTINCT u.id_usuario) FROM sy_usuarios u"
            params = []
            where_clauses = []
            
            # Si hay filtro por rol, hacemos JOIN
            if filters.get("rol_id"):
                query += " INNER JOIN users_roles ur ON u.id_usuario = ur.id_usuario"
                where_clauses.append("ur.id_rol = %s AND ur.est_usr_rol = 'A'")
                params.append(filters["rol_id"])
            
            # Filtro por estado
            if filters.get("estado"):
                where_clauses.append("u.est_usuario = %s")
                params.append(filters["estado"])
            
            # Filtro por búsqueda de texto
            if filters.get("search_query"):
                search = f"%{filters['search_query']}%"
                where_clauses.append("""(
                    u.usuario LIKE %s OR
                    u.nombre LIKE %s OR
                    u.paterno LIKE %s OR
                    u.materno LIKE %s OR
                    u.expediente LIKE %s OR
                    u.curp LIKE %s OR
                    u.correo LIKE %s
                )""")
                params.extend([search] * 7)
            
            # Construir WHERE si hay filtros
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
            
            cursor.execute(query, tuple(params))
            result = cursor.fetchone()
            return result[0] if result else 0
            
        finally:
            close_db(conn, cursor)

    def list_users(self, page: int, page_size: int, filters: dict) -> list[dict]:
        """
        Lista usuarios con paginación y filtros.
        
        Args:
            page: Número de página (inicia en 1)
            page_size: Cantidad de registros por página
            filters: Diccionario con filtros opcionales (ver count_users)
            
        Returns:
            Lista de diccionarios con datos de usuarios (SIN password)
        """
        conn = get_db_connection()
        if not conn:
            return []
        
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            offset = (page - 1) * page_size
            
            # Query base - incluimos rol primario del usuario
            query = """
                SELECT DISTINCT
                    u.id_usuario,
                    u.usuario,
                    u.nombre,
                    u.paterno,
                    u.materno,
                    u.expediente,
                    u.curp,
                    u.correo,
                    u.img_perfil,
                    u.est_usuario,
                    u.usr_alta,
                    u.fch_alta,
                    u.usr_modf,
                    u.fch_modf,
                    (SELECT cr.rol 
                     FROM users_roles ur2 
                     INNER JOIN cat_roles cr ON ur2.id_rol = cr.id_rol 
                     WHERE ur2.id_usuario = u.id_usuario 
                       AND ur2.is_primary = 1 
                       AND ur2.est_usr_rol = 'A' 
                     LIMIT 1) as rol_primario
                FROM sy_usuarios u
            """
            params = []
            where_clauses = []
            
            # Si hay filtro por rol, hacemos JOIN
            if filters.get("rol_id"):
                query += " INNER JOIN users_roles ur ON u.id_usuario = ur.id_usuario"
                where_clauses.append("ur.id_rol = %s AND ur.est_usr_rol = 'A'")
                params.append(filters["rol_id"])
            
            # Filtro por estado
            if filters.get("estado"):
                where_clauses.append("u.est_usuario = %s")
                params.append(filters["estado"])
            
            # Filtro por búsqueda de texto
            if filters.get("search_query"):
                search = f"%{filters['search_query']}%"
                where_clauses.append("""(
                    u.usuario LIKE %s OR
                    u.nombre LIKE %s OR
                    u.paterno LIKE %s OR
                    u.materno LIKE %s OR
                    u.expediente LIKE %s OR
                    u.curp LIKE %s OR
                    u.correo LIKE %s
                )""")
                params.extend([search] * 7)
            
            # Construir WHERE si hay filtros
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
            
            # Ordenamiento y paginación
            query += " ORDER BY u.fch_alta DESC LIMIT %s OFFSET %s"
            params.extend([page_size, offset])
            
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
            
        finally:
            close_db(conn, cursor)

    def get_user_by_id_with_audit(self, user_id: int) -> dict | None:
        """
        Obtiene un usuario por su ID incluyendo campos de auditoría.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            dict con datos del usuario (incluyendo usr_alta, fch_alta, etc.) o None
        """
        conn = get_db_connection()
        if not conn:
            return None
        
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    u.id_usuario,
                    u.usuario,
                    u.nombre,
                    u.paterno,
                    u.materno,
                    u.expediente,
                    u.curp,
                    u.img_perfil,
                    u.correo,
                    u.est_usuario,
                    u.usr_alta,
                    u.fch_alta,
                    u.usr_modf,
                    u.fch_modf,
                    du.terminos_acept,
                    du.cambiar_clave,
                    du.last_conexion,
                    du.ip_ultima
                FROM sy_usuarios u
                LEFT JOIN det_usuarios du ON u.id_usuario = du.id_usuario
                WHERE u.id_usuario = %s
                LIMIT 1
            """, (user_id,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def get_user_roles_with_details(self, user_id: int) -> list[dict]:
        """
        Obtiene los roles de un usuario con información detallada.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de diccionarios con información completa de cada rol:
            [{ id_rol, rol, desc_rol, is_primary }, ...]
        """
        conn = get_db_connection()
        if not conn:
            return []
        
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 
                    cr.id_rol,
                    cr.rol,
                    cr.desc_rol,
                    ur.is_primary,
                    ur.est_usr_rol
                FROM users_roles ur
                INNER JOIN cat_roles cr ON ur.id_rol = cr.id_rol
                WHERE ur.id_usuario = %s AND ur.est_usr_rol = 'A'
                ORDER BY ur.is_primary DESC, cr.rol ASC
            """, (user_id,))
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)

    def email_exists_for_other_user(self, email: str, exclude_user_id: int) -> bool:
        """
        Verifica si un email ya está siendo usado por otro usuario.
        
        Args:
            email: Email a verificar
            exclude_user_id: ID del usuario a excluir de la búsqueda (para updates)
            
        Returns:
            True si el email ya existe en otro usuario, False si está disponible
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = None
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) 
                FROM sy_usuarios 
                WHERE correo = %s AND id_usuario != %s
            """, (email, exclude_user_id))
            result = cursor.fetchone()
            return result[0] > 0 if result else False
        finally:
            close_db(conn, cursor)

    def update_user(self, user_id: int, data: dict, modified_by: int) -> bool:
        """
        Actualiza los datos de perfil de un usuario.
        
        Campos actualizables: nombre, paterno, materno, correo
        Campos NO actualizables: usuario, expediente, curp, clave
        
        Args:
            user_id: ID del usuario a actualizar
            data: Diccionario con los campos a actualizar
            modified_by: ID del usuario que realiza la modificación
            
        Returns:
            True si se actualizó correctamente, False en caso de error
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = None
        try:
            cursor = conn.cursor()
            
            # Campos permitidos para actualización
            allowed_fields = ["nombre", "paterno", "materno", "correo"]
            
            # Construir dinámicamente la query con solo los campos enviados
            updates = []
            params = []
            
            for field in allowed_fields:
                if field in data:
                    updates.append(f"{field} = %s")
                    params.append(data[field])
            
            # Si no hay campos para actualizar, retornar
            if not updates:
                return False
            
            # Agregar campos de auditoría
            updates.append("usr_modf = %s")
            updates.append("fch_modf = NOW()")
            params.append(modified_by)
            params.append(user_id)
            
            query = f"""
                UPDATE sy_usuarios 
                SET {', '.join(updates)}
                WHERE id_usuario = %s
            """
            
            cursor.execute(query, tuple(params))
            conn.commit()
            return cursor.rowcount > 0
            
        except Exception as e:
            print(f"Error updating user: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)

    def get_role_by_id(self, role_id: int) -> dict | None:
        """
        Obtiene un rol por su ID.
        
        Args:
            role_id: ID del rol
            
        Returns:
            dict con datos del rol o None si no existe
        """
        conn = get_db_connection()
        if not conn:
            return None
        
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_rol, rol, desc_rol, est_rol
                FROM cat_roles
                WHERE id_rol = %s AND est_rol = 'A'
            """, (role_id,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def change_user_primary_role(self, user_id: int, new_role_id: int, modified_by: int) -> bool:
        """
        Cambia el rol primario de un usuario.
        
        Operaciones:
        1. Desactiva el rol primario actual (is_primary = 0)
        2. Si ya tiene el nuevo rol asignado, lo marca como primario
        3. Si no tiene el nuevo rol, lo asigna como primario
        
        Args:
            user_id: ID del usuario
            new_role_id: ID del nuevo rol primario
            modified_by: ID del usuario que realiza el cambio
            
        Returns:
            True si se cambió correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            
            # 1. Desmarcar rol primario actual
            cursor.execute("""
                UPDATE users_roles
                SET is_primary = 0, usr_modf = %s, fch_modf = NOW()
                WHERE id_usuario = %s AND is_primary = 1
            """, (modified_by, user_id))
            
            # 2. Verificar si el usuario ya tiene el nuevo rol asignado
            cursor.execute("""
                SELECT id_usr_roles, est_usr_rol
                FROM users_roles
                WHERE id_usuario = %s AND id_rol = %s
                LIMIT 1
            """, (user_id, new_role_id))
            
            existing_role = cursor.fetchone()
            
            if existing_role:
                # Ya tiene el rol, solo marcarlo como primario y reactivarlo si está inactivo
                cursor.execute("""
                    UPDATE users_roles
                    SET is_primary = 1, est_usr_rol = 'A', usr_modf = %s, fch_modf = NOW()
                    WHERE id_usr_roles = %s
                """, (modified_by, existing_role['id_usr_roles']))
            else:
                # No tiene el rol, asignarlo como primario
                cursor.execute("""
                    INSERT INTO users_roles 
                    (id_usuario, id_rol, is_primary, tp_asignacion, est_usr_rol, usr_alta, fch_alta)
                    VALUES (%s, %s, 1, 'ROL', 'A', %s, NOW())
                """, (user_id, new_role_id, modified_by))
            
            conn.commit()
            return True
            
        except Exception as e:
            print(f"Error changing user primary role: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)

    def deactivate_user(self, user_id: int, modified_by: int) -> bool:
        """
        Desactiva un usuario (soft delete).
        Marca est_usuario = 'B' (baja).
        
        Args:
            user_id: ID del usuario
            modified_by: ID del usuario que realiza la desactivación
            
        Returns:
            True si se desactivó correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = None
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE sy_usuarios
                SET est_usuario = 'B', usr_modf = %s, fch_modf = NOW()
                WHERE id_usuario = %s
            """, (modified_by, user_id))
            
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deactivating user: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)

    def activate_user(self, user_id: int, modified_by: int) -> bool:
        """
        Reactiva un usuario.
        Marca est_usuario = 'A' (activo).
        
        Args:
            user_id: ID del usuario
            modified_by: ID del usuario que realiza la reactivación
            
        Returns:
            True si se reactivó correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = None
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE sy_usuarios
                SET est_usuario = 'A', usr_modf = %s, fch_modf = NOW()
                WHERE id_usuario = %s
            """, (modified_by, user_id))
            
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error activating user: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)





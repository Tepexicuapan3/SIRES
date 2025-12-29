#!/usr/bin/env python3
"""
Script temporal para explorar la base de datos MySQL de SIRES.
Solo consultas de lectura (SHOW, DESCRIBE, SELECT).
"""

import os
import sys

try:
    import mysql.connector
except ImportError:
    print("ERROR: mysql-connector-python no está instalado")
    print("Ejecutá: pip install mysql-connector-python")
    sys.exit(1)


def connect_db():
    """Conecta a la base de datos usando variables de entorno."""
    config = {
        'host': os.getenv('MYSQL_HOST', '10.15.15.76'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'user': os.getenv('MYSQL_USER', 'sires'),
        'password': os.getenv('MYSQL_PASSWORD', '112233'),
        'database': os.getenv('MYSQL_DATABASE', 'dbsisem'),
    }
    
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print(f"ERROR conectando a MySQL: {err}")
        sys.exit(1)


def execute_query(conn, query, description):
    """Ejecuta una consulta y muestra resultados."""
    print(f"\n{'='*80}")
    print(f"CONSULTA: {description}")
    print(f"{'='*80}")
    print(f"SQL: {query}\n")
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(query)
        
        # Si es DESCRIBE o SHOW, mostrar resultados
        results = cursor.fetchall()
        
        if not results:
            print("(Sin resultados)")
            return
        
        # Imprimir tabla formateada
        if results:
            # Obtener columnas
            columns = list(results[0].keys())
            
            # Calcular anchos de columna
            col_widths = {col: len(col) for col in columns}
            for row in results:
                for col in columns:
                    val_len = len(str(row[col])) if row[col] is not None else 4
                    col_widths[col] = max(col_widths[col], val_len)
            
            # Header
            header = " | ".join(col.ljust(col_widths[col]) for col in columns)
            print(header)
            print("-" * len(header))
            
            # Rows
            for row in results:
                row_str = " | ".join(
                    str(row[col]).ljust(col_widths[col]) if row[col] is not None else "NULL".ljust(col_widths[col])
                    for col in columns
                )
                print(row_str)
            
            print(f"\nTotal de registros: {len(results)}")
        
    except mysql.connector.Error as err:
        print(f"ERROR: {err}")
        if "doesn't exist" in str(err):
            print("Esto es ESPERADO si la tabla no existe (cat_permissions, etc.)")
    finally:
        cursor.close()


def main():
    print("EXPLORACION DE BASE DE DATOS SIRES")
    print("Modo: SOLO LECTURA (no se modificara ningun dato)\n")
    
    conn = connect_db()
    print("Conexion exitosa a MySQL\n")
    
    queries = [
        ("SHOW TABLES;", "1. Lista de tablas existentes"),
        ("DESCRIBE cat_roles;", "2. Estructura de tabla cat_roles"),
        ("DESCRIBE users_roles;", "3. Estructura de tabla users_roles"),
        ("DESCRIBE cat_permissions;", "4. Verificar tabla cat_permissions (debería NO existir)"),
        ("DESCRIBE role_permissions;", "5. Verificar tabla role_permissions (debería NO existir)"),
        ("DESCRIBE user_permissions;", "6. Verificar tabla user_permissions (debería NO existir)"),
        ("SELECT id_rol, rol, tp_rol, desc_rol, est_rol FROM cat_roles;", "7. Datos de roles existentes"),
        ("""
            SELECT 
                ur.id_usr_roles,
                ur.id_usuario,
                u.usuario,
                ur.id_rol,
                r.rol,
                ur.tp_asignacion,
                ur.est_usr_rol
            FROM users_roles ur
            LEFT JOIN sy_usuarios u ON ur.id_usuario = u.id_usuario
            LEFT JOIN cat_roles r ON ur.id_rol = r.id_rol
            LIMIT 20;
        """, "8. Relaciones usuario-rol actuales (primeras 20)"),
    ]
    
    for query, description in queries:
        execute_query(conn, query, description)
    
    conn.close()
    print("\n\nExploracion completada. Conexion cerrada.")


if __name__ == "__main__":
    main()

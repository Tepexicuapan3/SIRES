#!/usr/bin/env python3
"""
Exploración de tablas LEGACY de permisos en SIRES.
Objetivo: entender si contienen navegación (menús) o permisos atómicos.

SOLO LECTURA - NO MODIFICA NADA.
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
        results = cursor.fetchall()
        
        if not results:
            print("(Sin resultados)")
            return
        
        # Imprimir tabla formateada
        if results:
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
    finally:
        cursor.close()


def main():
    print("="*80)
    print("EXPLORACIÓN DE TABLAS LEGACY DE PERMISOS - SIRES")
    print("Modo: SOLO LECTURA (no se modificará ningún dato)")
    print("="*80)
    
    conn = connect_db()
    print("\nConexion exitosa a MySQL\n")
    
    queries = [
        # 1. Estructura de det_roles
        ("DESCRIBE det_roles;", 
         "1. Estructura de det_roles"),
        
        # 2. Estructura de det_roles_personalizados
        ("DESCRIBE det_roles_personalizados;", 
         "2. Estructura de det_roles_personalizados"),
        
        # 3. Datos de ejemplo de det_roles con nombres de roles
        ("""
            SELECT 
                dr.id_detrol,
                dr.id_rol,
                r.rol,
                dr.id_menu,
                dr.id_submenu,
                dr.est_detrol
            FROM det_roles dr
            LEFT JOIN cat_roles r ON dr.id_rol = r.id_rol
            LIMIT 20;
        """, 
         "3. Datos de ejemplo de det_roles (primeros 20 registros)"),
        
        # 4. Datos de ejemplo de det_roles_personalizados
        ("SELECT * FROM det_roles_personalizados LIMIT 20;", 
         "4. Datos de ejemplo de det_roles_personalizados"),
        
        # 5. Contar registros en ambas tablas
        ("""
            SELECT 'det_roles' as tabla, COUNT(*) as total FROM det_roles
            UNION ALL
            SELECT 'det_roles_personalizados', COUNT(*) FROM det_roles_personalizados;
        """, 
         "5. Conteo de registros en ambas tablas"),
        
        # 6. Estructura de cat_menus
        ("DESCRIBE cat_menus;", 
         "6. Estructura de cat_menus"),
        
        # 7. Estructura de cat_submenus
        ("DESCRIBE cat_submenus;", 
         "7. Estructura de cat_submenus"),
        
        # 8. Ejemplo de menús
        ("SELECT id_menu, menu, desc_menu FROM cat_menus LIMIT 10;", 
         "8. Datos de ejemplo de cat_menus"),
        
        # 9. Ejemplo de submenús con menús padre
        ("""
            SELECT 
                s.id_submenu, 
                s.id_menu, 
                m.menu,
                s.submenu, 
                s.url 
            FROM cat_submenus s
            LEFT JOIN cat_menus m ON s.id_menu = m.id_menu
            LIMIT 20;
        """, 
         "9. Datos de ejemplo de cat_submenus con menús"),
        
        # 10. Análisis adicional: ver si det_roles tiene todos los roles
        ("""
            SELECT 
                r.id_rol,
                r.rol,
                COUNT(dr.id_detrol) as total_permisos_menu
            FROM cat_roles r
            LEFT JOIN det_roles dr ON r.id_rol = dr.id_rol
            GROUP BY r.id_rol, r.rol
            ORDER BY r.id_rol
            LIMIT 30;
        """, 
         "10. ANÁLISIS: Cantidad de permisos de menú por rol"),
        
        # 11. Ver distribución de permisos personalizados
        ("""
            SELECT 
                COUNT(DISTINCT id_usuario) as usuarios_con_permisos_personalizados,
                COUNT(*) as total_permisos_personalizados
            FROM det_roles_personalizados;
        """, 
         "11. ANÁLISIS: Distribución de permisos personalizados"),
    ]
    
    for query, description in queries:
        execute_query(conn, query, description)
    
    conn.close()
    print("\n" + "="*80)
    print("Exploración completada. Conexión cerrada.")
    print("="*80)


if __name__ == "__main__":
    main()

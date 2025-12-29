#!/usr/bin/env python3
"""
Script para verificar el estado de las migraciones RBAC 2.0.
Verifica si las tablas existen y si necesitamos ejecutar migraciones.
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
    """Conecta a la base de datos SIRES."""
    config = {
        'host': os.getenv('MYSQL_HOST', '10.15.15.76'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'user': os.getenv('MYSQL_USER', 'sires'),
        'password': os.getenv('MYSQL_PASSWORD', '$ir35_2023'),
        'database': 'dbsisem',  # BD real del proyecto
    }
    
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print(f"ERROR conectando a MySQL: {err}")
        sys.exit(1)


def table_exists(conn, table_name):
    """Verifica si una tabla existe."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
        result = cursor.fetchone()
        return result is not None
    finally:
        cursor.close()


def column_exists(conn, table_name, column_name):
    """Verifica si una columna existe en una tabla."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE '{column_name}'")
        result = cursor.fetchone()
        return result is not None
    except mysql.connector.Error:
        return False
    finally:
        cursor.close()


def count_records(conn, table_name):
    """Cuenta registros en una tabla."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        result = cursor.fetchone()
        return result[0] if result else 0
    except mysql.connector.Error:
        return 0
    finally:
        cursor.close()


def main():
    print("="*80)
    print("VERIFICACION DE MIGRACIONES RBAC 2.0")
    print("="*80)
    
    conn = connect_db()
    print("[OK] Conexion exitosa a MySQL (BD: dbsisem)\n")
    
    # Verificar tablas nuevas
    print("[STEP 1] VERIFICANDO TABLAS NUEVAS (Phase 1 - 001_rbac_foundation.sql)")
    print("-"*80)
    
    new_tables = {
        'cat_permissions': 'Catálogo de permisos atómicos',
        'role_permissions': 'Asignación de permisos a roles',
        'user_permissions': 'Overrides de permisos por usuario (ALLOW/DENY)'
    }
    
    tables_status = {}
    for table, description in new_tables.items():
        exists = table_exists(conn, table)
        tables_status[table] = exists
        status = "✅ EXISTE" if exists else "❌ NO EXISTE"
        count = count_records(conn, table) if exists else 0
        print(f"{status} - {table:20s} ({description}) - {count} registros")
    
    # Verificar columnas nuevas en tablas existentes
    print("\n📋 VERIFICANDO COLUMNAS NUEVAS (Phase 1 - 002_rbac_alter_existing_tables.sql)")
    print("-"*80)
    
    new_columns = [
        ('cat_roles', 'landing_route', 'Ruta de redirección post-login'),
        ('cat_roles', 'priority', 'Prioridad del rol'),
        ('cat_roles', 'is_admin', 'Flag de administrador'),
        ('users_roles', 'is_primary', 'Marca rol primario del usuario'),
    ]
    
    columns_status = {}
    for table, column, description in new_columns:
        exists = column_exists(conn, table, column)
        columns_status[f"{table}.{column}"] = exists
        status = "✅ EXISTE" if exists else "❌ NO EXISTE"
        print(f"{status} - {table}.{column:20s} ({description})")
    
    # Resumen
    print("\n" + "="*80)
    print("RESUMEN")
    print("="*80)
    
    all_tables_exist = all(tables_status.values())
    all_columns_exist = all(columns_status.values())
    
    if all_tables_exist and all_columns_exist:
        print("✅ MIGRACIONES YA EJECUTADAS - El sistema RBAC 2.0 está instalado")
        print("\nPróximo paso: Verificar que hay permisos y asignaciones")
        
        # Mostrar conteos
        print("\n📊 ESTADÍSTICAS:")
        if tables_status['cat_permissions']:
            perms = count_records(conn, 'cat_permissions')
            print(f"   - Permisos en catálogo: {perms}")
        
        if tables_status['role_permissions']:
            role_perms = count_records(conn, 'role_permissions')
            print(f"   - Asignaciones permiso-rol: {role_perms}")
        
        if tables_status['user_permissions']:
            user_perms = count_records(conn, 'user_permissions')
            print(f"   - Overrides de usuario: {user_perms}")
        
    else:
        print("❌ MIGRACIONES PENDIENTES - Necesitás ejecutar los scripts SQL")
        print("\n📝 PLAN DE EJECUCIÓN:")
        
        if not all_tables_exist:
            print("\n   1. Ejecutar: backend/migrations/001_rbac_foundation.sql")
            print("      (Crea tablas cat_permissions, role_permissions, user_permissions)")
        
        if not all_columns_exist:
            print("\n   2. Ejecutar: backend/migrations/002_rbac_alter_existing_tables.sql")
            print("      (Agrega columnas landing_route, priority, is_admin, is_primary)")
        
        print("\n   3. Ejecutar: backend/migrations/003_rbac_seed_permissions.sql")
        print("      (Inserta permisos base: ~70-80 permisos)")
        
        print("\n   4. Ejecutar: backend/migrations/004_rbac_assign_permissions.sql")
        print("      (Asigna permisos a los 22 roles existentes)")
        
        print("\n   5. Ejecutar: backend/migrations/005_rbac_verification.sql")
        print("      (Verifica que todo esté correcto)")
        
        print("\n💡 CÓMO EJECUTAR:")
        print("   Opción A (desde Windows con MySQL Workbench):")
        print("   - Abrir cada archivo .sql")
        print("   - Ejecutar contra la BD SIRES")
        
        print("\n   Opción B (desde terminal con mysql CLI):")
        print("   cd backend/migrations")
        print("   mysql -h 10.15.15.76 -u sires -p SIRES < 001_rbac_foundation.sql")
        print("   mysql -h 10.15.15.76 -u sires -p SIRES < 002_rbac_alter_existing_tables.sql")
        print("   mysql -h 10.15.15.76 -u sires -p SIRES < 003_rbac_seed_permissions.sql")
        print("   mysql -h 10.15.15.76 -u sires -p SIRES < 004_rbac_assign_permissions.sql")
        print("   mysql -h 10.15.15.76 -u sires -p SIRES < 005_rbac_verification.sql")
    
    conn.close()
    print("\n" + "="*80)
    print("Verificación completada. Conexión cerrada.")
    print("="*80)


if __name__ == "__main__":
    main()

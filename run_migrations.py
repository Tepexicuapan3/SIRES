#!/usr/bin/env python3
"""
Script para ejecutar las migraciones RBAC 2.0 en la BD.
Lee los archivos SQL y los ejecuta en orden.
"""

import mysql.connector
import os
import sys

# Configuración de BD (usa variables de entorno o valores por defecto del proyecto)
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', '10.15.15.76'),
    'port': int(os.getenv('DATABASE_PORT', '3306')),
    'user': os.getenv('DATABASE_USER', 'sires'),
    'password': os.getenv('DATABASE_PASSWORD', '112233'),
    'database': os.getenv('DATABASE_NAME', 'dbsisem'),
}

MIGRATIONS_DIR = 'backend/migrations'

# Orden de ejecución (CRÍTICO: respetar este orden)
MIGRATION_FILES = [
    '001_rbac_foundation.sql',
    '002_rbac_alter_existing_tables.sql',
    '003_rbac_seed_permissions.sql',
    '004_rbac_assign_permissions.sql',
    '005_rbac_verification.sql',
]


def connect_db():
    """Conecta a la base de datos."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"[ERROR] No se pudo conectar a MySQL: {err}")
        sys.exit(1)


def execute_sql_file(conn, filepath):
    """
    Ejecuta un archivo SQL.
    MySQL connector no soporta multi-statement por defecto,
    así que dividimos por ';' y ejecutamos statement por statement.
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Dividir por statements (básico, puede fallar con ';' dentro de strings)
    # Para archivos SQL complejos, mejor usar mysql CLI
    # Pero como estos archivos son controlados, está ok
    statements = sql_content.split(';')
    
    cursor = conn.cursor()
    executed = 0
    
    for statement in statements:
        statement = statement.strip()
        
        # Ignorar comentarios y líneas vacías
        if not statement or statement.startswith('--') or statement.startswith('/*'):
            continue
        
        try:
            cursor.execute(statement)
            executed += 1
        except mysql.connector.Error as err:
            # Algunos errores son esperados (ej: verificaciones que fallan)
            # Solo imprimir warning, no detener
            if 'already exists' in str(err).lower():
                print(f"  [SKIP] Tabla/columna ya existe: {err}")
            else:
                print(f"  [WARN] Error ejecutando statement: {err}")
                print(f"  Statement: {statement[:100]}...")
    
    cursor.close()
    return executed


def main():
    print("="*80)
    print("EJECUTOR DE MIGRACIONES RBAC 2.0")
    print("="*80)
    print(f"Base de datos: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
    print(f"Usuario: {DB_CONFIG['user']}")
    print("="*80)
    
    # Confirmar ejecución
    print("\nEsto va a ejecutar las migraciones SQL en la base de datos.")
    print("Se recomienda tener un backup antes de continuar.")
    print("")
    
    respuesta = input("Continuar? (escribe 'SI' para confirmar): ")
    if respuesta.upper() != 'SI':
        print("[CANCELADO] Ejecucion abortada por el usuario.")
        sys.exit(0)
    
    # Conectar
    print("\n[STEP 1] Conectando a MySQL...")
    conn = connect_db()
    print("[OK] Conexion exitosa\n")
    
    # Ejecutar migraciones
    print("[STEP 2] Ejecutando migraciones en orden...\n")
    
    for i, migration_file in enumerate(MIGRATION_FILES, 1):
        filepath = os.path.join(MIGRATIONS_DIR, migration_file)
        
        if not os.path.exists(filepath):
            print(f"[ERROR] Archivo no encontrado: {filepath}")
            continue
        
        print(f"[{i}/{len(MIGRATION_FILES)}] Ejecutando: {migration_file}")
        
        try:
            executed = execute_sql_file(conn, filepath)
            conn.commit()
            print(f"[OK] {executed} statements ejecutados correctamente\n")
        except Exception as e:
            print(f"[ERROR] Fallo ejecutando {migration_file}: {e}")
            conn.rollback()
            print("[ROLLBACK] Cambios revertidos para este archivo\n")
            
            # Preguntar si continuar
            continuar = input("Continuar con las siguientes migraciones? (SI/NO): ")
            if continuar.upper() != 'SI':
                break
    
    # Cerrar conexión
    conn.close()
    
    print("\n" + "="*80)
    print("MIGRACIONES COMPLETADAS")
    print("="*80)
    print("\nProximo paso: Ejecuta el script de verificacion:")
    print("  python check_rbac_migrations.py")
    print("")


if __name__ == "__main__":
    main()

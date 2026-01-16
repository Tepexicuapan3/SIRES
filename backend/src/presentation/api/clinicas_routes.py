"""
Clinicas Routes - Endpoints para catálogo de clínicas

Responsabilidades:
- Listar clínicas activas (GET /api/v1/clinicas)
- Endpoint público (no requiere autenticación - se usa en formulario de creación de usuarios)
"""

from flask import Blueprint, jsonify
from src.infrastructure.database.mysql_connection import (close_db,
                                                          get_db_connection)

clinicas_bp = Blueprint("clinicas", __name__)


@clinicas_bp.route("", methods=["GET"], strict_slashes=False)
def get_clinicas():
    """
    Obtiene el catálogo de clínicas activas.
    
    Response 200:
        {
            "clinicas": [
                {
                    "id_clin": 1,
                    "clinica": "CUAUHTÉMOC",
                    "folio_clin": "C"
                },
                ...
            ]
        }
    
    Errors:
        - 500 SERVER_ERROR: Error interno
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                "code": "DB_CONNECTION_FAILED",
                "message": "No se pudo conectar a la base de datos"
            }), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Obtener clínicas activas ordenadas por nombre
        cursor.execute("""
            SELECT id_clin, clinica, folio_clin
            FROM cat_clinicas
            WHERE est_clin = 'A'
            ORDER BY clinica ASC
        """)
        
        clinicas = cursor.fetchall()
        
        return jsonify({"clinicas": clinicas}), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener clínicas: {str(e)}"
        }), 500
    
    finally:
        if cursor and conn:
            close_db(conn, cursor)

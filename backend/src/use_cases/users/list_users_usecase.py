"""
List Users Use Case - Lógica de negocio para listar usuarios

Responsabilidades:
- Listar usuarios con paginación
- Aplicar filtros de búsqueda
- Retornar datos sin información sensible (passwords)
- Incluir información de roles
"""

from typing import Dict, List, Optional, Tuple

from src.infrastructure.repositories.user_repository import UserRepository


class ListUsersUseCase:
    """Use case para listar usuarios del sistema con paginación y filtros"""

    def __init__(self):
        self.user_repo = UserRepository()

    def execute(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[Dict] = None
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Lista usuarios con paginación y filtros opcionales.
        
        Args:
            page: Número de página (1-indexed)
            page_size: Tamaño de página (máx 100)
            filters: Diccionario con filtros opcionales:
                - search_query (str): Búsqueda por usuario, nombre, expediente o correo
                - estado (str): 'A'=Activo, 'B'=Baja, None=Todos
                - rol_id (int): Filtrar por ID de rol
            
        Returns:
            (result, error_code)
            - result: {
                items: List[usuario],
                page: int,
                page_size: int,
                total: int,
                total_pages: int
              }
            - error_code: "INVALID_PAGINATION" | "SERVER_ERROR" | "INVALID_ESTADO"
        """
        
        # 1. Validar parámetros de paginación
        if page < 1:
            return None, "INVALID_PAGINATION"
        
        if page_size < 1 or page_size > 100:
            return None, "INVALID_PAGINATION"
        
        # 2. Normalizar filtros
        filters = filters or {}
        estado = filters.get('estado')
        
        # Validar estado si está presente
        if estado and estado not in ['A', 'B']:
            return None, "INVALID_ESTADO"
        
        # 3. Obtener total de registros (para calcular total_pages)
        try:
            total = self.user_repo.count_users(filters)
            
            # 4. Calcular total de páginas
            total_pages = (total + page_size - 1) // page_size  # Ceil division
            
            # 5. Si la página solicitada excede el total, retornar última página válida
            if page > total_pages and total_pages > 0:
                page = total_pages
            
            # 6. Obtener usuarios de la página actual
            users = self.user_repo.list_users(
                page=page,
                page_size=page_size,
                filters=filters
            )
            
            return {
                "items": users,
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }, None
        
        except Exception as e:
            print(f"Error listing users: {e}")
            return None, "SERVER_ERROR"

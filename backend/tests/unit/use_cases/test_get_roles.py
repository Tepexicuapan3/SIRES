"""
Tests unitarios para GetRolesUseCase.

Patrón: Arrange-Act-Assert (AAA)
Objetivo: Verificar que la obtención de roles funciona correctamente.

Nota: GetRolesUseCase es un thin wrapper sobre repository.
      Los tests validan la delegación correcta.
"""

from unittest.mock import Mock

import pytest
from src.use_cases.roles.get_roles import GetRolesUseCase


class TestGetRolesUseCase:
    """
    Test suite para GetRolesUseCase.
    
    Cobertura:
    - ✅ Get all roles (con/sin inactivos)
    - ✅ Get by ID (existente/no existente)
    """

    # ==========================================================================
    # GET ALL - Obtener lista de roles
    # ==========================================================================

    def test_get_all_roles_default(self, mock_role_repository):
        """
        Caso exitoso: Obtener todos los roles activos (default).
        
        Por defecto, include_inactive=False → solo roles activos.
        """
        # ARRANGE
        expected_roles = [
            {'id_rol': 1, 'nombre': 'ADMIN', 'activo': True},
            {'id_rol': 2, 'nombre': 'MEDICO', 'activo': True},
        ]
        mock_role_repository.get_all.return_value = expected_roles
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_all()
        
        # ASSERT
        assert result == expected_roles
        mock_role_repository.get_all.assert_called_once_with(include_inactive=False)

    def test_get_all_roles_include_inactive(self, mock_role_repository):
        """
        Caso exitoso: Obtener roles incluyendo inactivos.
        
        Útil para auditoría o reactivación de roles.
        """
        # ARRANGE
        expected_roles = [
            {'id_rol': 1, 'nombre': 'ADMIN', 'activo': True},
            {'id_rol': 2, 'nombre': 'OLD_ROLE', 'activo': False},
        ]
        mock_role_repository.get_all.return_value = expected_roles
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_all(include_inactive=True)
        
        # ASSERT
        assert result == expected_roles
        assert len(result) == 2
        mock_role_repository.get_all.assert_called_once_with(include_inactive=True)

    def test_get_all_roles_empty_list(self, mock_role_repository):
        """
        Edge case: No hay roles en el sistema.
        
        Retorna lista vacía (no None, no error).
        """
        # ARRANGE
        mock_role_repository.get_all.return_value = []
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_all()
        
        # ASSERT
        assert result == []
        assert isinstance(result, list)

    # ==========================================================================
    # GET BY ID - Obtener rol específico
    # ==========================================================================

    def test_get_role_by_id_success(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Obtener rol existente por ID.
        """
        # ARRANGE
        mock_role_repository.get_by_id.return_value = sample_role
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_by_id(role_id=999)
        
        # ASSERT
        assert result == sample_role
        assert result['id_rol'] == 999
        mock_role_repository.get_by_id.assert_called_once_with(999)

    def test_get_role_by_id_not_found(self, mock_role_repository):
        """
        Caso de error: Rol no existe.
        
        Retorna None (no lanza excepción).
        """
        # ARRANGE
        mock_role_repository.get_by_id.return_value = None
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_by_id(role_id=99999)
        
        # ASSERT
        assert result is None
        mock_role_repository.get_by_id.assert_called_once_with(99999)

    def test_get_role_by_id_zero(self, mock_role_repository):
        """
        Edge case: ID=0 (inválido).
        
        El use case delega al repository, que retornará None.
        """
        # ARRANGE
        mock_role_repository.get_by_id.return_value = None
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_by_id(role_id=0)
        
        # ASSERT
        assert result is None

    def test_get_role_by_id_negative(self, mock_role_repository):
        """
        Edge case: ID negativo (inválido).
        """
        # ARRANGE
        mock_role_repository.get_by_id.return_value = None
        use_case = GetRolesUseCase(role_repo=mock_role_repository)
        
        # ACT
        result = use_case.get_by_id(role_id=-1)
        
        # ASSERT
        assert result is None

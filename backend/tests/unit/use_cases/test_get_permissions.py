"""
Tests unitarios para GetPermissionsUseCase

Cobertura de escenarios:
1. Happy path: Obtener todos los permisos
2. Happy path: Obtener permiso por ID
3. Happy path: Obtener permisos de un rol
4. Edge cases: Lista vacía, permiso no encontrado

Este use case es principalmente un proxy al repository (no tiene lógica de negocio),
pero es importante testearlo para garantizar que la interfaz funciona correctamente.

Patrón usado: AAA (Arrange-Act-Assert)
"""

import pytest
from src.use_cases.permissions.get_permissions import GetPermissionsUseCase


class TestGetPermissionsUseCase:
    """
    Suite de tests para GetPermissionsUseCase.
    
    Este use case NO tiene validaciones propias, solo delega al repository.
    Los tests verifican que los métodos se llaman correctamente.
    """
    
    # =========================================================================
    # GET ALL - Obtener todos los permisos
    # =========================================================================
    
    def test_get_all_permissions_success(self, mock_permission_repository, sample_permission):
        """
        Happy path: Obtener lista de todos los permisos.
        
        Assert:
        - Repository llamado correctamente
        - Lista retornada tal cual viene del repository
        """
        # ARRANGE
        expected_permissions = [sample_permission, sample_permission.copy()]
        mock_permission_repository.get_all_permissions.return_value = expected_permissions
        use_case = GetPermissionsUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result = use_case.get_all()
        
        # ASSERT
        assert result == expected_permissions
        assert len(result) == 2
        mock_permission_repository.get_all_permissions.assert_called_once()
    
    def test_get_all_permissions_empty_list(self, mock_permission_repository):
        """
        Edge case: No hay permisos en el sistema.
        
        Assert:
        - Retorna lista vacía (no None ni error)
        """
        # ARRANGE
        mock_permission_repository.get_all_permissions.return_value = []
        use_case = GetPermissionsUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result = use_case.get_all()
        
        # ASSERT
        assert result == []
        assert isinstance(result, list)
        mock_permission_repository.get_all_permissions.assert_called_once()
    
    # =========================================================================
    # GET BY ID - Obtener permiso específico
    # =========================================================================
    
    def test_get_permission_by_id_success(self, mock_permission_repository, sample_permission):
        """
        Happy path: Obtener permiso por ID existente.
        
        Assert:
        - Repository llamado con el ID correcto
        - Retorna el permiso encontrado
        """
        # ARRANGE
        mock_permission_repository.get_permission_by_id.return_value = sample_permission
        use_case = GetPermissionsUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result = use_case.get_by_id(permission_id=999)
        
        # ASSERT
        assert result == sample_permission
        assert result['id_permiso'] == 999
        mock_permission_repository.get_permission_by_id.assert_called_once_with(999)
    
    def test_get_permission_by_id_not_found(self, mock_permission_repository):
        """
        Edge case: Permiso no existe.
        
        Assert:
        - Retorna None (el repository decide qué retornar)
        """
        # ARRANGE
        mock_permission_repository.get_permission_by_id.return_value = None
        use_case = GetPermissionsUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result = use_case.get_by_id(permission_id=99999)
        
        # ASSERT
        assert result is None
        mock_permission_repository.get_permission_by_id.assert_called_once_with(99999)
    
    # =========================================================================
    # GET BY ROLE - Obtener permisos de un rol
    # =========================================================================
    
    def test_get_permissions_by_role_success(self, mock_permission_repository, sample_permission):
        """
        Happy path: Obtener permisos asignados a un rol.
        
        Assert:
        - Repository llamado con role_id correcto
        - Retorna lista de permisos del rol
        """
        # ARRANGE
        role_permissions = [sample_permission, sample_permission.copy()]
        mock_permission_repository.get_permissions_by_role_id.return_value = role_permissions
        use_case = GetPermissionsUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result = use_case.get_by_role_id(role_id=1)
        
        # ASSERT
        assert result == role_permissions
        assert len(result) == 2
        mock_permission_repository.get_permissions_by_role_id.assert_called_once_with(1)
    
    def test_get_permissions_by_role_empty(self, mock_permission_repository):
        """
        Edge case: Rol sin permisos asignados.
        
        Assert:
        - Retorna lista vacía (rol existe pero sin permisos)
        """
        # ARRANGE
        mock_permission_repository.get_permissions_by_role_id.return_value = []
        use_case = GetPermissionsUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result = use_case.get_by_role_id(role_id=999)
        
        # ASSERT
        assert result == []
        assert isinstance(result, list)
        mock_permission_repository.get_permissions_by_role_id.assert_called_once_with(999)


class TestGetPermissionsBusinessRules:
    """
    Documentación de reglas de negocio para GetPermissionsUseCase.
    """
    
    def test_why_no_validations_in_use_case(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué este use case no tiene validaciones?
        
        Razón:
        - GET operations son queries read-only (no mutan estado)
        - No hay reglas de negocio que aplicar (solo lectura)
        - El repository ya maneja casos edge (not found → None)
        
        Beneficios:
        - ✅ Use case súper simple (fácil de mantener)
        - ✅ Toda la lógica de query en el repository (Single Responsibility)
        - ✅ Testeable fácilmente (solo verificar que se llama al método correcto)
        
        Trade-off:
        - ❌ El use case no agrega mucho valor (es casi un proxy)
        - ✅ Pero mantiene la consistencia arquitectónica (toda lógica pasa por use cases)
        
        Patrón aplicado: CQRS light - separar queries de commands
        """
        pass

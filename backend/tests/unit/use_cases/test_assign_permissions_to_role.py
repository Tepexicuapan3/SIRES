"""
Tests unitarios para AssignPermissionsToRoleUseCase

Cobertura de escenarios:
1. Happy path: Asignar múltiples permisos a un rol
2. Validaciones: Lista vacía, rol no existe, permisos no existen
3. Side effect: Invalidación de cache después de asignación exitosa
4. Edge cases: Lista con un solo permiso

Patrón usado: AAA (Arrange-Act-Assert)
Principio: Cache Invalidation - asegurar consistencia después de modificar permisos
"""

from unittest.mock import Mock

import pytest
from src.use_cases.permissions.assign_permissions_to_role import \
    AssignPermissionsToRoleUseCase


class TestAssignPermissionsToRoleUseCase:
    """
    Suite de tests para AssignPermissionsToRoleUseCase.
    
    Business rules aplicadas:
    - BR1: Lista de permisos no puede estar vacía
    - BR2: El repository valida que rol y permisos existan
    - BR3: Asignación es transaccional (todo o nada)
    - BR4: Cache de autorizaciones debe invalidarse después de asignar
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_assign_permissions_success(self, mock_permission_repository):
        """
        Caso de éxito: Asignar múltiples permisos a un rol.
        
        Assert:
        - Repository llamado con parámetros correctos
        - Cache invalidado después de asignación exitosa
        """
        # ARRANGE
        mock_auth_service = Mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (True, None)
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=[10, 20, 30],
            usr_alta="admin"
        )
        
        # ASSERT
        assert error is None
        assert success is True
        
        mock_permission_repository.assign_permissions_to_role.assert_called_once_with(
            role_id=1,
            permission_ids=[10, 20, 30],
            usr_alta="admin"
        )
        
        # Verificar que cache fue invalidado
        mock_auth_service.invalidate_cache.assert_called_once()
    
    def test_assign_single_permission(self, mock_permission_repository):
        """
        Edge case: Asignar un solo permiso (lista con 1 elemento).
        """
        # ARRANGE
        mock_auth_service = Mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (True, None)
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=[10]  # Solo un permiso
        )
        
        # ASSERT
        assert error is None
        assert success is True
        mock_auth_service.invalidate_cache.assert_called_once()
    
    def test_assign_with_default_user(self, mock_permission_repository):
        """
        Happy path: Usuario por defecto es "system" si no se especifica.
        """
        # ARRANGE
        mock_auth_service = Mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (True, None)
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=[10, 20]
            # usr_alta no especificado
        )
        
        # ASSERT
        assert error is None
        
        mock_permission_repository.assign_permissions_to_role.assert_called_once_with(
            role_id=1,
            permission_ids=[10, 20],
            usr_alta="system"
        )
    
    # =========================================================================
    # VALIDACIONES - Lista vacía
    # =========================================================================
    
    def test_empty_permission_list(self, mock_permission_repository):
        """
        Validación: Lista de permisos no puede estar vacía.
        
        Razón: No tiene sentido llamar a "asignar permisos" sin permisos.
        """
        # ARRANGE
        mock_auth_service = Mock()
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=[]  # Lista vacía
        )
        
        # ASSERT
        assert error == "EMPTY_PERMISSION_LIST"
        assert success is False
        
        # Repository NO debe ser llamado
        mock_permission_repository.assign_permissions_to_role.assert_not_called()
        
        # Cache NO debe invalidarse
        mock_auth_service.invalidate_cache.assert_not_called()
    
    def test_none_permission_list(self, mock_permission_repository):
        """
        Edge case: Lista None también es inválida (falsy value).
        """
        # ARRANGE
        mock_auth_service = Mock()
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=None  # None es falsy
        )
        
        # ASSERT
        assert error == "EMPTY_PERMISSION_LIST"
        assert success is False
        mock_permission_repository.assign_permissions_to_role.assert_not_called()
        mock_auth_service.invalidate_cache.assert_not_called()
    
    # =========================================================================
    # REGLAS DE NEGOCIO - Repository errors
    # =========================================================================
    
    def test_role_not_found(self, mock_permission_repository):
        """
        Validación: El repository retorna error si el rol no existe.
        """
        # ARRANGE
        mock_auth_service = Mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (False, "ROLE_NOT_FOUND")
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=99999,  # ID inexistente
            permission_ids=[10, 20]
        )
        
        # ASSERT
        assert error == "ROLE_NOT_FOUND"
        assert success is False
        
        # Cache NO debe invalidarse si falló
        mock_auth_service.invalidate_cache.assert_not_called()
    
    def test_invalid_permissions(self, mock_permission_repository):
        """
        Validación: El repository retorna error si algún permiso no existe.
        
        Razón: La asignación es transaccional (todo o nada).
        Si un permiso no existe, NINGUNO se asigna.
        """
        # ARRANGE
        mock_auth_service = Mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (False, "INVALID_PERMISSIONS")
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=[10, 99999, 20]  # 99999 no existe
        )
        
        # ASSERT
        assert error == "INVALID_PERMISSIONS"
        assert success is False
        mock_auth_service.invalidate_cache.assert_not_called()
    
    def test_database_error_propagates(self, mock_permission_repository):
        """
        Edge case: Errores de BD se propagan al caller.
        """
        # ARRANGE
        mock_auth_service = Mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (False, "DATABASE_ERROR")
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # ACT
        success, error = use_case.execute(
            role_id=1,
            permission_ids=[10, 20]
        )
        
        # ASSERT
        assert error == "DATABASE_ERROR"
        assert success is False
        mock_auth_service.invalidate_cache.assert_not_called()
    
    # =========================================================================
    # SIDE EFFECTS - Cache invalidation
    # =========================================================================
    
    def test_cache_invalidated_only_on_success(self, mock_permission_repository):
        """
        Regla de negocio: Cache solo se invalida si la asignación fue exitosa.
        
        Razón: Si la asignación falló, los permisos NO cambiaron,
        entonces no hay necesidad de invalidar cache.
        """
        # ARRANGE
        mock_auth_service = Mock()
        use_case = AssignPermissionsToRoleUseCase(
            permission_repo=mock_permission_repository,
            auth_service=mock_auth_service
        )
        
        # CASO 1: Asignación exitosa → invalidar cache
        mock_permission_repository.assign_permissions_to_role.return_value = (True, None)
        success, error = use_case.execute(role_id=1, permission_ids=[10])
        assert success is True
        assert mock_auth_service.invalidate_cache.call_count == 1
        
        # CASO 2: Asignación fallida → NO invalidar cache
        mock_auth_service.reset_mock()
        mock_permission_repository.assign_permissions_to_role.return_value = (False, "ROLE_NOT_FOUND")
        success, error = use_case.execute(role_id=999, permission_ids=[10])
        assert success is False
        mock_auth_service.invalidate_cache.assert_not_called()


class TestAssignPermissionsBusinessRules:
    """
    Documentación de reglas de negocio para AssignPermissionsToRoleUseCase.
    """
    
    def test_why_transactional_assignment(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué la asignación es transaccional?
        
        Problema sin transacción:
        - Intentamos asignar [perm1, perm2, perm3] a un rol
        - perm1 y perm2 se asignan exitosamente
        - perm3 no existe → error
        - Estado final: rol tiene perm1 y perm2, pero el usuario esperaba las 3
        - Esto genera inconsistencias difíciles de debuggear
        
        Solución con transacción:
        - Si UNO falla, TODOS fallan (rollback)
        - Estado final: rol NO tiene ninguno de los 3 permisos
        - El usuario sabe que debe corregir y volver a intentar
        
        Trade-off:
        - ✅ Consistencia garantizada (todo o nada)
        - ✅ Más fácil de entender (no estados parciales)
        - ❌ Si falla 1 de 100, hay que reintentar los 100
        
        Patrón aplicado: ACID Transactions (Atomicity)
        """
        pass
    
    def test_why_invalidate_cache_after_assignment(self):
        """
        DECISIÓN DE PERFORMANCE: ¿Por qué invalidar cache?
        
        Escenario sin invalidación:
        1. Usuario tiene permisos cacheados en Redis (10 minutos TTL)
        2. Admin asigna nuevo permiso al rol del usuario
        3. Usuario sigue viendo permisos viejos por 10 minutos
        4. Usuario intenta usar nuevo permiso → "Access Denied" (confusión)
        
        Solución con invalidación:
        - Al modificar permisos de un rol, invalidar cache de autorizaciones
        - Próximo request del usuario recalcula permisos (con los nuevos)
        - Usuario ve cambios inmediatamente
        
        Trade-off:
        - ✅ Consistencia inmediata
        - ✅ Mejor UX (cambios se reflejan al instante)
        - ❌ Spike de queries a BD después de modificar permisos (todos recalculan)
        
        Patrón aplicado: Cache Invalidation (Write-Through Cache)
        """
        pass
    
    def test_why_empty_list_validation_in_use_case(self):
        """
        DECISIÓN DE DISEÑO: ¿Por qué validar lista vacía en use case y no en repository?
        
        Razón:
        - Lista vacía NO es un error de BD, es un error de lógica
        - El repository solo debe manejar errores de persistencia (ROLE_NOT_FOUND, DATABASE_ERROR)
        - El use case maneja reglas de negocio (EMPTY_PERMISSION_LIST)
        
        Beneficio:
        - ✅ Separation of Concerns - cada capa tiene su responsabilidad clara
        - ✅ Use case más testeable (no depende del repository para esta validación)
        
        Patrón aplicado: Single Responsibility Principle (SOLID)
        """
        pass

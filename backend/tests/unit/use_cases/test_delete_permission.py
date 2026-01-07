"""
Tests unitarios para DeletePermissionUseCase

Cobertura de escenarios:
1. Happy path: Eliminación exitosa (soft delete)
2. Regla de negocio: permisos de sistema NO se pueden eliminar
3. Regla de negocio: permisos en uso NO se pueden eliminar
4. Validación: permiso no encontrado

Nota: TODAS las eliminaciones son lógicas (activo=False), nunca físicas (DELETE).
Esto preserva integridad referencial y auditoría.

Patrón usado: AAA (Arrange-Act-Assert)
Principio: Soft Delete para preservar historial
"""

import pytest
from src.use_cases.permissions.delete_permission import DeletePermissionUseCase


class TestDeletePermissionUseCase:
    """
    Suite de tests para DeletePermissionUseCase.
    
    Business rules aplicadas:
    - BR1: Eliminación es SIEMPRE lógica (soft delete)
    - BR2: Permisos de sistema NO pueden eliminarse
    - BR3: Permisos asignados a roles NO pueden eliminarse (cascade protection)
    - BR4: El repository valida que el permiso exista
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_delete_permission_success(self, mock_permission_repository):
        """
        Caso de éxito: Eliminar permiso custom no usado.
        
        Assert:
        - Repository retorna True (eliminación exitosa)
        - Usuario que elimina se registra para auditoría
        """
        # ARRANGE
        mock_permission_repository.delete_permission.return_value = (True, None)
        use_case = DeletePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        success, error = use_case.execute(
            permission_id=999,
            usr_baja="admin"
        )
        
        # ASSERT
        assert error is None
        assert success is True
        
        mock_permission_repository.delete_permission.assert_called_once_with(
            permission_id=999,
            usr_baja="admin"
        )
    
    def test_delete_permission_default_user(self, mock_permission_repository):
        """
        Happy path: Eliminar permiso con usuario por defecto.
        
        Assert:
        - usr_baja="system" si no se especifica
        """
        # ARRANGE
        mock_permission_repository.delete_permission.return_value = (True, None)
        use_case = DeletePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        success, error = use_case.execute(permission_id=999)
        
        # ASSERT
        assert error is None
        assert success is True
        
        mock_permission_repository.delete_permission.assert_called_once_with(
            permission_id=999,
            usr_baja="system"
        )
    
    # =========================================================================
    # REGLAS DE NEGOCIO - Protección de permisos de sistema
    # =========================================================================
    
    def test_cannot_delete_system_permission(self, mock_permission_repository):
        """
        Regla de negocio: Permisos de sistema NO pueden eliminarse.
        
        Razón: Los permisos de sistema son parte de la arquitectura base.
        Eliminarlos rompería funcionalidades críticas del aplicativo.
        
        El repository retorna error PERMISSION_SYSTEM_PROTECTED.
        """
        # ARRANGE
        use_case = DeletePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.delete_permission.return_value = (False, "PERMISSION_SYSTEM_PROTECTED")
        
        # ACT
        success, error = use_case.execute(permission_id=1)  # Permiso de sistema
        
        # ASSERT
        assert error == "PERMISSION_SYSTEM_PROTECTED"
        assert success is False
    
    # =========================================================================
    # REGLAS DE NEGOCIO - Cascade Protection
    # =========================================================================
    
    def test_cannot_delete_permission_in_use(self, mock_permission_repository):
        """
        Regla de negocio: Permisos asignados a roles NO pueden eliminarse.
        
        Razón: Si eliminamos un permiso que está asignado a roles,
        los roles quedarían con referencias rotas (huérfanos).
        
        Solución: Antes de eliminar permiso, debes:
        1. Desasignarlo de TODOS los roles que lo tienen
        2. Luego eliminar el permiso
        
        El repository retorna error PERMISSION_IN_USE.
        """
        # ARRANGE
        use_case = DeletePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.delete_permission.return_value = (False, "PERMISSION_IN_USE")
        
        # ACT
        success, error = use_case.execute(permission_id=999)
        
        # ASSERT
        assert error == "PERMISSION_IN_USE"
        assert success is False
    
    # =========================================================================
    # VALIDACIONES - Existencia
    # =========================================================================
    
    def test_permission_not_found(self, mock_permission_repository):
        """
        Validación: El repository retorna error si el permiso no existe.
        """
        # ARRANGE
        use_case = DeletePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.delete_permission.return_value = (False, "PERMISSION_NOT_FOUND")
        
        # ACT
        success, error = use_case.execute(permission_id=99999)
        
        # ASSERT
        assert error == "PERMISSION_NOT_FOUND"
        assert success is False
    
    # =========================================================================
    # EDGE CASES - Errores de BD
    # =========================================================================
    
    def test_database_error_propagates(self, mock_permission_repository):
        """
        Edge case: Errores de BD se propagan al caller.
        """
        # ARRANGE
        use_case = DeletePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.delete_permission.return_value = (False, "DATABASE_ERROR")
        
        # ACT
        success, error = use_case.execute(permission_id=999)
        
        # ASSERT
        assert error == "DATABASE_ERROR"
        assert success is False


class TestDeletePermissionBusinessRules:
    """
    Documentación de reglas de negocio para DeletePermissionUseCase.
    """
    
    def test_why_soft_delete_instead_of_hard_delete(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué soft delete y no DELETE físico?
        
        Problema con hard delete (DELETE FROM):
        - Se pierde historial de auditoría (¿quién creó ese permiso? ¿cuándo?)
        - Si había referencias (logs, auditoría), quedan rotas
        - No hay forma de recuperar si fue un error
        
        Solución con soft delete (UPDATE activo=0):
        - Historial preservado (fecha_creacion, usr_alta, usr_baja)
        - Referencias intactas (logs/auditoría siguen funcionando)
        - Recuperable (UPDATE activo=1 si fue error)
        - Cumple con normativas de trazabilidad (NOM-024-SSA3-2012 para SIRES)
        
        Trade-off:
        - ✅ Auditoría completa
        - ✅ Recuperable
        - ✅ No rompe referencias
        - ❌ La tabla crece más (pero es aceptable, permisos son pocos)
        
        Patrón aplicado: Soft Delete (Event Sourcing light)
        """
        pass
    
    def test_why_cascade_protection_is_important(self):
        """
        DECISIÓN DE INTEGRIDAD: ¿Por qué validar PERMISSION_IN_USE?
        
        Escenario sin protección:
        1. Permiso "expedientes:read" asignado a rol "MEDICO"
        2. Admin elimina permiso "expedientes:read"
        3. Rol "MEDICO" tiene referencia a permiso inexistente
        4. Al calcular permisos efectivos de un médico → error NULL
        5. Médicos no pueden acceder a expedientes → sistema roto
        
        Solución:
        - Validar que el permiso NO esté asignado a ningún rol
        - Si está asignado, retornar PERMISSION_IN_USE
        - Forzar al admin a desasignarlo antes de eliminar
        
        Patrón aplicado: Referential Integrity Check (similar a FOREIGN KEY)
        """
        pass
    
    def test_workflow_to_delete_permission_in_use(self):
        """
        GUÍA DE USO: ¿Cómo eliminar un permiso que está asignado a roles?
        
        Workflow correcto:
        1. GET /api/v1/permissions/{id}/roles → Ver qué roles lo tienen
        2. Para cada rol:
           - DELETE /api/v1/roles/{role_id}/permissions/{perm_id}
        3. Cuando todos los roles lo dejen de tener:
           - DELETE /api/v1/permissions/{id} → Ahora sí funciona
        
        Esto obliga al admin a ser consciente de las consecuencias.
        
        Mejora futura:
        - Agregar parámetro force=true para desasignar automáticamente
        - Pero por ahora, preferimos explícito > implícito
        
        Patrón aplicado: Explicit is better than implicit (Zen of Python)
        """
        pass

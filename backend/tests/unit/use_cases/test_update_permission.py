"""
Tests unitarios para UpdatePermissionUseCase

Cobertura de escenarios:
1. Happy path: Actualización exitosa (descripción, categoría)
2. Validaciones: descripción/categoría muy largos
3. Regla de negocio: permisos del sistema son inmutables
4. Edge cases: valores None, actualización parcial

Nota: UpdatePermissionUseCase NO permite cambiar code, resource ni action.
Solo actualiza campos de presentación/documentación.

Patrón usado: AAA (Arrange-Act-Assert)
Principio SOLID: Open/Closed - permisos de sistema cerrados a modificación
"""

import pytest
from src.use_cases.permissions.update_permission import UpdatePermissionUseCase


class TestUpdatePermissionUseCase:
    """
    Suite de tests para UpdatePermissionUseCase.
    
    Business rules aplicadas:
    - BR1: Solo se puede actualizar descripción y categoría
    - BR2: Permisos de sistema (es_sistema=True) NO pueden editarse
    - BR3: Descripción max 255 caracteres
    - BR4: Categoría max 50 caracteres
    - BR5: El repository valida que el permiso exista
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_update_permission_success_full(self, mock_permission_repository, sample_permission):
        """
        Caso de éxito: Actualizar descripción y categoría.
        
        Assert:
        - Repository llamado con los nuevos valores
        - Código, resource y action NO se modifican (inalterables)
        """
        # ARRANGE
        updated_permission = sample_permission.copy()
        updated_permission.update({
            'descripcion': 'Nueva descripción actualizada',
            'categoria': 'nueva_categoria'
        })
        mock_permission_repository.update_permission.return_value = (updated_permission, None)
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(
            permission_id=999,
            description="Nueva descripción actualizada",
            category="nueva_categoria",
            usr_modf="admin"
        )
        
        # ASSERT
        assert error is None
        assert result is not None
        assert result['descripcion'] == 'Nueva descripción actualizada'
        assert result['categoria'] == 'nueva_categoria'
        
        mock_permission_repository.update_permission.assert_called_once_with(
            permission_id=999,
            description="Nueva descripción actualizada",
            category="nueva_categoria",
            usr_modf="admin"
        )
    
    def test_update_permission_partial_description_only(self, mock_permission_repository, sample_permission):
        """
        Caso de actualización parcial: Solo descripción.
        
        Assert:
        - Categoría se pasa como None (no se modifica)
        """
        # ARRANGE
        updated_permission = sample_permission.copy()
        updated_permission['descripcion'] = 'Solo descripción cambia'
        mock_permission_repository.update_permission.return_value = (updated_permission, None)
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(
            permission_id=999,
            description="Solo descripción cambia"
            # category=None (default)
        )
        
        # ASSERT
        assert error is None
        
        mock_permission_repository.update_permission.assert_called_once_with(
            permission_id=999,
            description="Solo descripción cambia",
            category=None,
            usr_modf="system"
        )
    
    def test_update_permission_partial_category_only(self, mock_permission_repository, sample_permission):
        """
        Caso de actualización parcial: Solo categoría.
        """
        # ARRANGE
        updated_permission = sample_permission.copy()
        updated_permission['categoria'] = 'nueva_cat'
        mock_permission_repository.update_permission.return_value = (updated_permission, None)
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(
            permission_id=999,
            category="nueva_cat"
        )
        
        # ASSERT
        assert error is None
        
        mock_permission_repository.update_permission.assert_called_once_with(
            permission_id=999,
            description=None,
            category="nueva_cat",
            usr_modf="system"
        )
    
    def test_update_permission_with_none_values_does_nothing(self, mock_permission_repository, sample_permission):
        """
        Edge case: Llamar update sin especificar nada (todos None).
        
        Esto es técnicamente válido pero no hace nada útil.
        El repository debe manejar este caso (no actualizar nada).
        """
        # ARRANGE
        mock_permission_repository.update_permission.return_value = (sample_permission, None)
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(permission_id=999)
        
        # ASSERT
        assert error is None
        
        mock_permission_repository.update_permission.assert_called_once_with(
            permission_id=999,
            description=None,
            category=None,
            usr_modf="system"
        )
    
    # =========================================================================
    # VALIDACIONES - Longitud
    # =========================================================================
    
    def test_description_too_long(self, mock_permission_repository):
        """
        Validación: Descripción no puede exceder 255 caracteres.
        """
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        
        long_description = "a" * 256
        
        result, error = use_case.execute(
            permission_id=999,
            description=long_description
        )
        
        assert error == "PERMISSION_DESCRIPTION_TOO_LONG"
        assert result is None
        mock_permission_repository.update_permission.assert_not_called()
    
    def test_description_exactly_255_chars_is_valid(self, mock_permission_repository, sample_permission):
        """
        Edge case: Descripción con exactamente 255 caracteres es válida.
        """
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.update_permission.return_value = (sample_permission, None)
        
        description_255 = "a" * 255
        
        result, error = use_case.execute(
            permission_id=999,
            description=description_255
        )
        
        assert error is None
        assert result is not None
    
    def test_category_too_long(self, mock_permission_repository):
        """
        Validación: Categoría no puede exceder 50 caracteres.
        """
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        
        long_category = "a" * 51
        
        result, error = use_case.execute(
            permission_id=999,
            category=long_category
        )
        
        assert error == "PERMISSION_CATEGORY_TOO_LONG"
        assert result is None
        mock_permission_repository.update_permission.assert_not_called()
    
    def test_category_exactly_50_chars_is_valid(self, mock_permission_repository, sample_permission):
        """
        Edge case: Categoría con exactamente 50 caracteres es válida.
        """
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.update_permission.return_value = (sample_permission, None)
        
        category_50 = "a" * 50
        
        result, error = use_case.execute(
            permission_id=999,
            category=category_50
        )
        
        assert error is None
        assert result is not None
    
    # =========================================================================
    # REGLAS DE NEGOCIO - Protección de permisos de sistema
    # =========================================================================
    
    def test_cannot_update_system_permission(self, mock_permission_repository):
        """
        Regla de negocio: Permisos de sistema NO pueden editarse.
        
        El repository retorna error PERMISSION_SYSTEM_PROTECTED cuando
        se intenta modificar un permiso con es_sistema=True.
        
        Razón: Los permisos de sistema son parte de la arquitectura del app.
        Modificarlos puede romper funcionalidades críticas.
        """
        # ARRANGE
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.update_permission.return_value = (None, "PERMISSION_SYSTEM_PROTECTED")
        
        # ACT
        result, error = use_case.execute(
            permission_id=1,  # Permiso de sistema
            description="Intentando modificar permiso del sistema"
        )
        
        # ASSERT
        assert error == "PERMISSION_SYSTEM_PROTECTED"
        assert result is None
    
    def test_permission_not_found(self, mock_permission_repository):
        """
        Validación: El repository retorna error si el permiso no existe.
        """
        # ARRANGE
        use_case = UpdatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.update_permission.return_value = (None, "PERMISSION_NOT_FOUND")
        
        # ACT
        result, error = use_case.execute(
            permission_id=99999,  # ID inexistente
            description="Nueva descripción"
        )
        
        # ASSERT
        assert error == "PERMISSION_NOT_FOUND"
        assert result is None


class TestUpdatePermissionBusinessRules:
    """
    Documentación de reglas de negocio para UpdatePermissionUseCase.
    """
    
    def test_why_cannot_update_code_resource_action(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué NO se puede cambiar code/resource/action?
        
        Problema:
        - Si permitimos cambiar código, todos los roles que tienen ese permiso
          quedarían con referencia rota
        - Si cambiamos resource/action, el código ya no coincidiría (violación de BR)
        
        Solución:
        - UpdatePermission solo permite cambiar campos "cosméticos" (descripción, categoría)
        - Si necesitas cambiar el código, debes:
          1. Crear un nuevo permiso con el código correcto
          2. Asignarlo a los roles que lo necesitan
          3. Eliminar el permiso viejo (si no está en uso)
        
        Trade-off:
        - ✅ Integridad referencial garantizada
        - ✅ No hay permisos "huérfanos" después de rename
        - ❌ Menos flexible (rename requiere crear+asignar+delete)
        
        Patrón aplicado: Immutability - los identificadores son inmutables
        """
        pass
    
    def test_why_system_permissions_are_protected(self):
        """
        DECISIÓN DE SEGURIDAD: ¿Por qué protegemos permisos de sistema?
        
        Escenario de riesgo:
        - Permiso "users:create" es necesario para la funcionalidad de onboarding
        - Un admin accidentalmente lo edita y rompe el flujo de creación de usuarios
        - Ahora nadie puede crear usuarios nuevos (sistema roto)
        
        Solución:
        - Permisos marcados con es_sistema=True son read-only
        - Se crean en migraciones de BD, no desde UI
        - Solo se pueden modificar con acceso directo a BD (DBA level)
        
        Patrón aplicado: Fail Safe - prevenir errores catastróficos
        """
        pass

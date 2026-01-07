"""
Tests unitarios para UpdateRoleUseCase.

Patrón: Arrange-Act-Assert (AAA)
Objetivo: Verificar que la actualización de roles valida correctamente
          y protege roles del sistema.
"""

from unittest.mock import Mock

import pytest
from src.use_cases.roles.update_role import UpdateRoleUseCase


class TestUpdateRoleUseCase:
    """
    Test suite para UpdateRoleUseCase.
    
    Cobertura:
    - ✅ Happy path: Actualización exitosa (nombre, descripción, priority)
    - ❌ Validaciones de entrada (mismas que create)
    - ❌ Reglas de negocio (rol no existe, rol sistema protegido)
    - ❌ Edge cases (actualización parcial, sin campos)
    """

    # ==========================================================================
    # HAPPY PATH - Casos exitosos
    # ==========================================================================

    def test_update_role_name_success(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Actualizar solo el nombre del rol.
        
        Verifica que se puede actualizar un campo individual sin tocar otros.
        """
        # ARRANGE
        updated_role = sample_role.copy()
        updated_role['nombre'] = 'UPDATED_NAME'
        
        mock_role_repository.update.return_value = (updated_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='updated_name'  # Se convertirá a mayúsculas
        )
        
        # ASSERT
        assert error is None
        assert result is not None
        assert result['nombre'] == 'UPDATED_NAME'
        
        # Verificar que se llamó al repository con parámetros correctos
        mock_role_repository.update.assert_called_once_with(
            role_id=999,
            usr_modf='admin',
            rol='UPDATED_NAME'  # Convertido a mayúsculas
        )

    def test_update_role_description_success(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Actualizar solo la descripción.
        """
        # ARRANGE
        updated_role = sample_role.copy()
        updated_role['descripcion'] = 'Nueva descripción'
        
        mock_role_repository.update.return_value = (updated_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            desc_rol='Nueva descripción'
        )
        
        # ASSERT
        assert error is None
        mock_role_repository.update.assert_called_once_with(
            role_id=999,
            usr_modf='admin',
            desc_rol='Nueva descripción'
        )

    def test_update_role_multiple_fields(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Actualizar múltiples campos a la vez.
        
        Verifica que se pueden actualizar varios campos en una sola operación.
        """
        # ARRANGE
        updated_role = sample_role.copy()
        updated_role['nombre'] = 'NEW_ROLE'
        updated_role['descripcion'] = 'Nueva desc'
        updated_role['priority'] = 5
        
        mock_role_repository.update.return_value = (updated_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='new_role',
            desc_rol='Nueva desc',
            priority=5,
            landing_route='/new/route'
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.update.call_args.kwargs
        assert call_kwargs['rol'] == 'NEW_ROLE'
        assert call_kwargs['desc_rol'] == 'Nueva desc'
        assert call_kwargs['priority'] == 5
        assert call_kwargs['landing_route'] == '/new/route'

    def test_update_role_trims_whitespace(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Limpia espacios en blanco antes de actualizar.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (sample_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='  TRIMMED  ',
            desc_rol='  Descripción con espacios  '
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.update.call_args.kwargs
        assert call_kwargs['rol'] == 'TRIMMED'
        assert call_kwargs['desc_rol'] == 'Descripción con espacios'

    def test_update_role_landing_route_to_none(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Limpiar landing_route (establecerlo en None).
        
        Útil para remover rutas configuradas previamente.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (sample_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - String vacío debe convertirse a None
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            landing_route='   '  # Solo espacios
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.update.call_args.kwargs
        assert call_kwargs['landing_route'] is None

    # ==========================================================================
    # VALIDACIONES - Casos de error por datos inválidos
    # ==========================================================================

    def test_update_role_no_fields_provided(self, mock_role_repository):
        """
        Error: Intentar actualizar sin proporcionar campos.
        
        Código de error esperado: NO_FIELDS_TO_UPDATE
        
        No tiene sentido hacer un UPDATE sin cambiar nada.
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - Llamar sin kwargs
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin'
            # No se pasa ningún campo para actualizar
        )
        
        # ASSERT
        assert result is None
        assert error == 'NO_FIELDS_TO_UPDATE'
        mock_role_repository.update.assert_not_called()

    def test_update_role_name_required(self, mock_role_repository):
        """
        Error: Intentar actualizar nombre a vacío.
        
        Código de error esperado: ROLE_NAME_REQUIRED
        
        Si se intenta actualizar el nombre, no puede ser vacío.
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # Caso 1: String vacío
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol=''
        )
        assert error == 'ROLE_NAME_REQUIRED'
        
        # Caso 2: Solo espacios
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='   '
        )
        assert error == 'ROLE_NAME_REQUIRED'
        
        mock_role_repository.update.assert_not_called()

    def test_update_role_name_invalid_characters(self, mock_role_repository):
        """
        Error: Nombre con caracteres inválidos.
        
        Código de error esperado: ROLE_NAME_INVALID
        
        Mismas reglas que create: solo A-Z, 0-9, espacios, guiones.
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # Caracteres especiales
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='INVALID@NAME'
        )
        assert error == 'ROLE_NAME_INVALID'
        
        # Tildes
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='MÉDICO'
        )
        assert error == 'ROLE_NAME_INVALID'
        
        mock_role_repository.update.assert_not_called()

    def test_update_role_name_too_long(self, mock_role_repository):
        """
        Error: Nombre excede 50 caracteres.
        
        Código de error esperado: ROLE_NAME_TOO_LONG
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        long_name = 'A' * 51
        
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol=long_name
        )
        
        assert result is None
        assert error == 'ROLE_NAME_TOO_LONG'
        mock_role_repository.update.assert_not_called()

    def test_update_role_description_required(self, mock_role_repository):
        """
        Error: Intentar actualizar descripción a vacío.
        
        Código de error esperado: ROLE_DESCRIPTION_REQUIRED
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            desc_rol=''
        )
        
        assert error == 'ROLE_DESCRIPTION_REQUIRED'
        mock_role_repository.update.assert_not_called()

    def test_update_role_description_too_long(self, mock_role_repository):
        """
        Error: Descripción excede 200 caracteres.
        
        Código de error esperado: ROLE_DESCRIPTION_TOO_LONG
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        long_desc = 'A' * 201
        
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            desc_rol=long_desc
        )
        
        assert result is None
        assert error == 'ROLE_DESCRIPTION_TOO_LONG'
        mock_role_repository.update.assert_not_called()

    def test_update_role_invalid_priority(self, mock_role_repository):
        """
        Error: Priority negativo.
        
        Código de error esperado: INVALID_PRIORITY
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            priority=-1
        )
        
        assert result is None
        assert error == 'INVALID_PRIORITY'
        mock_role_repository.update.assert_not_called()

    def test_update_role_invalid_landing_route(self, mock_role_repository):
        """
        Error: landing_route no empieza con '/'.
        
        Código de error esperado: INVALID_LANDING_ROUTE
        """
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            landing_route='invalid/route'  # Falta /
        )
        
        assert result is None
        assert error == 'INVALID_LANDING_ROUTE'
        mock_role_repository.update.assert_not_called()

    # ==========================================================================
    # REGLAS DE NEGOCIO - Errores del repository
    # ==========================================================================

    def test_update_role_not_found(self, mock_role_repository):
        """
        Error de negocio: Intentar actualizar rol que no existe.
        
        Código de error esperado: ROLE_NOT_FOUND (retornado por repository)
        
        El repository verifica existencia antes de actualizar.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (None, 'ROLE_NOT_FOUND')
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=99999,  # ID que no existe
            usr_modf='admin',
            desc_rol='Nueva descripción'
        )
        
        # ASSERT
        assert result is None
        assert error == 'ROLE_NOT_FOUND'
        mock_role_repository.update.assert_called_once()

    def test_update_role_system_protected(self, mock_role_repository):
        """
        Error de negocio: Intentar editar rol del sistema.
        
        Código de error esperado: ROLE_SYSTEM_PROTECTED
        
        Los roles con es_sistema=True NO pueden editarse (ej: ADMIN, SUPER_ADMIN).
        Esto previene romper la lógica del sistema.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (None, 'ROLE_SYSTEM_PROTECTED')
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=1,  # ID de rol sistema
            usr_modf='admin',
            desc_rol='Intentando editar ADMIN'
        )
        
        # ASSERT
        assert result is None
        assert error == 'ROLE_SYSTEM_PROTECTED'

    def test_update_role_duplicate_name(self, mock_role_repository):
        """
        Error de negocio: Cambiar nombre a uno que ya existe.
        
        Código de error esperado: ROLE_NAME_DUPLICATE
        
        No pueden existir dos roles con el mismo nombre.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (None, 'ROLE_NAME_DUPLICATE')
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol='EXISTING_ROLE'
        )
        
        # ASSERT
        assert result is None
        assert error == 'ROLE_NAME_DUPLICATE'

    def test_update_role_database_error(self, mock_role_repository):
        """
        Error de infraestructura: Falla al actualizar en BD.
        
        Código de error esperado: DATABASE_ERROR
        """
        # ARRANGE
        mock_role_repository.update.return_value = (None, 'DATABASE_ERROR')
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            desc_rol='Nueva descripción'
        )
        
        # ASSERT
        assert result is None
        assert error == 'DATABASE_ERROR'

    # ==========================================================================
    # EDGE CASES - Casos límite
    # ==========================================================================

    def test_update_role_name_exactly_50_chars(self, mock_role_repository, sample_role):
        """
        Edge case: Actualizar nombre con exactamente 50 caracteres.
        
        Debe ser válido (límite permitido).
        """
        # ARRANGE
        mock_role_repository.update.return_value = (sample_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        exact_limit_name = 'A' * 50
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            rol=exact_limit_name
        )
        
        # ASSERT
        assert error is None
        assert result is not None

    def test_update_role_priority_to_zero(self, mock_role_repository, sample_role):
        """
        Edge case: Cambiar priority a 0 (máxima prioridad).
        
        Debe ser válido.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (sample_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            priority=0
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.update.call_args.kwargs
        assert call_kwargs['priority'] == 0

    def test_update_role_only_landing_route(self, mock_role_repository, sample_role):
        """
        Edge case: Actualizar solo landing_route (sin tocar nombre ni descripción).
        
        Verifica que se pueden actualizar campos opcionales solos.
        """
        # ARRANGE
        mock_role_repository.update.return_value = (sample_role, None)
        use_case = UpdateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            role_id=999,
            usr_modf='admin',
            landing_route='/new/dashboard'
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.update.call_args.kwargs
        assert 'landing_route' in call_kwargs
        assert 'rol' not in call_kwargs
        assert 'desc_rol' not in call_kwargs

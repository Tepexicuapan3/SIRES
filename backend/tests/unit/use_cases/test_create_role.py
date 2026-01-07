"""
Tests unitarios para CreateRoleUseCase.

Patrón de testing: Arrange-Act-Assert (AAA)
- Arrange: Configurar mocks y datos de prueba
- Act: Ejecutar el use case
- Assert: Verificar resultado esperado

Principio SOLID aplicado: Dependency Inversion
- El use case depende de RoleRepository (abstracción)
- En tests, inyectamos un mock en lugar del repository real
- Esto permite tests rápidos sin base de datos
"""

from unittest.mock import Mock

import pytest
from src.use_cases.roles.create_role import CreateRoleUseCase


class TestCreateRoleUseCase:
    """
    Test suite para CreateRoleUseCase.
    
    Cobertura:
    - ✅ Happy path: Creación exitosa
    - ❌ Validaciones de entrada (nombre, descripción, formato)
    - ❌ Reglas de negocio (duplicados, límites)
    - ❌ Manejo de errores de repository
    """

    # ==========================================================================
    # HAPPY PATH - Casos exitosos
    # ==========================================================================

    def test_create_role_success(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Crear un rol válido.
        
        Verifica que:
        1. El use case valida correctamente los datos
        2. Llama al repository con los parámetros correctos
        3. Retorna el rol creado sin errores
        
        Principio: Test Isolation - El mock evita dependencia de BD real.
        """
        # ARRANGE - Configurar el mock para simular creación exitosa
        expected_role = sample_role.copy()
        expected_role['nombre'] = 'ENFERMERIA'
        expected_role['descripcion'] = 'Personal de enfermería'
        
        mock_role_repository.create.return_value = (expected_role, None)
        
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - Ejecutar el use case
        result, error = use_case.execute(
            rol='enfermeria',  # Se convertirá a mayúsculas
            desc_rol='Personal de enfermería',
            tp_rol='CLINICO',
            landing_route='/enfermeria/dashboard',
            priority=10,
            is_admin=False,
            usr_alta='admin'
        )
        
        # ASSERT - Verificar resultado
        assert error is None, "No debe haber error en caso exitoso"
        assert result is not None, "Debe retornar el rol creado"
        assert result['nombre'] == 'ENFERMERIA', "El nombre debe estar en mayúsculas"
        
        # Verificar que se llamó al repository con parámetros correctos
        mock_role_repository.create.assert_called_once_with(
            rol='ENFERMERIA',  # Convertido a mayúsculas
            desc_rol='Personal de enfermería',
            tp_rol='CLINICO',
            landing_route='/enfermeria/dashboard',
            priority=10,
            is_admin=False,
            usr_alta='admin'
        )

    def test_create_role_minimal_params(self, mock_role_repository, sample_role):
        """
        Caso exitoso: Crear rol solo con parámetros mínimos requeridos.
        
        Verifica que los parámetros opcionales usan valores por defecto correctos.
        """
        # ARRANGE
        mock_role_repository.create.return_value = (sample_role, None)
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            rol='MEDICO',
            desc_rol='Personal médico'
            # Resto usa defaults
        )
        
        # ASSERT
        assert error is None
        assert result is not None
        
        # Verificar defaults aplicados
        call_kwargs = mock_role_repository.create.call_args.kwargs
        assert call_kwargs['tp_rol'] == 'ADMIN', "Default tp_rol debe ser ADMIN"
        assert call_kwargs['priority'] == 999, "Default priority debe ser 999"
        assert call_kwargs['is_admin'] is False, "Default is_admin debe ser False"
        assert call_kwargs['usr_alta'] == 'system', "Default usr_alta debe ser system"

    def test_create_role_trims_whitespace(self, mock_role_repository, sample_role):
        """
        Caso exitoso: El use case limpia espacios en blanco.
        
        Verifica que los strings se limpian (trim) antes de procesarse.
        Esto previene errores por espacios accidentales.
        """
        # ARRANGE
        mock_role_repository.create.return_value = (sample_role, None)
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - Enviar con espacios extras
        result, error = use_case.execute(
            rol='  ADMIN  ',
            desc_rol='  Administrador del sistema  '
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.create.call_args.kwargs
        assert call_kwargs['rol'] == 'ADMIN', "Debe remover espacios del nombre"
        assert call_kwargs['desc_rol'] == 'Administrador del sistema', "Debe remover espacios de descripción"

    def test_create_role_landing_route_optional(self, mock_role_repository, sample_role):
        """
        Caso exitoso: landing_route es opcional.
        
        Si no se proporciona o está vacío, debe ser None (no string vacío).
        """
        # ARRANGE
        mock_role_repository.create.return_value = (sample_role, None)
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - Sin landing_route
        result, error = use_case.execute(
            rol='REGISTRO',
            desc_rol='Personal de registro'
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.create.call_args.kwargs
        assert call_kwargs['landing_route'] is None, "landing_route debe ser None si no se proporciona"

    # ==========================================================================
    # VALIDACIONES - Casos de error por datos inválidos
    # ==========================================================================

    def test_create_role_name_required(self, mock_role_repository):
        """
        Error: Nombre de rol vacío o solo espacios.
        
        Código de error esperado: ROLE_NAME_REQUIRED
        
        Casos a probar:
        - String vacío ''
        - Solo espacios '   '
        - None
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # Caso 1: String vacío
        result, error = use_case.execute(rol='', desc_rol='Descripción válida')
        assert result is None, "No debe retornar rol si nombre vacío"
        assert error == 'ROLE_NAME_REQUIRED', "Debe retornar error ROLE_NAME_REQUIRED"
        
        # Caso 2: Solo espacios
        result, error = use_case.execute(rol='   ', desc_rol='Descripción válida')
        assert result is None
        assert error == 'ROLE_NAME_REQUIRED'
        
        # Verificar que NO se llamó al repository (falló antes)
        mock_role_repository.create.assert_not_called()

    def test_create_role_name_invalid_characters(self, mock_role_repository):
        """
        Error: Nombre con caracteres inválidos.
        
        Código de error esperado: ROLE_NAME_INVALID
        
        Formato válido: Solo letras, números, espacios, guiones, underscores (A-Z, 0-9)
        
        Casos inválidos:
        - Caracteres especiales: @#$%
        - Tildes: MEDICO con acento
        - Emojis
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # Caso 1: Caracteres especiales
        result, error = use_case.execute(rol='ADMIN@2024', desc_rol='Descripción')
        assert error == 'ROLE_NAME_INVALID'
        
        # Caso 2: Tildes (comunes en español)
        result, error = use_case.execute(rol='MÉDICO', desc_rol='Descripción')
        assert error == 'ROLE_NAME_INVALID'
        
        # Caso 3: Símbolos
        result, error = use_case.execute(rol='ADMIN$', desc_rol='Descripción')
        assert error == 'ROLE_NAME_INVALID'
        
        mock_role_repository.create.assert_not_called()

    def test_create_role_name_too_long(self, mock_role_repository):
        """
        Error: Nombre excede 50 caracteres.
        
        Código de error esperado: ROLE_NAME_TOO_LONG
        
        Límite: 50 caracteres (definido en schema de BD)
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # Generar nombre de 51 caracteres
        long_name = 'A' * 51
        
        result, error = use_case.execute(rol=long_name, desc_rol='Descripción válida')
        
        assert result is None
        assert error == 'ROLE_NAME_TOO_LONG'
        mock_role_repository.create.assert_not_called()

    def test_create_role_description_required(self, mock_role_repository):
        """
        Error: Descripción vacía.
        
        Código de error esperado: ROLE_DESCRIPTION_REQUIRED
        
        La descripción es obligatoria para claridad del sistema.
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # Caso 1: String vacío
        result, error = use_case.execute(rol='ADMIN', desc_rol='')
        assert error == 'ROLE_DESCRIPTION_REQUIRED'
        
        # Caso 2: Solo espacios
        result, error = use_case.execute(rol='ADMIN', desc_rol='   ')
        assert error == 'ROLE_DESCRIPTION_REQUIRED'
        
        mock_role_repository.create.assert_not_called()

    def test_create_role_description_too_long(self, mock_role_repository):
        """
        Error: Descripción excede 200 caracteres.
        
        Código de error esperado: ROLE_DESCRIPTION_TOO_LONG
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        long_description = 'A' * 201
        
        result, error = use_case.execute(rol='ADMIN', desc_rol=long_description)
        
        assert result is None
        assert error == 'ROLE_DESCRIPTION_TOO_LONG'
        mock_role_repository.create.assert_not_called()

    def test_create_role_invalid_priority(self, mock_role_repository):
        """
        Error: Priority negativo.
        
        Código de error esperado: INVALID_PRIORITY
        
        Priority determina el orden de prioridad de roles.
        Debe ser >= 0 (menor número = mayor prioridad).
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        result, error = use_case.execute(
            rol='ADMIN',
            desc_rol='Administrador',
            priority=-1  # Inválido
        )
        
        assert result is None
        assert error == 'INVALID_PRIORITY'
        mock_role_repository.create.assert_not_called()

    def test_create_role_invalid_landing_route(self, mock_role_repository):
        """
        Error: landing_route no empieza con '/'.
        
        Código de error esperado: INVALID_LANDING_ROUTE
        
        Las rutas deben ser absolutas (empezar con /).
        Ejemplo válido: /admin/dashboard
        Ejemplo inválido: admin/dashboard
        """
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        result, error = use_case.execute(
            rol='ADMIN',
            desc_rol='Administrador',
            landing_route='admin/dashboard'  # Falta el / inicial
        )
        
        assert result is None
        assert error == 'INVALID_LANDING_ROUTE'
        mock_role_repository.create.assert_not_called()

    # ==========================================================================
    # REGLAS DE NEGOCIO - Errores del repository
    # ==========================================================================

    def test_create_role_duplicate_name(self, mock_role_repository):
        """
        Error de negocio: Ya existe un rol con ese nombre.
        
        Código de error esperado: ROLE_NAME_DUPLICATE (retornado por repository)
        
        El repository verifica duplicados en BD.
        El use case solo propaga el error.
        """
        # ARRANGE - Simular que el repository detecta duplicado
        mock_role_repository.create.return_value = (None, 'ROLE_NAME_DUPLICATE')
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            rol='ADMIN',
            desc_rol='Rol duplicado'
        )
        
        # ASSERT
        assert result is None
        assert error == 'ROLE_NAME_DUPLICATE'
        
        # Verificar que SÍ llamó al repository (pasó validaciones)
        mock_role_repository.create.assert_called_once()

    def test_create_role_database_error(self, mock_role_repository):
        """
        Error de infraestructura: Falla al guardar en BD.
        
        Código de error esperado: DATABASE_ERROR (retornado por repository)
        
        El use case no maneja errores de BD directamente,
        solo los propaga al cliente.
        """
        # ARRANGE
        mock_role_repository.create.return_value = (None, 'DATABASE_ERROR')
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            rol='NUEVO_ROL',
            desc_rol='Descripción válida'
        )
        
        # ASSERT
        assert result is None
        assert error == 'DATABASE_ERROR'

    # ==========================================================================
    # EDGE CASES - Casos límite
    # ==========================================================================

    def test_create_role_name_exactly_50_chars(self, mock_role_repository, sample_role):
        """
        Edge case: Nombre con exactamente 50 caracteres (límite permitido).
        
        Debe ser aceptado (50 es válido, 51 es inválido).
        """
        # ARRANGE
        mock_role_repository.create.return_value = (sample_role, None)
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # Generar nombre de EXACTAMENTE 50 caracteres
        exact_limit_name = 'A' * 50
        
        # ACT
        result, error = use_case.execute(
            rol=exact_limit_name,
            desc_rol='Descripción válida'
        )
        
        # ASSERT
        assert error is None, "50 caracteres debe ser válido"
        assert result is not None

    def test_create_role_priority_zero(self, mock_role_repository, sample_role):
        """
        Edge case: Priority = 0 (mayor prioridad posible).
        
        Debe ser válido (solo negativos son inválidos).
        """
        # ARRANGE
        mock_role_repository.create.return_value = (sample_role, None)
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        result, error = use_case.execute(
            rol='SUPER_ADMIN',
            desc_rol='Prioridad máxima',
            priority=0
        )
        
        # ASSERT
        assert error is None, "Priority 0 debe ser válido"
        call_kwargs = mock_role_repository.create.call_args.kwargs
        assert call_kwargs['priority'] == 0

    def test_create_role_landing_route_empty_string_becomes_none(self, mock_role_repository, sample_role):
        """
        Edge case: landing_route como string vacío.
        
        Debe convertirse a None (no guardar strings vacíos en BD).
        """
        # ARRANGE
        mock_role_repository.create.return_value = (sample_role, None)
        use_case = CreateRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - Enviar string vacío
        result, error = use_case.execute(
            rol='TEST',
            desc_rol='Test',
            landing_route='   '  # Solo espacios
        )
        
        # ASSERT
        assert error is None
        call_kwargs = mock_role_repository.create.call_args.kwargs
        assert call_kwargs['landing_route'] is None, "String vacío debe convertirse a None"


# ==============================================================================
# TESTS DE INTEGRACIÓN (Comentados - Requieren BD real)
# ==============================================================================

# @pytest.mark.integration
# def test_create_role_integration_real_db():
#     """
#     Test de integración con BD real.
#     
#     TODO: Implementar cuando tengamos fixtures de BD de prueba.
#     
#     Verifica:
#     - Conexión a BD de test
#     - Inserción real en tabla roles
#     - Rollback después del test
#     """
#     pytest.skip("Integration tests not configured yet")

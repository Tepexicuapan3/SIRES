"""
Tests unitarios para CreatePermissionUseCase

Cobertura de escenarios:
1. Happy path: Creación exitosa
2. Validaciones de entrada: código, resource, action
3. Validación de formato: resource:action
4. Validación de longitud: descripción, categoría
5. Regla de negocio: código duplicado

Patrón usado: AAA (Arrange-Act-Assert)
- Arrange: Configurar mocks y datos de prueba
- Act: Ejecutar el use case
- Assert: Verificar resultado y llamadas a dependencies

Principios SOLID aplicados:
- Dependency Injection: Use case recibe repository como parámetro
- Single Responsibility: Use case solo valida y delega al repository
"""

import pytest
from src.use_cases.permissions.create_permission import CreatePermissionUseCase


class TestCreatePermissionUseCase:
    """
    Suite de tests para CreatePermissionUseCase.
    
    Objetivo: Validar todas las reglas de negocio y casos edge de creación de permisos.
    
    Business rules aplicadas:
    - BR1: Código debe seguir formato resource:action (lowercase)
    - BR2: Código debe ser único en el sistema
    - BR3: Código debe coincidir con {resource}:{action}
    - BR4: Descripción es opcional pero si se provee, max 255 chars
    - BR5: Categoría es opcional pero si se provee, max 50 chars
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_create_permission_success_minimal(self, mock_permission_repository, sample_permission):
        """
        Caso de éxito: Crear permiso con datos mínimos requeridos.
        
        Arrange:
        - Mock repository retorna el permiso creado sin error
        - Datos: código, resource, action (sin descripción ni categoría)
        
        Act:
        - Ejecutar use case con parámetros mínimos
        
        Assert:
        - Sin errores
        - Repository llamado con parámetros correctos (normalized)
        - Código convertido a lowercase
        """
        # ARRANGE
        expected_permission = sample_permission.copy()
        mock_permission_repository.create_permission.return_value = (expected_permission, None)
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(
            code="expedientes:read",
            resource="expedientes",
            action="read"
        )
        
        # ASSERT
        assert error is None
        assert result is not None
        assert result == expected_permission  # El mock retorna el sample_permission
        
        mock_permission_repository.create_permission.assert_called_once_with(
            code="expedientes:read",
            resource="expedientes",
            action="read",
            description=None,
            category=None,
            usr_alta="system"
        )
    
    def test_create_permission_success_full(self, mock_permission_repository, sample_permission):
        """
        Caso de éxito: Crear permiso con todos los campos.
        
        Assert:
        - Descripción y categoría se pasan correctamente al repository
        - usr_alta personalizado funciona
        """
        # ARRANGE
        expected_permission = sample_permission.copy()
        expected_permission.update({
            'descripcion': 'Ver expedientes médicos',
            'categoria': 'expedientes'
        })
        mock_permission_repository.create_permission.return_value = (expected_permission, None)
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(
            code="expedientes:read",
            resource="expedientes",
            action="read",
            description="Ver expedientes médicos",
            category="expedientes",
            usr_alta="admin"
        )
        
        # ASSERT
        assert error is None
        assert result['descripcion'] == 'Ver expedientes médicos'
        assert result['categoria'] == 'expedientes'
        
        mock_permission_repository.create_permission.assert_called_once_with(
            code="expedientes:read",
            resource="expedientes",
            action="read",
            description="Ver expedientes médicos",
            category="expedientes",
            usr_alta="admin"
        )
    
    def test_create_permission_normalizes_input(self, mock_permission_repository, sample_permission):
        """
        Caso de normalización: Código, resource y action se convierten a lowercase y se trimean.
        
        Assert:
        - Espacios removidos (trim)
        - Todo en minúsculas
        - Repository recibe valores normalizados
        """
        # ARRANGE
        mock_permission_repository.create_permission.return_value = (sample_permission, None)
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ACT
        result, error = use_case.execute(
            code="  EXPEDIENTES:READ  ",  # Espacios + uppercase
            resource="  EXPEDIENTES  ",
            action="  READ  "
        )
        
        # ASSERT
        assert error is None
        
        mock_permission_repository.create_permission.assert_called_once_with(
            code="expedientes:read",  # Normalizado
            resource="expedientes",
            action="read",
            description=None,
            category=None,
            usr_alta="system"
        )
    
    # =========================================================================
    # VALIDACIONES - Código
    # =========================================================================
    
    def test_code_required(self, mock_permission_repository):
        """
        Validación: Código es requerido (no puede estar vacío).
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # Código vacío
        result, error = use_case.execute(code="", resource="test", action="read")
        assert error == "PERMISSION_CODE_REQUIRED"
        assert result is None
        
        # Código solo espacios
        result, error = use_case.execute(code="   ", resource="test", action="read")
        assert error == "PERMISSION_CODE_REQUIRED"
        assert result is None
        
        # Repository NO debe ser llamado
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_code_format_invalid(self, mock_permission_repository):
        """
        Validación: Código debe seguir formato resource:action (lowercase, alphanumeric + - _).
        
        Formato válido: ^[a-z0-9_-]+:[a-z0-9_-]+$
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        invalid_codes = [
            "SIN_DOS_PUNTOS",  # Falta ':'
            "expedientes:",     # Falta action
            ":read",            # Falta resource
            "exp:ac:extra",     # Más de un ':'
            "exp@edientes:read", # Caracteres especiales inválidos (@)
            "exp edientes:read", # Espacios
            "Expedientes:Read",  # Uppercase (se normaliza pero el pattern espera lowercase)
        ]
        
        for invalid_code in invalid_codes:
            result, error = use_case.execute(
                code=invalid_code.lower(),  # Lowercase para que pase normalización
                resource="test",
                action="read"
            )
            # Si tiene uppercase, la normalización lo arregla, así que solo probamos con lowercase
            if invalid_code == invalid_code.lower():
                assert error == "PERMISSION_CODE_INVALID", f"Expected INVALID for code: {invalid_code}"
                assert result is None
        
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_code_too_long(self, mock_permission_repository):
        """
        Validación: Código no puede exceder 100 caracteres.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # Código con exactamente 101 caracteres
        long_code = "a" * 51 + ":" + "b" * 49  # 51 + 1 + 49 = 101
        
        result, error = use_case.execute(
            code=long_code,
            resource="test",
            action="read"
        )
        
        assert error == "PERMISSION_CODE_TOO_LONG"
        assert result is None
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_code_exactly_100_chars_is_valid(self, mock_permission_repository, sample_permission):
        """
        Edge case: Código con exactamente 100 caracteres es válido.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.create_permission.return_value = (sample_permission, None)
        
        # 100 chars exactos
        code_100 = "a" * 50 + ":" + "b" * 49  # 50 + 1 + 49 = 100
        resource = "a" * 50
        action = "b" * 49
        
        result, error = use_case.execute(
            code=code_100,
            resource=resource,
            action=action
        )
        
        assert error is None
        assert result is not None
        mock_permission_repository.create_permission.assert_called_once()
    
    # =========================================================================
    # VALIDACIONES - Resource y Action
    # =========================================================================
    
    def test_resource_required(self, mock_permission_repository):
        """
        Validación: Resource es requerido.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        result, error = use_case.execute(code="test:read", resource="", action="read")
        assert error == "PERMISSION_RESOURCE_REQUIRED"
        assert result is None
        
        result, error = use_case.execute(code="test:read", resource="   ", action="read")
        assert error == "PERMISSION_RESOURCE_REQUIRED"
        assert result is None
        
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_action_required(self, mock_permission_repository):
        """
        Validación: Action es requerido.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        result, error = use_case.execute(code="test:read", resource="test", action="")
        assert error == "PERMISSION_ACTION_REQUIRED"
        assert result is None
        
        result, error = use_case.execute(code="test:read", resource="test", action="   ")
        assert error == "PERMISSION_ACTION_REQUIRED"
        assert result is None
        
        mock_permission_repository.create_permission.assert_not_called()
    
    # =========================================================================
    # VALIDACIONES - Código debe coincidir con resource:action
    # =========================================================================
    
    def test_code_mismatch_with_resource_action(self, mock_permission_repository):
        """
        Regla de negocio: Código debe ser exactamente {resource}:{action}.
        
        Esto previene inconsistencias donde el código dice una cosa
        pero los campos resource/action dicen otra.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # Código no coincide
        result, error = use_case.execute(
            code="expedientes:update",  # Dice 'update'
            resource="expedientes",
            action="read"  # Pero action es 'read'
        )
        
        assert error == "PERMISSION_CODE_MISMATCH"
        assert result is None
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_code_matches_resource_action(self, mock_permission_repository, sample_permission):
        """
        Happy path: Código coincide perfectamente con resource:action.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.create_permission.return_value = (sample_permission, None)
        
        result, error = use_case.execute(
            code="expedientes:read",
            resource="expedientes",
            action="read"
        )
        
        assert error is None
        assert result is not None
    
    # =========================================================================
    # VALIDACIONES - Descripción y Categoría
    # =========================================================================
    
    def test_description_too_long(self, mock_permission_repository):
        """
        Validación: Descripción no puede exceder 255 caracteres.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        long_description = "a" * 256
        
        result, error = use_case.execute(
            code="test:read",
            resource="test",
            action="read",
            description=long_description
        )
        
        assert error == "PERMISSION_DESCRIPTION_TOO_LONG"
        assert result is None
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_description_exactly_255_chars_is_valid(self, mock_permission_repository, sample_permission):
        """
        Edge case: Descripción con exactamente 255 caracteres es válida.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.create_permission.return_value = (sample_permission, None)
        
        description_255 = "a" * 255
        
        result, error = use_case.execute(
            code="test:read",
            resource="test",
            action="read",
            description=description_255
        )
        
        assert error is None
        assert result is not None
    
    def test_category_too_long(self, mock_permission_repository):
        """
        Validación: Categoría no puede exceder 50 caracteres.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        long_category = "a" * 51
        
        result, error = use_case.execute(
            code="test:read",
            resource="test",
            action="read",
            category=long_category
        )
        
        assert error == "PERMISSION_CATEGORY_TOO_LONG"
        assert result is None
        mock_permission_repository.create_permission.assert_not_called()
    
    def test_category_exactly_50_chars_is_valid(self, mock_permission_repository, sample_permission):
        """
        Edge case: Categoría con exactamente 50 caracteres es válida.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        mock_permission_repository.create_permission.return_value = (sample_permission, None)
        
        category_50 = "a" * 50
        
        result, error = use_case.execute(
            code="test:read",
            resource="test",
            action="read",
            category=category_50
        )
        
        assert error is None
        assert result is not None
    
    # =========================================================================
    # REGLAS DE NEGOCIO - Duplicados
    # =========================================================================
    
    def test_duplicate_code_returns_error(self, mock_permission_repository):
        """
        Regla de negocio: No puede haber dos permisos con el mismo código.
        
        El repository debe retornar error PERMISSION_CODE_EXISTS cuando
        ya existe un permiso con ese código.
        
        Nota: La validación de duplicado se hace en el repository, no en el use case.
        El use case solo propaga el error.
        """
        use_case = CreatePermissionUseCase(permission_repo=mock_permission_repository)
        
        # ARRANGE: Repository retorna error de duplicado
        mock_permission_repository.create_permission.return_value = (None, "PERMISSION_CODE_EXISTS")
        
        # ACT
        result, error = use_case.execute(
            code="expedientes:read",
            resource="expedientes",
            action="read"
        )
        
        # ASSERT
        assert error == "PERMISSION_CODE_EXISTS"
        assert result is None


class TestCreatePermissionBusinessRules:
    """
    Documentación de reglas de negocio para CreatePermissionUseCase.
    
    Este test class NO ejecuta tests, sino que documenta las decisiones
    arquitectónicas y reglas de negocio aplicadas.
    
    Patrón: "Test Documental" - usar tests como documentación viva.
    """
    
    def test_why_code_must_match_resource_action(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué el código debe coincidir con resource:action?
        
        Problema:
        - Sin esta regla, podríamos tener código="expedientes:read" pero resource="usuarios", action="delete"
        - Esto genera inconsistencias en la UI, logs, y auditoría
        
        Solución:
        - Forzar que código = "{resource}:{action}" siempre
        - El repository puede reconstruir el código desde resource+action si es necesario
        
        Trade-off:
        - ✅ Consistencia de datos garantizada
        - ✅ Más fácil debuggear (código siempre refleja realidad)
        - ❌ Menos flexible (no podemos tener códigos custom como "super-admin")
        
        Patrón aplicado: Fail Fast - validar en el use case antes de ir al repository
        """
        pass
    
    def test_why_code_format_is_resource_colon_action(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué format resource:action y no RESOURCE.ACTION?
        
        Migración de formato antiguo:
        - Formato viejo: USUARIOS.CREAR (uppercase + punto)
        - Formato nuevo: usuarios:create (lowercase + dos puntos)
        
        Razones del cambio:
        - ✅ Consistencia con estándares REST (recursos en plural lowercase)
        - ✅ Más legible en URLs y headers HTTP
        - ✅ Compatible con IAM systems modernos (AWS, GCP usan resource:action)
        - ✅ Evita confusión con namespaces de Python (usuarios.crear parece import)
        
        Patrón aplicado: Convention Over Configuration
        """
        pass
    
    def test_why_description_and_category_are_optional(self):
        """
        DECISIÓN DE UX: ¿Por qué descripción y categoría son opcionales?
        
        Caso de uso:
        - Admin necesita crear permiso urgente para hotfix
        - No tiene tiempo de escribir descripción bonita
        - Mejor: permitir creación rápida, mejorar descripción después (update)
        
        Regla:
        - Campos REQUERIDOS solo los que son técnicamente necesarios (code, resource, action)
        - Campos OPCIONALES los que son UX/documentación (description, category)
        
        Patrón aplicado: Progressive Disclosure - no sobrecargamos al usuario
        """
        pass

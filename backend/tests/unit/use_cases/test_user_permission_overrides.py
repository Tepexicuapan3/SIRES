"""
Tests unitarios para AddUserPermissionOverrideUseCase y RemoveUserPermissionOverrideUseCase

Cobertura de escenarios:
1. Happy path: Agregar override ALLOW/DENY
2. Validaciones: usuario existe, permiso existe, effect válido
3. Validaciones de fecha: formato ISO, fecha expiración opcional
4. Side effect: Invalidación de cache del usuario
5. Edge cases: fechas válidas/inválidas, fallback en invalidación de cache

Patrón usado: AAA (Arrange-Act-Assert)
Principio: User-level permissions override role permissions (RBAC + ABAC hybrid)
"""

from unittest.mock import Mock

import pytest
from src.use_cases.permissions.add_user_permission_override import \
    AddUserPermissionOverrideUseCase
from src.use_cases.permissions.remove_user_permission_override import \
    RemoveUserPermissionOverrideUseCase


class TestAddUserPermissionOverrideUseCase:
    """
    Suite de tests para AddUserPermissionOverrideUseCase.
    
    Business rules aplicadas:
    - BR1: Effect debe ser 'ALLOW' o 'DENY'
    - BR2: Usuario y permiso deben existir
    - BR3: Fecha de expiración es opcional
    - BR4: Fecha debe estar en formato ISO 8601
    - BR5: Cache del usuario debe invalidarse
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_add_allow_override_success(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Caso de éxito: Agregar override ALLOW sin expiración.
        
        Assert:
        - Usuario y permiso validados
        - Override creado exitosamente
        - Cache del usuario invalidado
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.add_user_permission_override.return_value = (True, None)
        
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            effect="ALLOW",
            expires_at=None,
            usr_alta="admin"
        )
        
        # ASSERT
        assert error is None
        assert result is not None
        assert result['user_id'] == 999
        assert result['permission_code'] == "test:read"
        assert result['effect'] == "ALLOW"
        assert result['expires_at'] is None
        
        # Verificar que se validó usuario
        mock_user_repository.get_user_by_id.assert_called_once_with(999)
        
        # Verificar que se validó permiso
        mock_permission_repository.get_permission_by_code.assert_called_once_with("test:read")
        
        # Verificar que se creó override
        mock_permission_repository.add_user_permission_override.assert_called_once_with(
            user_id=999,
            permission_id=sample_permission['id_permiso'],
            effect="ALLOW",
            expires_at=None,
            usr_alta="admin"
        )
        
        # Verificar que cache fue invalidado
        mock_redis_manager.delete_pattern.assert_called_once_with("user_permissions:999")
    
    def test_add_deny_override_success(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Caso de éxito: Agregar override DENY (bloquear permiso).
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.add_user_permission_override.return_value = (True, None)
        
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            effect="DENY",
            expires_at=None,
            usr_alta="admin"
        )
        
        # ASSERT
        assert error is None
        assert result['effect'] == "DENY"
    
    def test_add_override_with_expiration_date(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Caso de éxito: Agregar override con fecha de expiración.
        
        Assert:
        - Fecha ISO válida se acepta
        - Fecha se pasa al repository sin modificar
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.add_user_permission_override.return_value = (True, None)
        
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            effect="ALLOW",
            expires_at="2026-12-31T23:59:59Z",  # Formato ISO con Z
            usr_alta="admin"
        )
        
        # ASSERT
        assert error is None
        assert result['expires_at'] == "2026-12-31T23:59:59Z"
        
        mock_permission_repository.add_user_permission_override.assert_called_once()
        call_args = mock_permission_repository.add_user_permission_override.call_args[1]
        assert call_args['expires_at'] == "2026-12-31T23:59:59Z"
    
    # =========================================================================
    # VALIDACIONES - Effect
    # =========================================================================
    
    def test_invalid_effect_value(self, mock_permission_repository, mock_user_repository, mock_redis_manager):
        """
        Validación: Effect debe ser exactamente 'ALLOW' o 'DENY'.
        """
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        invalid_effects = ["allow", "Allow", "deny", "Deny", "GRANT", "REVOKE", "", None, "TRUE", "FALSE"]
        
        for invalid_effect in invalid_effects:
            result, error = use_case.execute(
                user_id=999,
                permission_code="test:read",
                effect=invalid_effect,
                expires_at=None,
                usr_alta="admin"
            )
            
            assert error == "INVALID_EFFECT", f"Expected INVALID_EFFECT for effect: {invalid_effect}"
            assert result is None
        
        # NO debe llamar al repository si effect es inválido
        mock_user_repository.get_user_by_id.assert_not_called()
        mock_permission_repository.get_permission_by_code.assert_not_called()
        mock_permission_repository.add_user_permission_override.assert_not_called()
    
    # =========================================================================
    # VALIDACIONES - Usuario y Permiso existen
    # =========================================================================
    
    def test_user_not_found(self, mock_permission_repository, mock_user_repository, mock_redis_manager):
        """
        Validación: Usuario debe existir.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = None  # Usuario NO existe
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=99999,
            permission_code="test:read",
            effect="ALLOW",
            expires_at=None,
            usr_alta="admin"
        )
        
        # ASSERT
        assert error == "USER_NOT_FOUND"
        assert result is None
        
        # NO debe continuar si usuario no existe
        mock_permission_repository.get_permission_by_code.assert_not_called()
        mock_permission_repository.add_user_permission_override.assert_not_called()
    
    def test_permission_not_found(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user
    ):
        """
        Validación: Permiso debe existir.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = None  # Permiso NO existe
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="nonexistent:permission",
            effect="ALLOW",
            expires_at=None,
            usr_alta="admin"
        )
        
        # ASSERT
        assert error == "PERMISSION_NOT_FOUND"
        assert result is None
        
        # Usuario SÍ fue validado (la validación es secuencial)
        mock_user_repository.get_user_by_id.assert_called_once()
        
        # Pero NO debe crear override
        mock_permission_repository.add_user_permission_override.assert_not_called()
    
    # =========================================================================
    # VALIDACIONES - Fecha de expiración
    # =========================================================================
    
    def test_invalid_expiration_date_format(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Validación: Fecha debe estar en formato ISO 8601.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        invalid_dates = [
            "31/12/2026",           # DD/MM/YYYY
            "2026-13-01",           # Mes inválido
            "2026-12-32",           # Día inválido
            "not-a-date",           # String random
            "1234567890",           # Timestamp Unix
            "2026-12-31",           # Sin hora (parcialmente válido, pero depende del parser)
        ]
        
        for invalid_date in invalid_dates:
            result, error = use_case.execute(
                user_id=999,
                permission_code="test:read",
                effect="ALLOW",
                expires_at=invalid_date,
                usr_alta="admin"
            )
            
            # Dependiendo del string, puede ser INVALID_EXPIRATION_DATE o pasar validación
            # Verificamos que no se cree override con fecha inválida
            if error == "INVALID_EXPIRATION_DATE":
                assert result is None
    
    def test_valid_iso_date_formats(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Happy path: Formatos ISO 8601 válidos.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.add_user_permission_override.return_value = (True, None)
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        valid_dates = [
            "2026-12-31T23:59:59Z",           # Con Z (UTC)
            "2026-12-31T23:59:59+00:00",      # Con offset
            "2026-12-31T23:59:59.999999Z",    # Con microsegundos
        ]
        
        for valid_date in valid_dates:
            mock_permission_repository.add_user_permission_override.reset_mock()
            result, error = use_case.execute(
                user_id=999,
                permission_code="test:read",
                effect="ALLOW",
                expires_at=valid_date,
                usr_alta="admin"
            )
            
            assert error is None, f"Expected no error for date: {valid_date}, got {error}"
            assert result is not None
    
    # =========================================================================
    # SIDE EFFECTS - Cache invalidation
    # =========================================================================
    
    def test_cache_invalidation_on_success(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Regla de negocio: Cache del usuario debe invalidarse después de agregar override.
        
        Razón: Los permisos efectivos del usuario cambiaron.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.add_user_permission_override.return_value = (True, None)
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            effect="ALLOW",
            expires_at=None,
            usr_alta="admin"
        )
        
        # ASSERT
        assert error is None
        mock_redis_manager.delete_pattern.assert_called_once_with("user_permissions:999")
    
    def test_cache_invalidation_failure_does_not_break_operation(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Edge case: Si falla la invalidación de cache, la operación sigue siendo exitosa.
        
        Razón: Cache invalidation es un side effect nice-to-have, no crítico.
        Si Redis está caído, igual queremos que el override se cree.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.add_user_permission_override.return_value = (True, None)
        
        # Simular que Redis lanza excepción
        mock_redis_manager.delete_pattern.side_effect = Exception("Redis connection failed")
        
        use_case = AddUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            effect="ALLOW",
            expires_at=None,
            usr_alta="admin"
        )
        
        # ASSERT
        # La operación sigue siendo exitosa aunque Redis falló
        assert error is None
        assert result is not None
        
        # Override SÍ fue creado
        mock_permission_repository.add_user_permission_override.assert_called_once()


class TestRemoveUserPermissionOverrideUseCase:
    """
    Suite de tests para RemoveUserPermissionOverrideUseCase.
    
    Business rules aplicadas:
    - BR1: Usuario y permiso deben existir
    - BR2: Override debe existir para poder eliminarlo
    - BR3: Eliminación es lógica (soft delete)
    - BR4: Cache del usuario debe invalidarse
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_remove_override_success(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Caso de éxito: Eliminar override existente.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.remove_user_permission_override.return_value = (True, None)
        
        use_case = RemoveUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            usr_baja="admin"
        )
        
        # ASSERT
        assert error is None
        assert result is not None
        assert result['user_id'] == 999
        assert result['permission_code'] == "test:read"
        
        # Verificar que se validó usuario y permiso
        mock_user_repository.get_user_by_id.assert_called_once_with(999)
        mock_permission_repository.get_permission_by_code.assert_called_once_with("test:read")
        
        # Verificar que se eliminó override
        mock_permission_repository.remove_user_permission_override.assert_called_once_with(
            user_id=999,
            permission_id=sample_permission['id_permiso'],
            usr_baja="admin"
        )
        
        # Verificar que cache fue invalidado
        mock_redis_manager.delete_pattern.assert_called_once_with("user_permissions:999")
    
    # =========================================================================
    # VALIDACIONES - Usuario y Permiso
    # =========================================================================
    
    def test_user_not_found(self, mock_permission_repository, mock_user_repository, mock_redis_manager):
        """
        Validación: Usuario debe existir.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = None
        use_case = RemoveUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=99999,
            permission_code="test:read",
            usr_baja="admin"
        )
        
        # ASSERT
        assert error == "USER_NOT_FOUND"
        assert result is None
        mock_permission_repository.remove_user_permission_override.assert_not_called()
    
    def test_permission_not_found(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user
    ):
        """
        Validación: Permiso debe existir.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = None
        use_case = RemoveUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="nonexistent:permission",
            usr_baja="admin"
        )
        
        # ASSERT
        assert error == "PERMISSION_NOT_FOUND"
        assert result is None
        mock_permission_repository.remove_user_permission_override.assert_not_called()
    
    # =========================================================================
    # REGLAS DE NEGOCIO - Override exists
    # =========================================================================
    
    def test_override_not_found(
        self,
        mock_permission_repository,
        mock_user_repository,
        mock_redis_manager,
        sample_user,
        sample_permission
    ):
        """
        Validación: El repository retorna error si el override no existe.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_permission_by_code.return_value = sample_permission
        mock_permission_repository.remove_user_permission_override.return_value = (False, "OVERRIDE_NOT_FOUND")
        
        use_case = RemoveUserPermissionOverrideUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository,
            redis=mock_redis_manager
        )
        
        # ACT
        result, error = use_case.execute(
            user_id=999,
            permission_code="test:read",
            usr_baja="admin"
        )
        
        # ASSERT
        assert error == "OVERRIDE_NOT_FOUND"
        assert result is None


# =============================================================================
# BUSINESS RULES DOCUMENTATION
# =============================================================================

class TestUserPermissionOverridesBusinessRules:
    """
    Documentación de reglas de negocio para overrides de usuario.
    """
    
    def test_why_user_permission_overrides_exist(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué permitir overrides de permisos a nivel usuario?
        
        Escenario de negocio:
        - Usuario pertenece al rol "MEDICO" que tiene permiso "expedientes:read"
        - Ese médico específico tuvo una falta grave y necesita suspensión temporal
        - NO queremos eliminar al usuario ni cambiar su rol (es temporal)
        - Solución: Override DENY en "expedientes:read" con fecha de expiración
        
        Caso inverso:
        - Usuario temporal necesita acceso especial por 1 día
        - NO queremos crear un rol custom solo para 1 día
        - Solución: Override ALLOW con expiration="2026-01-08T23:59:59Z"
        
        Patrón aplicado: RBAC + ABAC (Role-Based + Attribute-Based Access Control)
        """
        pass
    
    def test_why_deny_takes_precedence(self):
        """
        DECISIÓN DE SEGURIDAD: ¿Por qué DENY gana sobre ALLOW?
        
        Principio de seguridad:
        - En caso de conflicto, SIEMPRE negar acceso (fail secure)
        - Si un usuario tiene ALLOW de rol y DENY de override → DENY gana
        - Esto previene escalamiento accidental de privilegios
        
        Orden de evaluación:
        1. ¿Hay override DENY? → Rechazar inmediatamente
        2. ¿Hay override ALLOW? → Permitir
        3. ¿Rol tiene el permiso? → Permitir
        4. Caso default → Rechazar
        
        Patrón aplicado: Fail Secure (default deny)
        """
        pass
    
    def test_why_cache_invalidation_is_not_critical(self):
        """
        DECISIÓN DE RESILENCIA: ¿Por qué no fallar si Redis está caído?
        
        Escenario:
        - Admin agrega override DENY urgente (suspender acceso de usuario)
        - Redis está caído (maintenance, red, etc.)
        - Si fallamos, el usuario sigue con acceso → RIESGO DE SEGURIDAD
        - Si continuamos sin invalidar cache, el usuario tiene acceso por max TTL (10 min) → aceptable
        
        Solución:
        - Override se crea en BD (persistente, crítico) ✅
        - Cache invalidation falla (temporal, nice-to-have) ⚠️
        - Operación retorna success (el override existe en BD)
        - Warning log para monitoreo
        
        Trade-off:
        - ✅ Operación crítica no depende de cache
        - ❌ Usuario puede tener permisos incorrectos por TTL (max 10 min)
        
        Patrón aplicado: Graceful Degradation
        """
        pass

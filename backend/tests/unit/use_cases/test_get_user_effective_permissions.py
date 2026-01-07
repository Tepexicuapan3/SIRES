"""
Tests unitarios para GetUserEffectivePermissionsUseCase

Cobertura de escenarios:
1. Happy path: Obtener permisos efectivos de un usuario
2. Validación: Usuario debe existir
3. Edge cases: Usuario sin roles, usuario sin overrides

Nota: Este use case es principalmente un proxy al repository que ya calcula
la lógica compleja de DENY > ALLOW > ROLE. Los tests verifican la integración.

Patrón usado: AAA (Arrange-Act-Assert)
"""

import pytest
from src.use_cases.permissions.get_user_effective_permissions import \
    GetUserEffectivePermissionsUseCase


class TestGetUserEffectivePermissionsUseCase:
    """
    Suite de tests para GetUserEffectivePermissionsUseCase.
    
    Business rules aplicadas (implementadas en repository):
    - BR1: DENY override bloquea permiso aunque esté en roles
    - BR2: ALLOW override agrega permiso no heredado de roles
    - BR3: Overrides expirados se ignoran
    - BR4: Permisos de roles se combinan (unión de todos los roles)
    """
    
    # =========================================================================
    # HAPPY PATH - Casos de éxito
    # =========================================================================
    
    def test_get_effective_permissions_success(
        self,
        mock_permission_repository,
        mock_user_repository,
        sample_user
    ):
        """
        Caso de éxito: Obtener permisos efectivos de un usuario con roles y overrides.
        
        Assert:
        - Repository llamado correctamente
        - Estructura de respuesta esperada
        - Lista de permisos, roles, overrides incluida
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_user_effective_permissions.return_value = {
            "permissions": ["expedientes:read", "usuarios:create"],
            "is_admin": False,
            "roles": [
                {"id_rol": 1, "rol": "MEDICO", "es_primario": True}
            ],
            "landing_route": "/consultas"
        }
        mock_permission_repository.get_user_permission_overrides_list.return_value = [
            {"permission_code": "expedientes:read", "effect": "ALLOW", "expires_at": None}
        ]
        
        use_case = GetUserEffectivePermissionsUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository
        )
        
        # ACT
        result, error = use_case.execute(user_id=999)
        
        # ASSERT
        assert error is None
        assert result is not None
        assert result['user_id'] == 999
        assert result['permissions'] == ["expedientes:read", "usuarios:create"]
        assert result['is_admin'] is False
        assert len(result['roles']) == 1
        assert result['roles'][0]['rol'] == "MEDICO"
        assert result['landing_route'] == "/consultas"
        assert len(result['overrides']) == 1
        
        # Verificar que se llamaron los métodos correctos
        mock_user_repository.get_user_by_id.assert_called_once_with(999)
        mock_permission_repository.get_user_effective_permissions.assert_called_once_with(999)
        mock_permission_repository.get_user_permission_overrides_list.assert_called_once_with(999)
    
    def test_get_effective_permissions_admin_user(
        self,
        mock_permission_repository,
        mock_user_repository,
        sample_user
    ):
        """
        Happy path: Usuario con rol de admin.
        
        Assert:
        - is_admin=True se refleja en respuesta
        - Admin tiene todos los permisos (lógica en repository)
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_user_effective_permissions.return_value = {
            "permissions": ["*"],  # Admin tiene todos los permisos
            "is_admin": True,
            "roles": [
                {"id_rol": 1, "rol": "ADMIN", "es_primario": True}
            ],
            "landing_route": "/admin"
        }
        mock_permission_repository.get_user_permission_overrides_list.return_value = []
        
        use_case = GetUserEffectivePermissionsUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository
        )
        
        # ACT
        result, error = use_case.execute(user_id=1)
        
        # ASSERT
        assert error is None
        assert result['is_admin'] is True
        assert result['permissions'] == ["*"]
    
    def test_get_effective_permissions_user_without_roles(
        self,
        mock_permission_repository,
        mock_user_repository,
        sample_user
    ):
        """
        Edge case: Usuario sin roles asignados.
        
        Assert:
        - Retorna lista de permisos vacía (o solo overrides ALLOW)
        - landing_route default
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_user_effective_permissions.return_value = {
            "permissions": [],
            "is_admin": False,
            "roles": [],
            "landing_route": "/dashboard"
        }
        mock_permission_repository.get_user_permission_overrides_list.return_value = []
        
        use_case = GetUserEffectivePermissionsUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository
        )
        
        # ACT
        result, error = use_case.execute(user_id=999)
        
        # ASSERT
        assert error is None
        assert result['permissions'] == []
        assert result['roles'] == []
        assert result['landing_route'] == "/dashboard"
    
    def test_get_effective_permissions_user_without_overrides(
        self,
        mock_permission_repository,
        mock_user_repository,
        sample_user
    ):
        """
        Edge case: Usuario con roles pero sin overrides.
        
        Assert:
        - overrides lista vacía
        - permisos vienen solo de roles
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = sample_user
        mock_permission_repository.get_user_effective_permissions.return_value = {
            "permissions": ["expedientes:read"],
            "is_admin": False,
            "roles": [{"id_rol": 2, "rol": "MEDICO", "es_primario": True}],
            "landing_route": "/consultas"
        }
        mock_permission_repository.get_user_permission_overrides_list.return_value = []
        
        use_case = GetUserEffectivePermissionsUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository
        )
        
        # ACT
        result, error = use_case.execute(user_id=999)
        
        # ASSERT
        assert error is None
        assert result['overrides'] == []
        assert len(result['permissions']) == 1
    
    # =========================================================================
    # VALIDACIONES - Usuario existe
    # =========================================================================
    
    def test_user_not_found(self, mock_permission_repository, mock_user_repository):
        """
        Validación: Usuario debe existir.
        """
        # ARRANGE
        mock_user_repository.get_user_by_id.return_value = None
        use_case = GetUserEffectivePermissionsUseCase(
            permission_repo=mock_permission_repository,
            user_repo=mock_user_repository
        )
        
        # ACT
        result, error = use_case.execute(user_id=99999)
        
        # ASSERT
        assert error == "USER_NOT_FOUND"
        assert result is None
        
        # NO debe llamar al repository si usuario no existe
        mock_permission_repository.get_user_effective_permissions.assert_not_called()
        mock_permission_repository.get_user_permission_overrides_list.assert_not_called()


class TestGetUserEffectivePermissionsBusinessRules:
    """
    Documentación de reglas de negocio para permisos efectivos.
    """
    
    def test_why_calculate_effective_permissions_in_repository(self):
        """
        DECISIÓN ARQUITECTÓNICA: ¿Por qué la lógica compleja está en el repository?
        
        Lógica compleja de permisos efectivos:
        1. Obtener todos los roles del usuario
        2. Para cada rol, obtener sus permisos
        3. Unir todos los permisos (unión de conjuntos)
        4. Obtener overrides activos del usuario (no expirados)
        5. Aplicar DENY (remover de la lista)
        6. Aplicar ALLOW (agregar a la lista)
        7. Retornar conjunto final
        
        ¿Por qué en repository y no en use case?
        - Performance: Se puede hacer con 1 query SQL optimizado (JOIN múltiple)
        - Cacheable: Redis puede cachear el resultado completo por 10 min
        - Testing: Lógica SQL se testea con integration tests, no unit tests
        
        Trade-off:
        - ✅ Performance (1 query vs N+1 queries)
        - ✅ Cacheable (menos carga en BD)
        - ❌ Use case es muy "flaco" (casi no tiene lógica)
        - ❌ Dificulta testing unitario de la lógica DENY>ALLOW>ROLE
        
        Patrón aplicado: Repository Pattern (data access logic)
        """
        pass
    
    def test_order_of_precedence_deny_allow_role(self):
        """
        DECISIÓN DE NEGOCIO: Orden de precedencia DENY > ALLOW > ROLE
        
        Ejemplo de aplicación:
        
        Usuario tiene:
        - Rol "MEDICO" con permiso "expedientes:read"
        - Override DENY en "expedientes:read" (suspensión temporal)
        - Override ALLOW en "expedientes:update" (acceso temporal especial)
        
        Resultado final:
        - "expedientes:read" → DENEGADO (DENY gana sobre rol)
        - "expedientes:update" → PERMITIDO (ALLOW agrega permiso)
        
        Algoritmo (pseudo-código):
        ```python
        permisos_finales = set(permisos_de_roles)
        
        for override in overrides_activos:
            if override.effect == "DENY":
                permisos_finales.remove(override.permission)
            elif override.effect == "ALLOW":
                permisos_finales.add(override.permission)
        
        return list(permisos_finales)
        ```
        
        Patrón aplicado: Policy-Based Access Control (precedence rules)
        """
        pass
    
    def test_why_include_overrides_in_response(self):
        """
        DECISIÓN DE UX: ¿Por qué retornar overrides además de permisos efectivos?
        
        Razón:
        - Admin necesita VER qué overrides tiene un usuario
        - UI puede mostrar badge "⚠️ Acceso temporal" junto al permiso
        - Debugging: Entender por qué usuario tiene/no tiene un permiso
        
        Ejemplo en UI:
        ```
        Permisos del usuario Juan:
        - expedientes:read ✅
        - expedientes:update ✅ [⏰ Temporal hasta 2026-01-15]  ← ALLOW override
        - usuarios:create ❌ [🚫 Suspendido hasta 2026-01-10]   ← DENY override
        ```
        
        Sin overrides en respuesta, la UI solo muestra ✅/❌ sin contexto.
        
        Patrón aplicado: Rich Response (incluir metadata útil)
        """
        pass

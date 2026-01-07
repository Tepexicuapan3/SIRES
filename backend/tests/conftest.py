"""
Configuración global de fixtures para pytest.

Este archivo define fixtures reutilizables para tests unitarios e integración.
Los fixtures permiten aislar use cases de sus dependencies (repositories, DB)
aplicando el patrón Mock/Stub.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from unittest.mock import MagicMock, Mock

import pytest

# ==============================================================================
# MOCK REPOSITORIES - Para tests unitarios (sin DB real)
# ==============================================================================

@pytest.fixture
def mock_db_connection():
    """
    Mock de MySQLConnection para aislar tests de la base de datos.
    
    Retorna un mock que simula conexión exitosa sin ejecutar queries reales.
    Útil para tests unitarios donde solo importa la lógica, no el acceso a datos.
    """
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_cursor.fetchone.return_value = None
    mock_cursor.fetchall.return_value = []
    mock_cursor.rowcount = 0
    return mock_conn


@pytest.fixture
def mock_role_repository():
    """
    Mock de RoleRepository para tests de use cases que dependen de roles.
    
    Expone los métodos principales sin implementación real:
    - create_role() - Simula creación exitosa
    - get_role_by_id() - Retorna None por defecto (configurar en test)
    - get_role_by_name() - Retorna None por defecto (para validar duplicados)
    - update_role() - Simula actualización exitosa
    - delete_role() - Simula eliminación exitosa
    - role_has_users() - Retorna False por defecto
    - get_all_roles() - Retorna lista vacía por defecto
    """
    mock = Mock()
    mock.create_role.return_value = 1  # ID del rol creado
    mock.get_role_by_id.return_value = None
    mock.get_role_by_name.return_value = None
    mock.update_role.return_value = True
    mock.delete_role.return_value = True
    mock.role_has_users.return_value = False
    mock.get_all_roles.return_value = []
    mock.get_role_permissions.return_value = []
    return mock


@pytest.fixture
def mock_permission_repository():
    """
    Mock de PermissionRepository para tests de use cases de permisos.
    
    Métodos principales:
    - create_permission() - Retorna (permission_dict, None) en éxito
    - get_permission_by_code() - Retorna None por defecto
    - get_permission_by_id() - Retorna None por defecto
    - update_permission() - Retorna (permission_dict, None) en éxito
    - delete_permission() - Retorna (True, None) en éxito
    - get_all_permissions() - Retorna lista vacía
    - get_permissions_by_role_id() - Retorna lista vacía
    - assign_permissions_to_role() - Retorna (True, None) en éxito
    - add_user_permission_override() - Retorna (True, None) en éxito
    - remove_user_permission_override() - Retorna (True, None) en éxito
    - get_user_effective_permissions() - Retorna dict con permisos
    - get_user_permission_overrides_list() - Retorna lista vacía
    """
    mock = Mock()
    mock.create_permission.return_value = (None, None)  # Configurar en cada test
    mock.get_permission_by_code.return_value = None
    mock.get_permission_by_id.return_value = None
    mock.update_permission.return_value = (None, None)  # Configurar en cada test
    mock.delete_permission.return_value = (True, None)
    mock.get_all_permissions.return_value = []
    mock.get_permissions_by_role_id.return_value = []
    mock.assign_permissions_to_role.return_value = (True, None)
    mock.add_user_permission_override.return_value = (True, None)
    mock.remove_user_permission_override.return_value = (True, None)
    mock.get_user_effective_permissions.return_value = {
        "permissions": [],
        "is_admin": False,
        "roles": [],
        "landing_route": "/dashboard"
    }
    mock.get_user_permission_overrides_list.return_value = []
    return mock


@pytest.fixture
def mock_user_repository():
    """
    Mock de UserRepository para tests de asignación de roles y overrides.
    
    Métodos principales:
    - get_user_by_id() - Retorna None por defecto
    - get_user_roles() - Retorna lista vacía
    - assign_roles_to_user() - Simula asignación exitosa
    - set_primary_role() - Simula actualización exitosa
    - revoke_role_from_user() - Simula revocación exitosa
    - add_permission_override() - Retorna ID del override
    - remove_permission_override() - Simula eliminación exitosa
    - get_user_permission_overrides() - Retorna lista vacía
    """
    mock = Mock()
    mock.get_user_by_id.return_value = None
    mock.get_user_roles.return_value = []
    mock.assign_roles_to_user.return_value = True
    mock.set_primary_role.return_value = True
    mock.revoke_role_from_user.return_value = True
    mock.add_permission_override.return_value = 1
    mock.remove_permission_override.return_value = True
    mock.get_user_permission_overrides.return_value = []
    mock.get_user_effective_permissions.return_value = []
    return mock


@pytest.fixture
def mock_redis_manager():
    """
    Mock de RedisManager para tests de invalidación de cache.
    
    Métodos principales:
    - delete_pattern() - Simula eliminación de keys por pattern
    - set() - Simula almacenamiento de dato
    - get() - Retorna None por defecto
    - delete() - Simula eliminación de key específica
    """
    mock = Mock()
    mock.delete_pattern.return_value = None
    mock.set.return_value = True
    mock.get.return_value = None
    mock.delete.return_value = True
    return mock


# ==============================================================================
# SAMPLE DATA FACTORIES - Datos de prueba reutilizables
# ==============================================================================

@pytest.fixture
def sample_role() -> Dict[str, Any]:
    """
    Factory de datos para un rol de prueba.
    
    Retorna un diccionario que simula la estructura que retorna RoleRepository.
    Útil para configurar mocks: mock_repo.get_role_by_id.return_value = sample_role
    
    Campos:
    - id_rol: ID único
    - nombre: Nombre del rol (único en BD)
    - descripcion: Descripción legible
    - es_sistema: False (roles custom son editables)
    - activo: True
    - fecha_creacion: Timestamp de creación
    """
    return {
        'id_rol': 999,
        'nombre': 'TEST_ROLE',
        'descripcion': 'Rol de prueba para tests unitarios',
        'es_sistema': False,
        'activo': True,
        'fecha_creacion': datetime.now()
    }


@pytest.fixture
def sample_system_role() -> Dict[str, Any]:
    """
    Factory de datos para un rol de sistema (protegido).
    
    Similar a sample_role pero con es_sistema=True.
    Los roles de sistema NO pueden editarse ni eliminarse (regla de negocio).
    """
    return {
        'id_rol': 1,
        'nombre': 'ADMIN',
        'descripcion': 'Administrador del sistema',
        'es_sistema': True,
        'activo': True,
        'fecha_creacion': datetime.now()
    }


@pytest.fixture
def sample_permission() -> Dict[str, Any]:
    """
    Factory de datos para un permiso de prueba.
    
    Estructura típica de PermissionRepository.get_permission_by_code()
    
    Campos:
    - id_permiso: ID único (también como id_permission para compatibilidad)
    - codigo: Código del permiso (formato: resource:action)
    - recurso: Recurso (ej: "expedientes", "usuarios")
    - accion: Acción (ej: "read", "create", "update", "delete")
    - descripcion: Descripción legible
    - categoria: Categoría para agrupar (ej: "usuarios", "expedientes")
    - es_sistema: False (permisos custom)
    - activo: True
    """
    return {
        'id_permiso': 999,
        'id_permission': 999,  # Alias para compatibilidad con add_user_permission_override
        'codigo': 'test:read',
        'recurso': 'test',
        'accion': 'read',
        'descripcion': 'Permiso de prueba - lectura',
        'categoria': 'testing',
        'es_sistema': False,
        'activo': True
    }


@pytest.fixture
def sample_system_permission() -> Dict[str, Any]:
    """
    Factory de datos para un permiso de sistema (protegido).
    
    Similar a sample_permission pero con es_sistema=True.
    Los permisos de sistema NO pueden editarse ni eliminarse (regla de negocio).
    """
    return {
        'id_permiso': 1,
        'id_permission': 1,  # Alias para compatibilidad
        'codigo': 'users:create',
        'recurso': 'users',
        'accion': 'create',
        'descripcion': 'Crear usuarios en el sistema',
        'categoria': 'usuarios',
        'es_sistema': True,
        'activo': True
    }


@pytest.fixture
def sample_user() -> Dict[str, Any]:
    """
    Factory de datos para un usuario de prueba.
    
    Estructura típica de UserRepository.get_user_by_id()
    
    Campos:
    - id_usr: ID único
    - nombre_usuario: Username (único)
    - correo_usr: Email del usuario
    - activo: True
    """
    return {
        'id_usr': 999,
        'nombre_usuario': 'test_user',
        'correo_usr': 'test@metro.cdmx.gob.mx',
        'activo': True
    }


@pytest.fixture
def sample_user_role() -> Dict[str, Any]:
    """
    Factory de datos para una relación usuario-rol.
    
    Estructura típica de UserRepository.get_user_roles()
    
    Campos:
    - id_usr_roles: ID de la asignación
    - id_usr: ID del usuario
    - id_rol: ID del rol asignado
    - es_primario: Si es el rol principal del usuario
    - fecha_asignacion: Timestamp de asignación
    """
    return {
        'id_usr_roles': 999,
        'id_usr': 999,
        'id_rol': 1,
        'es_primario': True,
        'fecha_asignacion': datetime.now()
    }


@pytest.fixture
def sample_permission_override() -> Dict[str, Any]:
    """
    Factory de datos para un override de permiso.
    
    Estructura típica de UserRepository.get_user_permission_overrides()
    
    Campos:
    - id_override: ID del override
    - id_usr: ID del usuario
    - id_permiso: ID del permiso
    - efecto: 'ALLOW' o 'DENY'
    - razon: Justificación del override
    - fecha_expiracion: Opcional, fecha de vencimiento
    - creado_por: ID del usuario que creó el override
    - fecha_creacion: Timestamp de creación
    """
    return {
        'id_override': 999,
        'id_usr': 999,
        'id_permiso': 1,
        'efecto': 'ALLOW',
        'razon': 'Acceso temporal para pruebas',
        'fecha_expiracion': None,
        'creado_por': 1,
        'fecha_creacion': datetime.now()
    }


# ==============================================================================
# INTEGRATION TEST FIXTURES - Para tests con Flask app real
# ==============================================================================

@pytest.fixture
def flask_app():
    """
    Fixture para tests de integración con Flask.
    
    Crea una instancia de la aplicación Flask en modo testing.
    Retorna un test client para hacer requests HTTP simulados.
    
    Uso:
        def test_create_role_endpoint(flask_app):
            response = flask_app.post('/api/v1/roles', json={...})
            assert response.status_code == 201
    
    TODO: Implementar cuando tengamos app factory pattern en Flask
    """
    # Por ahora retorna None - implementar cuando refactoricemos Flask
    # Ver: backend/run.py para estructura actual
    pytest.skip("Flask app factory not implemented yet")
    return None


# ==============================================================================
# UTILITY FIXTURES - Helpers comunes
# ==============================================================================

@pytest.fixture
def freeze_time():
    """
    Fixture para congelar el tiempo en tests.
    
    Útil para tests que dependen de timestamps o fechas de expiración.
    Requiere: pip install freezegun
    
    Uso:
        def test_expired_override(freeze_time):
            with freeze_time("2025-01-01"):
                # El tiempo está congelado en 2025-01-01
                ...
    
    TODO: Implementar con freezegun si es necesario
    """
    pytest.skip("freezegun not configured yet")
    return None


@pytest.fixture(autouse=True)
def reset_mocks(
    mock_role_repository,
    mock_permission_repository,
    mock_user_repository,
    mock_redis_manager
):
    """
    Auto-fixture que resetea todos los mocks después de cada test.
    
    autouse=True significa que se ejecuta automáticamente sin declararlo.
    Evita que un test afecte a otro por estado compartido en mocks.
    
    Principio aplicado: Test Isolation - cada test es independiente.
    """
    yield  # Ejecuta el test
    # Después del test, resetea los mocks
    mock_role_repository.reset_mock()
    mock_permission_repository.reset_mock()
    mock_user_repository.reset_mock()
    mock_redis_manager.reset_mock()

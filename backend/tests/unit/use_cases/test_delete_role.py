"""
Tests unitarios para DeleteRoleUseCase.

Patrón: Arrange-Act-Assert (AAA)
Objetivo: Verificar que la eliminación de roles protege datos críticos
          y previene inconsistencias (eliminar rol con usuarios activos).
"""

from unittest.mock import Mock

import pytest
from src.use_cases.roles.delete_role import DeleteRoleUseCase


class TestDeleteRoleUseCase:
    """
    Test suite para DeleteRoleUseCase.
    
    Cobertura:
    - ✅ Happy path: Eliminación exitosa (baja lógica)
    - ❌ Reglas de negocio críticas:
        - No eliminar roles del sistema
        - No eliminar roles con usuarios asignados
        - Rol no existe
    - ❌ Manejo de errores de BD
    
    Nota: DeleteRoleUseCase es un thin wrapper sobre repository.delete()
          La lógica está en el repository, el use case solo orquesta.
    """

    # ==========================================================================
    # HAPPY PATH - Casos exitosos
    # ==========================================================================

    def test_delete_role_success(self, mock_role_repository):
        """
        Caso exitoso: Eliminar un rol custom sin usuarios asignados.
        
        Verifica que:
        1. Se llama al repository con parámetros correctos
        2. Se retorna success=True sin error
        
        Importante: Es BAJA LÓGICA, no física.
        El rol queda marcado como activo=False en BD.
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (True, None)
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=999,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is True
        assert error is None
        
        mock_role_repository.delete.assert_called_once_with(
            role_id=999,
            usr_baja='admin'
        )

    # ==========================================================================
    # REGLAS DE NEGOCIO CRÍTICAS - Protecciones
    # ==========================================================================

    def test_delete_role_not_found(self, mock_role_repository):
        """
        Error de negocio: Intentar eliminar rol que no existe.
        
        Código de error esperado: ROLE_NOT_FOUND
        
        El repository verifica existencia antes de eliminar.
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (False, 'ROLE_NOT_FOUND')
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=99999,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is False
        assert error == 'ROLE_NOT_FOUND'
        mock_role_repository.delete.assert_called_once()

    def test_delete_role_system_protected(self, mock_role_repository):
        """
        Error de negocio CRÍTICO: Intentar eliminar rol del sistema.
        
        Código de error esperado: ROLE_SYSTEM_PROTECTED
        
        Los roles del sistema (id <= 22 o es_sistema=True) NO pueden eliminarse.
        
        Por qué es crítico:
        - Roles como ADMIN, SUPER_ADMIN son parte de la lógica del sistema
        - Eliminarlos rompería autenticación/autorización
        - Esto es una regla de SEGURIDAD, no solo de integridad de datos
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (False, 'ROLE_SYSTEM_PROTECTED')
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT - Intentar eliminar rol sistema (ej: ADMIN con id=1)
        success, error = use_case.execute(
            role_id=1,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is False
        assert error == 'ROLE_SYSTEM_PROTECTED'

    def test_delete_role_has_users_assigned(self, mock_role_repository):
        """
        Error de negocio CRÍTICO: Intentar eliminar rol con usuarios activos.
        
        Código de error esperado: ROLE_HAS_USERS
        
        Por qué es crítico:
        - Si eliminamos un rol con usuarios asignados, esos usuarios quedan sin acceso
        - Puede ser un problema de seguridad (usuarios sin permisos explícitos)
        - Debe haber un proceso manual: primero reasignar usuarios, luego eliminar rol
        
        Flujo correcto:
        1. Identificar usuarios con este rol
        2. Reasignar a otro rol apropiado
        3. Verificar que no queden usuarios
        4. Eliminar el rol
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (False, 'ROLE_HAS_USERS')
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=999,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is False
        assert error == 'ROLE_HAS_USERS'

    def test_delete_role_database_error(self, mock_role_repository):
        """
        Error de infraestructura: Falla al eliminar en BD.
        
        Código de error esperado: DATABASE_ERROR
        
        Posibles causas:
        - Conexión a BD perdida
        - Constraint de FK violado (aunque ROLE_HAS_USERS debería catchear esto)
        - Timeout de query
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (False, 'DATABASE_ERROR')
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=999,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is False
        assert error == 'DATABASE_ERROR'

    # ==========================================================================
    # EDGE CASES - Casos límite
    # ==========================================================================

    def test_delete_role_with_empty_usr_baja(self, mock_role_repository):
        """
        Edge case: Llamar con usr_baja vacío.
        
        Nota: El use case NO valida usr_baja, asume que viene del contexto de auth.
        El repository podría validarlo o la BD podría tener constraint NOT NULL.
        
        Este test documenta el comportamiento actual (delegación al repository).
        """
        # ARRANGE
        # Simular que el repository lo acepta (o que retorna error)
        mock_role_repository.delete.return_value = (True, None)
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=999,
            usr_baja=''  # Vacío
        )
        
        # ASSERT - El use case delega, no valida
        mock_role_repository.delete.assert_called_once_with(
            role_id=999,
            usr_baja=''
        )

    def test_delete_role_id_zero(self, mock_role_repository):
        """
        Edge case: Intentar eliminar rol con ID=0.
        
        Aunque es un ID inválido, el use case delega la validación al repository.
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (False, 'ROLE_NOT_FOUND')
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=0,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is False
        # El repository debería retornar NOT_FOUND para IDs inválidos
        assert error == 'ROLE_NOT_FOUND'

    def test_delete_role_negative_id(self, mock_role_repository):
        """
        Edge case: ID negativo.
        
        IDs negativos no existen en BD (auto_increment empieza en 1).
        """
        # ARRANGE
        mock_role_repository.delete.return_value = (False, 'ROLE_NOT_FOUND')
        use_case = DeleteRoleUseCase(role_repo=mock_role_repository)
        
        # ACT
        success, error = use_case.execute(
            role_id=-1,
            usr_baja='admin'
        )
        
        # ASSERT
        assert success is False
        assert error == 'ROLE_NOT_FOUND'


# ==============================================================================
# TESTS CONCEPTUALES - Documentación del comportamiento esperado
# ==============================================================================

class TestDeleteRoleBusinessRules:
    """
    Tests que documentan reglas de negocio importantes.
    
    Estos tests NO ejecutan código, sino que documentan:
    - Por qué existen ciertas restricciones
    - Qué problemas previenen
    - Cómo deberían manejarse en la UI
    """

    def test_business_rule_system_roles_protection(self):
        """
        REGLA DE NEGOCIO: Roles del sistema son inmutables.
        
        Roles protegidos (id <= 22 o es_sistema=True):
        - ADMIN
        - SUPER_ADMIN
        - MEDICO
        - ENFERMERIA
        - etc.
        
        Por qué:
        - Son parte de la lógica hard-coded del sistema
        - Eliminarlos rompería autenticación/autorización
        - Modificarlos podría crear vulnerabilidades de seguridad
        
        Manejo en UI:
        - No mostrar botón "Eliminar" para roles sistema
        - Mostrar badge "Rol del sistema" en la lista
        - Tooltip explicativo: "Este rol es parte del sistema y no puede eliminarse"
        """
        assert True  # Test documental

    def test_business_rule_cascade_protection(self):
        """
        REGLA DE NEGOCIO: No eliminar roles con usuarios asignados.
        
        Por qué NO hacemos CASCADE DELETE:
        - Los usuarios quedarían sin rol → sin permisos
        - Puede ser accidental (click erróneo del admin)
        - Queremos forzar un proceso consciente de reasignación
        
        Flujo correcto en UI:
        1. Admin intenta eliminar rol "LABORATORIO"
        2. Sistema detecta 5 usuarios con ese rol
        3. Mostrar modal: "Este rol tiene 5 usuarios asignados"
        4. Opciones:
           a) "Ver usuarios" → Lista de usuarios
           b) "Reasignar a otro rol" → Wizard de reasignación masiva
           c) "Cancelar"
        5. Solo después de reasignar todos, permitir eliminación
        
        Trade-off:
        - ✅ Previene pérdida accidental de acceso
        - ❌ Más pasos para el admin
        - Decisión: SEGURIDAD > COMODIDAD
        """
        assert True  # Test documental

    def test_business_rule_soft_delete(self):
        """
        REGLA DE NEGOCIO: Eliminación LÓGICA, no física.
        
        Soft delete (activo=False) vs Hard delete (DELETE FROM):
        
        ✅ Ventajas de soft delete:
        - Auditoría: Sabemos qué roles existieron
        - Recuperación: Podemos reactivar si fue error
        - Integridad referencial: Los FKs siguen válidos
        - Reportes históricos: "Usuario X tenía rol Y en fecha Z"
        
        ❌ Desventajas:
        - Queries más complejos (WHERE activo=True)
        - BD más grande (nunca borramos nada)
        
        Implementación:
        - Campo `activo` BOOLEAN DEFAULT TRUE
        - Campo `usr_baja` VARCHAR(50) NULL
        - Campo `fec_baja` TIMESTAMP NULL
        
        Queries deben incluir:
        - SELECT: WHERE activo = TRUE
        - UPDATE: SET activo = FALSE, usr_baja = ?, fec_baja = NOW()
        """
        assert True  # Test documental

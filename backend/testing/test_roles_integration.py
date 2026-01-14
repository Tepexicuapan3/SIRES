#!/usr/bin/env python3
"""
Testing de Integración - CRUD de Roles (Fase 1)
Ejecuta tests directos contra use cases y repository sin HTTP.
"""

import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.infrastructure.database.mysql_connection import get_db_connection
from src.infrastructure.repositories.role_repository import RoleRepository
from src.use_cases.roles.create_role import CreateRoleUseCase
from src.use_cases.roles.update_role import UpdateRoleUseCase
from src.use_cases.roles.delete_role import DeleteRoleUseCase
from src.use_cases.roles.get_roles import GetRolesUseCase


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_test(name):
    print(f"\n{bcolors.OKBLUE}[TEST] {name}{bcolors.ENDC}")


def print_success(msg):
    print(f"{bcolors.OKGREEN}✓ {msg}{bcolors.ENDC}")


def print_error(msg):
    print(f"{bcolors.FAIL}✗ {msg}{bcolors.ENDC}")


def print_info(msg):
    print(f"{bcolors.OKCYAN}  {msg}{bcolors.ENDC}")


def main():
    print(f"\n{bcolors.HEADER}{'=' * 60}{bcolors.ENDC}")
    print(f"{bcolors.HEADER}Testing de Integración - CRUD de Roles (Fase 1){bcolors.ENDC}")
    print(f"{bcolors.HEADER}{'=' * 60}{bcolors.ENDC}")

    # Inicializar repository y use cases
    repo = RoleRepository()
    create_uc = CreateRoleUseCase(repo)
    update_uc = UpdateRoleUseCase(repo)
    delete_uc = DeleteRoleUseCase(repo)
    get_uc = GetRolesUseCase(repo)
    
    # Obtener conexión para verificaciones directas
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    test_role_id = None
    passed = 0
    failed = 0

    try:
        # ========== TEST 1: Listar Roles ==========
        print_test("Test 1: Listar todos los roles")
        roles, error = get_uc.execute()
        
        if error:
            print_error(f"Error al listar roles: {error}")
            failed += 1
        elif not roles:
            print_error("No se encontraron roles")
            failed += 1
        else:
            print_success(f"Se obtuvieron {len(roles)} roles")
            print_info(f"Roles del sistema: {sum(1 for r in roles if r['id_rol'] <= 22)}")
            print_info(f"Roles activos: {sum(1 for r in roles if r['est_rol'] == 'A')}")
            passed += 1

        # ========== TEST 2: Obtener Detalle de Rol ==========
        print_test("Test 2: Obtener detalle del rol ADMINISTRADOR (id=22)")
        role, error = repo.get_by_id(22)
        
        if error:
            print_error(f"Error al obtener rol: {error}")
            failed += 1
        elif not role:
            print_error("Rol ADMINISTRADOR no encontrado")
            failed += 1
        else:
            print_success(f"Rol obtenido: {role['rol']}")
            print_info(f"Descripción: {role['desc_rol']}")
            print_info(f"Priority: {role['priority']}")
            print_info(f"Is admin: {role['is_admin']}")
            print_info(f"Permisos asignados: {role.get('permission_count', 'N/A')}")
            print_info(f"Usuarios: {role.get('user_count', 'N/A')}")
            passed += 1

        # ========== TEST 3: Crear Rol ==========
        print_test("Test 3: Crear rol de prueba")
        role_data = {
            "rol": "TEST_ENFERMERIA_INT",
            "desc_rol": "Rol de prueba para enfermería - Testing Integration",
            "landing_route": "/nursing-test",
            "priority": 999
        }
        
        result, error = create_uc.execute(role_data, "SYSTEM_TEST")
        
        if error:
            print_error(f"Error al crear rol: {error}")
            failed += 1
        elif not result:
            print_error("No se retornó el rol creado")
            failed += 1
        else:
            test_role_id = result['id_rol']
            print_success(f"Rol creado con ID: {test_role_id}")
            print_info(f"Nombre: {result['rol']}")
            print_info(f"Estado: {result['est_rol']}")
            passed += 1

        # ========== TEST 4: Validar Nombre Duplicado ==========
        print_test("Test 4: Validar que no se permite nombre duplicado")
        duplicate_data = {
            "rol": "TEST_ENFERMERIA_INT",  # Mismo nombre del test anterior
            "desc_rol": "Intentando duplicar",
            "landing_route": "/test",
            "priority": 100
        }
        
        result, error = create_uc.execute(duplicate_data, "SYSTEM_TEST")
        
        if error == "ROLE_NAME_EXISTS":
            print_success("Validación correcta: rechazó nombre duplicado")
            passed += 1
        else:
            print_error(f"Debió rechazar nombre duplicado, pero retornó: {error or 'éxito'}")
            failed += 1

        # ========== TEST 5: Validar Nombre Muy Largo ==========
        print_test("Test 5: Validar nombre muy largo (>50 chars)")
        long_name_data = {
            "rol": "ESTE_ES_UN_NOMBRE_EXTREMADAMENTE_LARGO_QUE_SUPERA_LOS_50_CARACTERES",
            "desc_rol": "Test",
            "landing_route": "/test",
            "priority": 100
        }
        
        result, error = create_uc.execute(long_name_data, "SYSTEM_TEST")
        
        if error == "INVALID_ROLE_NAME":
            print_success("Validación correcta: rechazó nombre muy largo")
            passed += 1
        else:
            print_error(f"Debió rechazar nombre largo, pero retornó: {error or 'éxito'}")
            failed += 1

        # ========== TEST 6: Validar Landing Route Inválido ==========
        print_test("Test 6: Validar landing_route sin slash inicial")
        invalid_route_data = {
            "rol": "TEST_ROUTE",
            "desc_rol": "Test route",
            "landing_route": "sin-slash",
            "priority": 100
        }
        
        result, error = create_uc.execute(invalid_route_data, "SYSTEM_TEST")
        
        if error == "INVALID_LANDING_ROUTE":
            print_success("Validación correcta: rechazó landing_route inválido")
            passed += 1
        else:
            print_error(f"Debió rechazar landing_route inválido, pero retornó: {error or 'éxito'}")
            failed += 1

        # ========== TEST 7: Actualizar Rol ==========
        if test_role_id:
            print_test(f"Test 7: Actualizar rol {test_role_id}")
            update_data = {
                "desc_rol": "Descripción actualizada - Testing Integration UPDATED",
                "priority": 888
            }
            
            result, error = update_uc.execute(test_role_id, update_data, "SYSTEM_TEST")
            
            if error:
                print_error(f"Error al actualizar rol: {error}")
                failed += 1
            elif not result:
                print_error("No se retornó el rol actualizado")
                failed += 1
            else:
                print_success("Rol actualizado correctamente")
                print_info(f"Nueva descripción: {result['desc_rol']}")
                print_info(f"Nueva priority: {result['priority']}")
                passed += 1
        else:
            print_error("Test 7 saltado: no hay test_role_id")
            failed += 1

        # ========== TEST 8: Intentar Actualizar Rol del Sistema ==========
        print_test("Test 8: Validar que no se puede actualizar rol del sistema (id=1)")
        system_update_data = {
            "desc_rol": "Intentando cambiar rol del sistema"
        }
        
        result, error = update_uc.execute(1, system_update_data, "SYSTEM_TEST")
        
        if error == "SYSTEM_ROLE_PROTECTED":
            print_success("Validación correcta: rechazó editar rol del sistema")
            passed += 1
        else:
            print_error(f"Debió rechazar edición de rol sistema, pero retornó: {error or 'éxito'}")
            failed += 1

        # ========== TEST 9: Eliminar Rol ==========
        if test_role_id:
            print_test(f"Test 9: Eliminar rol {test_role_id}")
            success, error = delete_uc.execute(test_role_id, "SYSTEM_TEST")
            
            if error:
                print_error(f"Error al eliminar rol: {error}")
                failed += 1
            elif not success:
                print_error("No se eliminó el rol")
                failed += 1
            else:
                print_success("Rol eliminado correctamente (baja lógica)")
                
                # Verificar que realmente se marcó como 'B'
                cursor.execute("SELECT est_rol FROM cat_roles WHERE id_rol = %s", (test_role_id,))
                row = cursor.fetchone()
                if row and row['est_rol'] == 'B':
                    print_info("Estado verificado: 'B' (baja)")
                    passed += 1
                else:
                    print_error(f"Estado incorrecto: {row['est_rol'] if row else 'N/A'}")
                    failed += 1
        else:
            print_error("Test 9 saltado: no hay test_role_id")
            failed += 1

        # ========== TEST 10: Intentar Eliminar Rol del Sistema ==========
        print_test("Test 10: Validar que no se puede eliminar rol del sistema (id=22)")
        success, error = delete_uc.execute(22, "SYSTEM_TEST")
        
        if error == "SYSTEM_ROLE_PROTECTED":
            print_success("Validación correcta: rechazó eliminar rol del sistema")
            passed += 1
        else:
            print_error(f"Debió rechazar eliminación de rol sistema, pero retornó: {error or 'éxito'}")
            failed += 1

        # ========== TEST 11: Intentar Eliminar Rol con Usuarios ==========
        print_test("Test 11: Validar que no se puede eliminar rol con usuarios (id=1)")
        success, error = delete_uc.execute(1, "SYSTEM_TEST")
        
        if error == "ROLE_HAS_USERS":
            print_success("Validación correcta: rechazó eliminar rol con usuarios")
            passed += 1
        else:
            print_error(f"Debió rechazar eliminación de rol con usuarios, pero retornó: {error or 'éxito'}")
            failed += 1

        # ========== RESUMEN ==========
        print(f"\n{bcolors.HEADER}{'=' * 60}{bcolors.ENDC}")
        print(f"{bcolors.HEADER}RESUMEN DE TESTS{bcolors.ENDC}")
        print(f"{bcolors.HEADER}{'=' * 60}{bcolors.ENDC}")
        
        total = passed + failed
        print(f"\n{bcolors.OKGREEN}Pasados: {passed}/{total}{bcolors.ENDC}")
        print(f"{bcolors.FAIL}Fallidos: {failed}/{total}{bcolors.ENDC}")
        
        if failed == 0:
            print(f"\n{bcolors.OKGREEN}{bcolors.BOLD}✓ TODOS LOS TESTS PASARON - FASE 1 COMPLETADA{bcolors.ENDC}")
            return 0
        else:
            print(f"\n{bcolors.FAIL}{bcolors.BOLD}✗ ALGUNOS TESTS FALLARON - REVISAR{bcolors.ENDC}")
            return 1

    except Exception as e:
        print(f"\n{bcolors.FAIL}ERROR CRÍTICO: {str(e)}{bcolors.ENDC}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        cursor.close()
        db.close()


if __name__ == "__main__":
    sys.exit(main())

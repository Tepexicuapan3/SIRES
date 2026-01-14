#!/usr/bin/env python3
"""Testing Rapido - CRUD de Roles (Fase 1)"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.infrastructure.repositories.role_repository import RoleRepository
from src.use_cases.roles.create_role import CreateRoleUseCase
from src.use_cases.roles.update_role import UpdateRoleUseCase
from src.use_cases.roles.delete_role import DeleteRoleUseCase
from src.use_cases.roles.get_roles import GetRolesUseCase

def test_basic():
    """Test basico de funcionalidad"""
    print("\n========== TESTING FASE 1: CRUD ROLES ==========\n")
    
    repo = RoleRepository()
    get_uc = GetRolesUseCase(repo)
    create_uc = CreateRoleUseCase(repo)
    update_uc = UpdateRoleUseCase(repo)
    delete_uc = DeleteRoleUseCase(repo)
    
    passed = []
    failed = []
    
    # Test 1: Listar roles
    print("[1/9] Listar roles...")
    try:
        roles = get_uc.get_all(include_inactive=False)
        if not roles or len(roles) == 0:
            failed.append(f"1. Listar roles: Sin roles")
        else:
            passed.append(f"1. Listar roles: {len(roles)} roles obtenidos")
    except Exception as e:
        failed.append(f"1. Listar roles: Exception {e}")
    
    # Test 2: Obtener detalle de rol
    print("[2/9] Obtener rol ADMINISTRADOR (id=22)...")
    try:
        role = repo.get_by_id(22)
        if not role:
            failed.append(f"2. Get by ID: No encontrado")
        else:
            passed.append(f"2. Get by ID: {role['rol']}")
    except Exception as e:
        failed.append(f"2. Get by ID: Exception {e}")
    
    # Test 3: Crear rol
    print("[3/9] Crear rol de prueba...")
    test_id = None
    try:
        result, error = create_uc.execute(
            rol="TEST_QUICK",
            desc_rol="Test rapido de integracion",
            landing_route="/test",
            priority=999,
            usr_alta="TEST"
        )
        if error or not result:
            failed.append(f"3. Crear rol: {error or 'Sin resultado'}")
        else:
            test_id = result['id_rol']
            passed.append(f"3. Crear rol: ID {test_id}")
    except Exception as e:
        failed.append(f"3. Crear rol: Exception {e}")
    
    # Test 4: Nombre duplicado
    print("[4/9] Validar nombre duplicado...")
    try:
        result, error = create_uc.execute(
            rol="TEST_QUICK",
            desc_rol="Dup",
            landing_route="/d",
            priority=100,
            usr_alta="TEST"
        )
        if error == "ROLE_NAME_DUPLICATE":
            passed.append("4. Nombre duplicado: Rechazado OK")
        else:
            failed.append(f"4. Nombre duplicado: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"4. Nombre duplicado: Exception {e}")
    
    # Test 5: Nombre muy largo
    print("[5/9] Validar nombre muy largo...")
    try:
        result, error = create_uc.execute(
            rol="A" * 60,
            desc_rol="Test",
            landing_route="/t",
            priority=100,
            usr_alta="TEST"
        )
        if error == "ROLE_NAME_TOO_LONG":
            passed.append("5. Nombre largo: Rechazado OK")
        else:
            failed.append(f"5. Nombre largo: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"5. Nombre largo: Exception {e}")
    
    # Test 6: Landing route invalido
    print("[6/9] Validar landing_route invalido...")
    try:
        result, error = create_uc.execute(
            rol="TEST_R",
            desc_rol="Test",
            landing_route="nosl",
            priority=100,
            usr_alta="TEST"
        )
        if error == "INVALID_LANDING_ROUTE":
            passed.append("6. Landing route: Rechazado OK")
        else:
            failed.append(f"6. Landing route: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"6. Landing route: Exception {e}")
    
    # Test 7: Actualizar rol
    if test_id:
        print(f"[7/9] Actualizar rol {test_id}...")
        try:
            result, error = update_uc.execute(
                role_id=test_id,
                desc_rol="Actualizado",
                priority=888,
                usr_modf="TEST"
            )
            if error or not result:
                failed.append(f"7. Actualizar: {error or 'Sin resultado'}")
            else:
                passed.append(f"7. Actualizar: OK (priority={result['priority']})")
        except Exception as e:
            failed.append(f"7. Actualizar: Exception {e}")
    else:
        failed.append("7. Actualizar: Saltado (no test_id)")
    
    # Test 8: Proteccion rol del sistema
    print("[8/9] Validar proteccion rol sistema (id=1)...")
    try:
        result, error = update_uc.execute(
            role_id=1,
            desc_rol="Intento",
            usr_modf="TEST"
        )
        if error == "ROLE_SYSTEM_PROTECTED":
            passed.append("8. Rol sistema: Protegido OK")
        else:
            failed.append(f"8. Rol sistema: Debio proteger, retorno {error}")
    except Exception as e:
        failed.append(f"8. Rol sistema: Exception {e}")
    
    # Test 9: Eliminar rol
    if test_id:
        print(f"[9/9] Eliminar rol {test_id}...")
        try:
            success, error = delete_uc.execute(test_id, "TEST")
            if error or not success:
                failed.append(f"9. Eliminar: {error or 'No eliminado'}")
            else:
                passed.append("9. Eliminar: OK")
        except Exception as e:
            failed.append(f"9. Eliminar: Exception {e}")
    else:
        failed.append("9. Eliminar: Saltado (no test_id)")
    
    # Resumen
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print(f"\nPASADOS: {len(passed)}/{len(passed)+len(failed)}")
    for p in passed:
        print(f"  [OK] {p}")
    
    if failed:
        print(f"\nFALLIDOS: {len(failed)}/{len(passed)+len(failed)}")
        for f in failed:
            print(f"  [FAIL] {f}")
        print("\n>>> FASE 1: TESTS FALLIDOS <<<")
        return 1
    else:
        print("\n>>> FASE 1: COMPLETADA - TODOS LOS TESTS PASARON <<<")
        return 0

if __name__ == "__main__":
    try:
        sys.exit(test_basic())
    except KeyboardInterrupt:
        print("\n\nTest interrumpido")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR CRITICO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

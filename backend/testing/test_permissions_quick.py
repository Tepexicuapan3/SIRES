#!/usr/bin/env python3
"""Testing Rapido - CRUD de Permisos (Fase 2)"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.infrastructure.repositories.permission_repository import PermissionRepository
from src.use_cases.permissions.create_permission import CreatePermissionUseCase
from src.use_cases.permissions.update_permission import UpdatePermissionUseCase
from src.use_cases.permissions.delete_permission import DeletePermissionUseCase
from src.use_cases.permissions.get_permissions import GetPermissionsUseCase
from src.use_cases.permissions.assign_permissions_to_role import AssignPermissionsToRoleUseCase
from src.infrastructure.authorization.authorization_service import AuthorizationService

def test_permissions_crud():
    """Test basico de funcionalidad CRUD de permisos"""
    print("\n========== TESTING FASE 2: CRUD PERMISOS ==========\n")
    
    repo = PermissionRepository()
    auth_service = AuthorizationService()
    
    create_uc = CreatePermissionUseCase(repo)
    update_uc = UpdatePermissionUseCase(repo)
    delete_uc = DeletePermissionUseCase(repo)
    get_uc = GetPermissionsUseCase(repo)
    assign_uc = AssignPermissionsToRoleUseCase(repo, auth_service)
    
    passed = []
    failed = []
    
    # Test 1: Listar permisos
    print("[1/15] Listar permisos...")
    try:
        permissions = get_uc.get_all()
        if not permissions or len(permissions) == 0:
            failed.append("1. Listar permisos: Sin permisos")
        else:
            passed.append(f"1. Listar permisos: {len(permissions)} permisos obtenidos")
    except Exception as e:
        failed.append(f"1. Listar permisos: Exception {e}")
    
    # Test 2: Obtener detalle de permiso
    print("[2/15] Obtener permiso roles:read (debe existir)...")
    try:
        # Buscar ID del permiso roles:read
        all_perms = get_uc.get_all()
        roles_read = next((p for p in all_perms if p.get('code') == 'roles:read'), None)
        
        if not roles_read:
            failed.append("2. Get by ID: Permiso roles:read no encontrado")
        else:
            perm = get_uc.get_by_id(roles_read['id_permission'])
            if not perm:
                failed.append("2. Get by ID: No se pudo obtener")
            else:
                passed.append(f"2. Get by ID: {perm['code']}")
    except Exception as e:
        failed.append(f"2. Get by ID: Exception {e}")
    
    # Test 3: Crear permiso custom
    print("[3/15] Crear permiso custom...")
    test_perm_id = None
    try:
        result, error = create_uc.execute(
            code="testexp:export",
            resource="testexp",
            action="export",
            description="Exportar expedientes de prueba",
            category="Testing",
            usr_alta="TEST"
        )
        if error or not result:
            failed.append(f"3. Crear permiso: {error or 'Sin resultado'}")
        else:
            test_perm_id = result['id_permission']
            passed.append(f"3. Crear permiso: ID {test_perm_id}")
    except Exception as e:
        failed.append(f"3. Crear permiso: Exception {e}")
    
    # Test 4: Codigo duplicado
    print("[4/15] Validar codigo duplicado...")
    try:
        result, error = create_uc.execute(
            code="testexp:export",
            resource="testexp",
            action="export",
            description="Duplicado",
            usr_alta="TEST"
        )
        if error == "PERMISSION_CODE_EXISTS":
            passed.append("4. Codigo duplicado: Rechazado OK")
        else:
            failed.append(f"4. Codigo duplicado: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"4. Codigo duplicado: Exception {e}")
    
    # Test 5: Formato de codigo invalido
    print("[5/15] Validar formato de codigo invalido...")
    try:
        result, error = create_uc.execute(
            code="INVALID-CODE",
            resource="test",
            action="read",
            description="Test",
            usr_alta="TEST"
        )
        if error == "PERMISSION_CODE_INVALID":
            passed.append("5. Codigo invalido: Rechazado OK")
        else:
            failed.append(f"5. Codigo invalido: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"5. Codigo invalido: Exception {e}")
    
    # Test 6: Codigo muy largo
    print("[6/15] Validar codigo muy largo...")
    try:
        long_code = "a" * 60 + ":" + "b" * 60
        result, error = create_uc.execute(
            code=long_code,
            resource="test",
            action="read",
            description="Test",
            usr_alta="TEST"
        )
        if error == "PERMISSION_CODE_TOO_LONG":
            passed.append("6. Codigo largo: Rechazado OK")
        else:
            failed.append(f"6. Codigo largo: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"6. Codigo largo: Exception {e}")
    
    # Test 7: Resource requerido
    print("[7/15] Validar resource requerido...")
    try:
        result, error = create_uc.execute(
            code="test:read",
            resource="",
            action="read",
            description="Test",
            usr_alta="TEST"
        )
        if error == "PERMISSION_RESOURCE_REQUIRED":
            passed.append("7. Resource vacio: Rechazado OK")
        else:
            failed.append(f"7. Resource vacio: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"7. Resource vacio: Exception {e}")
    
    # Test 8: Code mismatch (code != resource:action)
    print("[8/15] Validar code mismatch...")
    try:
        result, error = create_uc.execute(
            code="wrong:code",
            resource="testexp",
            action="export",
            description="Test",
            usr_alta="TEST"
        )
        if error == "PERMISSION_CODE_MISMATCH":
            passed.append("8. Code mismatch: Rechazado OK")
        else:
            failed.append(f"8. Code mismatch: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"8. Code mismatch: Exception {e}")
    
    # Test 9: Actualizar permiso
    if test_perm_id:
        print(f"[9/15] Actualizar permiso {test_perm_id}...")
        try:
            result, error = update_uc.execute(
                permission_id=test_perm_id,
                description="Descripcion actualizada - Testing",
                category="Testing Updated",
                usr_modf="TEST"
            )
            if error or not result:
                failed.append(f"9. Actualizar: {error or 'Sin resultado'}")
            else:
                passed.append(f"9. Actualizar: OK (desc={result['description'][:30]}...)")
        except Exception as e:
            failed.append(f"9. Actualizar: Exception {e}")
    else:
        failed.append("9. Actualizar: Saltado (no test_perm_id)")
    
    # Test 10: Proteccion permiso del sistema
    print("[10/15] Validar proteccion permiso sistema...")
    try:
        # Intentar actualizar un permiso del sistema (ej: roles:read)
        all_perms = get_uc.get_all()
        system_perm = next((p for p in all_perms if p.get('is_system') == True or p.get('is_system') == 1), None)
        
        if not system_perm:
            failed.append("10. Permiso sistema: No se encontro permiso del sistema")
        else:
            result, error = update_uc.execute(
                permission_id=system_perm['id_permission'],
                description="Intento modificar sistema",
                usr_modf="TEST"
            )
            if error == "PERMISSION_SYSTEM_PROTECTED":
                passed.append("10. Permiso sistema: Protegido OK")
            else:
                failed.append(f"10. Permiso sistema: Debio proteger, retorno {error}")
    except Exception as e:
        failed.append(f"10. Permiso sistema: Exception {e}")
    
    # Test 11: Asignar permisos a rol
    print("[11/15] Asignar permiso a rol...")
    try:
        if not test_perm_id:
            failed.append("11. Asignar: Saltado (no test_perm_id)")
        else:
            # Buscar un rol de prueba (usamos MEDICOS id=1)
            success, error = assign_uc.execute(
                role_id=1,
                permission_ids=[test_perm_id],
                usr_alta="TEST"
            )
            if error or not success:
                failed.append(f"11. Asignar: {error or 'No exitoso'}")
            else:
                passed.append("11. Asignar: OK")
    except Exception as e:
        failed.append(f"11. Asignar: Exception {e}")
    
    # Test 12: Asignar multiples permisos
    print("[12/15] Asignar multiples permisos a rol...")
    try:
        # Buscar 2 permisos del sistema para asignar
        all_perms = get_uc.get_all()
        perm_ids = [p['id_permission'] for p in all_perms[:2]]
        
        success, error = assign_uc.execute(
            role_id=1,
            permission_ids=perm_ids,
            usr_alta="TEST"
        )
        if error or not success:
            failed.append(f"12. Asignar multiples: {error or 'No exitoso'}")
        else:
            passed.append(f"12. Asignar multiples: OK ({len(perm_ids)} permisos)")
    except Exception as e:
        failed.append(f"12. Asignar multiples: Exception {e}")
    
    # Test 13: Lista vacia de permisos
    print("[13/15] Validar lista vacia de permisos...")
    try:
        success, error = assign_uc.execute(
            role_id=1,
            permission_ids=[],
            usr_alta="TEST"
        )
        if error == "EMPTY_PERMISSION_LIST":
            passed.append("13. Lista vacia: Rechazado OK")
        else:
            failed.append(f"13. Lista vacia: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"13. Lista vacia: Exception {e}")
    
    # Test 14: Rol inexistente
    print("[14/15] Validar rol inexistente...")
    try:
        success, error = assign_uc.execute(
            role_id=9999,
            permission_ids=[1],
            usr_alta="TEST"
        )
        if error == "ROLE_NOT_FOUND":
            passed.append("14. Rol inexistente: Rechazado OK")
        else:
            failed.append(f"14. Rol inexistente: Debio rechazar, retorno {error}")
    except Exception as e:
        failed.append(f"14. Rol inexistente: Exception {e}")
    
    # Test 15: Eliminar permiso custom
    if test_perm_id:
        print(f"[15/15] Eliminar permiso {test_perm_id}...")
        try:
            # Primero quitar de roles para poder eliminar
            repo.revoke_permission_from_role(
                role_id=1,
                permission_id=test_perm_id,
                user_id="TEST"
            )
            
            success, error = delete_uc.execute(
                permission_id=test_perm_id,
                usr_baja="TEST"
            )
            if error or not success:
                failed.append(f"15. Eliminar: {error or 'No eliminado'}")
            else:
                passed.append("15. Eliminar: OK")
        except Exception as e:
            failed.append(f"15. Eliminar: Exception {e}")
    else:
        failed.append("15. Eliminar: Saltado (no test_perm_id)")
    
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
        print("\n>>> FASE 2: TESTS FALLIDOS <<<")
        return 1
    else:
        print("\n>>> FASE 2: COMPLETADA - TODOS LOS TESTS PASARON <<<")
        return 0

if __name__ == "__main__":
    try:
        sys.exit(test_permissions_crud())
    except KeyboardInterrupt:
        print("\n\nTest interrumpido")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR CRITICO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

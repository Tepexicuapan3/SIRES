#!/usr/bin/env python3
"""Testing Rapido - User Permission Overrides (Fase 4)"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.infrastructure.repositories.permission_repository import PermissionRepository
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.cache.redis_manager import RedisManager
from src.use_cases.permissions.add_user_permission_override import AddUserPermissionOverrideUseCase
from src.use_cases.permissions.remove_user_permission_override import RemoveUserPermissionOverrideUseCase
from src.use_cases.permissions.get_user_effective_permissions import GetUserEffectivePermissionsUseCase
from datetime import datetime, timedelta

def test_permission_overrides():
    """Test basico de funcionalidad de overrides de permisos"""
    print("\n========== TESTING FASE 4: USER PERMISSION OVERRIDES ==========\n")
    
    permission_repo = PermissionRepository()
    user_repo = UserRepository()
    redis = RedisManager()
    
    add_uc = AddUserPermissionOverrideUseCase(permission_repo, user_repo, redis)
    remove_uc = RemoveUserPermissionOverrideUseCase(permission_repo, user_repo, redis)
    get_effective_uc = GetUserEffectivePermissionsUseCase(permission_repo, user_repo)
    
    passed = []
    failed = []
    
    # Configuración: buscar un usuario de prueba (ID 2 o el primero disponible)
    print("[CONFIG] Buscando usuario de prueba...")
    test_user = user_repo.get_user_by_id(2)
    if not test_user:
        # Buscar cualquier usuario activo
        all_users = user_repo.get_all_users()
        test_user = next((u for u in all_users if u.get('habilitado') == 1), None)
    
    if not test_user:
        print("ERROR: No se encontró usuario de prueba. Abortando tests.")
        return
    
    test_user_id = test_user['id_usuario']
    print(f"[CONFIG] Usuario de prueba: ID {test_user_id} ({test_user.get('nombre_usuario', 'unknown')})")
    
    # Buscar permisos de prueba
    test_permission_code = "expedientes:delete"  # Permiso que probablemente no tengan usuarios comunes
    test_permission = permission_repo.get_permission_by_code(test_permission_code)
    
    if not test_permission:
        print(f"ERROR: Permiso '{test_permission_code}' no encontrado. Abortando tests.")
        return
    
    print(f"[CONFIG] Permiso de prueba: {test_permission_code} (ID {test_permission['id_permission']})")
    print()
    
    # Test 1: Agregar override ALLOW
    print("[1/8] Agregar override ALLOW...")
    try:
        result, error = add_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            effect="ALLOW",
            expires_at=None,
            usr_alta="TEST"
        )
        if error or not result:
            failed.append(f"1. Add ALLOW override: {error or 'Sin resultado'}")
        else:
            passed.append(f"1. Add ALLOW override: OK (effect={result['effect']})")
    except Exception as e:
        failed.append(f"1. Add ALLOW override: Exception {e}")
    
    # Test 2: Agregar override DENY (debe reemplazar el ALLOW anterior)
    print("[2/8] Agregar override DENY (reemplaza ALLOW)...")
    try:
        result, error = add_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            effect="DENY",
            expires_at=None,
            usr_alta="TEST"
        )
        if error or not result:
            failed.append(f"2. Add DENY override: {error or 'Sin resultado'}")
        else:
            passed.append(f"2. Add DENY override: OK (effect={result['effect']})")
    except Exception as e:
        failed.append(f"2. Add DENY override: Exception {e}")
    
    # Test 3: Validar effect inválido
    print("[3/8] Validar effect inválido...")
    try:
        result, error = add_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            effect="MAYBE",  # Inválido
            expires_at=None,
            usr_alta="TEST"
        )
        if error == "INVALID_EFFECT":
            passed.append("3. Validar effect inválido: OK (rechazado)")
        else:
            failed.append(f"3. Validar effect inválido: Esperaba INVALID_EFFECT, obtuvo {error}")
    except Exception as e:
        failed.append(f"3. Validar effect inválido: Exception {e}")
    
    # Test 4: Validar fecha expiración inválida
    print("[4/8] Validar fecha expiración inválida...")
    try:
        result, error = add_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            effect="ALLOW",
            expires_at="invalid-date-format",
            usr_alta="TEST"
        )
        if error == "INVALID_EXPIRATION_DATE":
            passed.append("4. Validar fecha inválida: OK (rechazado)")
        else:
            failed.append(f"4. Validar fecha inválida: Esperaba INVALID_EXPIRATION_DATE, obtuvo {error}")
    except Exception as e:
        failed.append(f"4. Validar fecha inválida: Exception {e}")
    
    # Test 5: Agregar override con fecha de expiración válida
    print("[5/8] Agregar override con fecha de expiración...")
    expires_datetime = datetime.now() + timedelta(days=7)
    expires_iso = expires_datetime.isoformat()
    try:
        result, error = add_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            effect="ALLOW",
            expires_at=expires_iso,
            usr_alta="TEST"
        )
        if error or not result:
            failed.append(f"5. Add override con expiración: {error or 'Sin resultado'}")
        else:
            passed.append(f"5. Add override con expiración: OK (expires_at={result['expires_at']})")
    except Exception as e:
        failed.append(f"5. Add override con expiración: Exception {e}")
    
    # Test 6: Obtener lista de overrides
    print("[6/8] Obtener lista de overrides...")
    try:
        overrides = permission_repo.get_user_permission_overrides_list(test_user_id)
        if overrides is None:
            failed.append("6. Listar overrides: Sin resultado")
        elif len(overrides) == 0:
            failed.append("6. Listar overrides: Lista vacía (esperaba 1 override)")
        else:
            # Verificar que existe nuestro override
            override_found = any(o['permission_code'] == test_permission_code for o in overrides)
            if override_found:
                passed.append(f"6. Listar overrides: OK ({len(overrides)} overrides)")
            else:
                failed.append(f"6. Listar overrides: Override creado no encontrado (total: {len(overrides)})")
    except Exception as e:
        failed.append(f"6. Listar overrides: Exception {e}")
    
    # Test 7: Obtener permisos efectivos (con overrides aplicados)
    print("[7/8] Obtener permisos efectivos...")
    try:
        result, error = get_effective_uc.execute(test_user_id)
        if error or not result:
            failed.append(f"7. Get effective permissions: {error or 'Sin resultado'}")
        else:
            # Verificar que existen permisos y overrides
            total_perms = len(result.get('permissions', []))
            overrides_count = result.get('overrides_count', 0)
            passed.append(f"7. Get effective permissions: OK ({total_perms} permisos, {overrides_count} overrides)")
    except Exception as e:
        failed.append(f"7. Get effective permissions: Exception {e}")
    
    # Test 8: Eliminar override
    print("[8/8] Eliminar override...")
    try:
        result, error = remove_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            usr_baja="TEST"
        )
        if error or not result:
            failed.append(f"8. Remove override: {error or 'Sin resultado'}")
        else:
            passed.append(f"8. Remove override: OK (code={result['permission_code']})")
    except Exception as e:
        failed.append(f"8. Remove override: Exception {e}")
    
    # Test 9 (Bonus): Validar eliminar override inexistente
    print("[BONUS] Validar eliminar override inexistente...")
    try:
        result, error = remove_uc.execute(
            user_id=test_user_id,
            permission_code=test_permission_code,
            usr_baja="TEST"
        )
        if error == "OVERRIDE_NOT_FOUND":
            passed.append("BONUS. Remove inexistente: OK (rechazado)")
        else:
            failed.append(f"BONUS. Remove inexistente: Esperaba OVERRIDE_NOT_FOUND, obtuvo {error}")
    except Exception as e:
        failed.append(f"BONUS. Remove inexistente: Exception {e}")
    
    # Resultados
    print("\n========== RESULTADOS ==========")
    print(f"\nTESTS PASSED ({len(passed)}):")
    for p in passed:
        print(f"  ✅ {p}")
    
    if failed:
        print(f"\nTESTS FAILED ({len(failed)}):")
        for f in failed:
            print(f"  ❌ {f}")
    
    total = len(passed) + len(failed)
    print(f"\nTOTAL: {len(passed)}/{total} passed ({100*len(passed)//total if total > 0 else 0}%)")
    
    if len(failed) == 0:
        print("\n🎉 TODOS LOS TESTS PASARON! Fase 4 completada correctamente.\n")
        return 0
    else:
        print(f"\n⚠️  {len(failed)} tests fallaron. Revisar implementación.\n")
        return 1

if __name__ == "__main__":
    sys.exit(test_permission_overrides())

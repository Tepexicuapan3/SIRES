"""
TEST SUITE COMPLETO - TODAS LAS FASES
Ejecuta los 3 scripts de test en secuencia
"""
import subprocess
import sys
from pathlib import Path

def run_test_phase(script_name, phase_name):
    print("\n" + "="*80)
    print(f"EJECUTANDO: {phase_name}")
    print("="*80)
    
    # Obtener directorio del script actual
    current_dir = Path(__file__).parent
    script_path = current_dir / script_name
    
    result = subprocess.run(
        [sys.executable, str(script_path)],
        capture_output=True,
        text=True,
        timeout=300
    )
    
    print(result.stdout)
    if result.stderr:
        print(f"STDERR: {result.stderr}")
    
    return result.returncode == 0

print("="*80)
print("SIRES - TEST SUITE COMPLETO - USUARIOS CRUD")
print("="*80)
print("Este script ejecuta las 3 fases de testing:")
print("  - Phase 1: READ operations (5 tests)")
print("  - Phase 2: UPDATE operations (6 tests)")
print("  - Phase 3: ROLE & STATUS operations (8 tests)")
print("="*80)

results = {}

# Phase 1
results['Phase 1'] = run_test_phase('test_users_read.py', 'PHASE 1: READ OPERATIONS')

# Phase 2
results['Phase 2'] = run_test_phase('test_users_update.py', 'PHASE 2: UPDATE OPERATIONS')

# Phase 3
results['Phase 3'] = run_test_phase('test_users_role_status.py', 'PHASE 3: ROLE & STATUS OPERATIONS')

# RESUMEN FINAL
print("\n" + "="*80)
print("RESUMEN FINAL - TODOS LOS TESTS")
print("="*80)

total_passed = sum(1 for v in results.values() if v)
total_failed = len(results) - total_passed

for phase, passed in results.items():
    status = "[OK] PASS" if passed else "[FAIL] FAIL"
    print(f"{status}  {phase}")

print("\n" + "-"*80)
print(f"Fases completadas: {total_passed}/3")
print(f"Fases fallidas: {total_failed}/3")

if total_failed == 0:
    print("\n" + "="*80)
    print("TODAS LAS FASES EXITOSAS - 19 TESTS PASARON")
    print("="*80)
    sys.exit(0)
else:
    print("\n" + "="*80)
    print(f"ATENCION: {total_failed} fase(s) con errores")
    print("="*80)
    sys.exit(1)

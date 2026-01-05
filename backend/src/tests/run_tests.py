#!/usr/bin/env python3
"""
Test Runner Principal - SIRES Backend

Ejecuta todos los tests o tests específicos por módulo.

Uso:
    python run_tests.py                    # Todos los tests
    python run_tests.py users              # Solo tests de usuarios
    python run_tests.py users read         # Solo tests de READ de usuarios
    python run_tests.py --help             # Ayuda
"""
import sys
import subprocess
from pathlib import Path

# Configuración de colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    """Imprime header colorido."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}\n")

def run_test_suite(test_path: Path, name: str) -> bool:
    """
    Ejecuta una suite de tests.
    
    Args:
        test_path: Ruta al archivo de test
        name: Nombre descriptivo del test
        
    Returns:
        True si todos los tests pasaron
    """
    print(f"{Colors.BOLD}Ejecutando: {name}{Colors.RESET}")
    print(f"Archivo: {test_path}")
    print("-" * 80)
    
    try:
        result = subprocess.run(
            [sys.executable, str(test_path)],
            capture_output=True,
            text=True,
            timeout=600  # 10 minutos max
        )
        
        # Imprimir output
        print(result.stdout)
        
        if result.stderr:
            print(f"{Colors.YELLOW}STDERR:{Colors.RESET}")
            print(result.stderr)
        
        # Resultado
        if result.returncode == 0:
            print(f"{Colors.GREEN}{Colors.BOLD}[OK] {name} - EXITOSO{Colors.RESET}\n")
            return True
        else:
            print(f"{Colors.RED}{Colors.BOLD}[FAIL] {name} - FALLIDO{Colors.RESET}\n")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"{Colors.RED}{Colors.BOLD}[FAIL] {name} - TIMEOUT{Colors.RESET}\n")
        return False
    except Exception as e:
        print(f"{Colors.RED}{Colors.BOLD}[FAIL] {name} - ERROR: {e}{Colors.RESET}\n")
        return False

def main():
    """Función principal."""
    # Directorio base de tests
    tests_dir = Path(__file__).parent
    integration_dir = tests_dir / "integration"
    
    # Parsear argumentos
    args = sys.argv[1:]
    
    if "--help" in args or "-h" in args:
        print(__doc__)
        return
    
    # Determinar qué tests ejecutar
    results = {}
    
    if not args or args[0] == "all":
        # Ejecutar todos los tests
        print_header("EJECUTANDO TODOS LOS TESTS")
        
        # Users complete suite
        users_complete = integration_dir / "users" / "test_users_complete.py"
        if users_complete.exists():
            results["Users CRUD (19 tests)"] = run_test_suite(
                users_complete,
                "Users CRUD - Suite Completa"
            )
    
    elif args[0] == "users":
        print_header("TESTS DE USUARIOS")
        
        if len(args) == 1:
            # Todos los tests de usuarios
            users_complete = integration_dir / "users" / "test_users_complete.py"
            if users_complete.exists():
                results["Users Complete"] = run_test_suite(
                    users_complete,
                    "Users CRUD - Suite Completa (19 tests)"
                )
        else:
            # Test específico de usuarios
            phase = args[1].lower()
            test_files = {
                "read": ("test_users_read.py", "Users - READ Operations (5 tests)"),
                "update": ("test_users_update.py", "Users - UPDATE Operations (6 tests)"),
                "role": ("test_users_role_status.py", "Users - ROLE & STATUS (8 tests)"),
                "status": ("test_users_role_status.py", "Users - ROLE & STATUS (8 tests)"),
            }
            
            if phase in test_files:
                filename, description = test_files[phase]
                test_path = integration_dir / "users" / filename
                if test_path.exists():
                    results[description] = run_test_suite(test_path, description)
                else:
                    print(f"{Colors.RED}Error: Test file not found: {test_path}{Colors.RESET}")
            else:
                print(f"{Colors.RED}Error: Unknown test phase '{phase}'{Colors.RESET}")
                print(f"Available: read, update, role, status")
    
    else:
        print(f"{Colors.RED}Error: Unknown module '{args[0]}'{Colors.RESET}")
        print(f"Available modules: users, all")
        print(f"Use --help for more information")
        sys.exit(1)
    
    # Resumen final
    if results:
        print_header("RESUMEN FINAL")
        
        total = len(results)
        passed = sum(1 for v in results.values() if v)
        failed = total - passed
        
        for name, success in results.items():
            status = f"{Colors.GREEN}[OK] PASS{Colors.RESET}" if success else f"{Colors.RED}[FAIL] FAIL{Colors.RESET}"
            print(f"{status}  {name}")
        
        print(f"\n{'-'*80}")
        print(f"Total: {total} suite(s)")
        print(f"{Colors.GREEN}Pasaron: {passed}{Colors.RESET}")
        print(f"{Colors.RED}Fallaron: {failed}{Colors.RESET}")
        
        if failed == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*80}")
            print(f"[OK] TODOS LOS TESTS EXITOSOS".center(80))
            print(f"{'='*80}{Colors.RESET}\n")
            sys.exit(0)
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}{'='*80}")
            print(f"[FAIL] ALGUNOS TESTS FALLARON".center(80))
            print(f"{'='*80}{Colors.RESET}\n")
            sys.exit(1)
    else:
        print(f"{Colors.YELLOW}No se ejecutaron tests.{Colors.RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()

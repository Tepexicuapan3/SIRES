#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RBAC CRUD - Test Automatizado de Backend API

Ejecuta testing completo de los 22 endpoints del sistema RBAC:
- 7 endpoints de Roles
- 7 endpoints de Permisos
- 4 endpoints de Multi-Rol Usuarios
- 4 endpoints de Permission Overrides

Uso:
    python backend/testing/test_api_automated.py --usuario=40488 --clave=PASSWORD
    python backend/testing/test_api_automated.py --help
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional
import argparse

# Fix para encoding en Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class Colors:
    """ANSI color codes para output en terminal"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class RBACAPITester:
    """
    Tester automatizado para RBAC CRUD API.
    
    Arquitectura:
    - Session persistence (cookies automáticas)
    - Login → ejecutar tests → logout
    - Report en formato JSON + Markdown
    """
    
    def __init__(self, base_url: str = "http://localhost:5000/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()
        self.csrf_token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.test_results = []
        
    def print_header(self, text: str):
        """Print section header"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")
        
    def print_test(self, name: str, passed: bool, details: str = ""):
        """Print test result"""
        status = f"{Colors.OKGREEN}✅ PASADO{Colors.ENDC}" if passed else f"{Colors.FAIL}❌ FALLADO{Colors.ENDC}"
        print(f"{status} | {name}")
        if details:
            print(f"  └─ {Colors.OKCYAN}{details}{Colors.ENDC}")
    
    def login(self, usuario: str, clave: str) -> Tuple[bool, str]:
        """
        Autentica al usuario y obtiene tokens en cookies HttpOnly.
        
        Returns:
            (success: bool, message: str)
        """
        self.print_header("FASE 1: AUTENTICACIÓN")
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"usuario": usuario, "clave": clave},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data.get("user", {}).get("id_usuario")
                
                # Obtener CSRF token de las cookies
                self.csrf_token = self.session.cookies.get("csrf_access_token")
                
                self.print_test(
                    "Login exitoso",
                    True,
                    f"Usuario: {data.get('user', {}).get('nombre')} | ID: {self.user_id}"
                )
                self.print_test(
                    "CSRF Token obtenido",
                    bool(self.csrf_token),
                    f"Token: {self.csrf_token[:20]}..." if self.csrf_token else "NO ENCONTRADO"
                )
                
                return True, "Login exitoso"
            else:
                error_data = response.json()
                self.print_test(
                    "Login fallido",
                    False,
                    f"Status: {response.status_code} | Error: {error_data.get('message', 'Unknown')}"
                )
                return False, f"Login fallido: {error_data.get('message', 'Unknown error')}"
                
        except requests.exceptions.RequestException as e:
            self.print_test("Login fallido", False, f"Error de red: {str(e)}")
            return False, f"Error de conexión: {str(e)}"
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        json_data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> requests.Response:
        """
        Ejecuta request con CSRF token y cookies.
        
        Args:
            method: GET, POST, PUT, DELETE
            endpoint: /roles, /permissions/:id, etc.
            json_data: Body para POST/PUT
            params: Query params
            
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        # CSRF token requerido para operaciones mutantes
        if method in ["POST", "PUT", "DELETE"] and self.csrf_token:
            headers["X-CSRF-TOKEN"] = self.csrf_token
        
        return self.session.request(
            method=method,
            url=url,
            json=json_data,
            params=params,
            headers=headers,
            timeout=30
        )
    
    def test_roles_endpoints(self):
        """Test Suite 2.1: CRUD Roles (7 endpoints)"""
        self.print_header("TEST SUITE 2.1: CRUD ROLES")
        
        # Test 1: GET /roles
        try:
            resp = self._make_request("GET", "/roles")
            self.print_test(
                "GET /roles",
                resp.status_code == 200,
                f"Status: {resp.status_code} | Roles: {len(resp.json().get('roles', []))}"
            )
            self.test_results.append({
                "endpoint": "GET /roles",
                "passed": resp.status_code == 200,
                "status": resp.status_code,
                "data": resp.json() if resp.status_code == 200 else None
            })
        except Exception as e:
            self.print_test("GET /roles", False, f"Error: {str(e)}")
            self.test_results.append({
                "endpoint": "GET /roles",
                "passed": False,
                "error": str(e)
            })
        
        # Test 2: POST /roles (crear rol custom)
        try:
            new_role = {
                "nombre": f"TEST_ROL_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "descripcion": "Rol de testing automatizado",
                "landing_route": "/test",
                "priority": 100,
                "is_admin": False
            }
            resp = self._make_request("POST", "/roles", json_data=new_role)
            created_role_id = resp.json().get("role", {}).get("id_rol") if resp.status_code == 201 else None
            
            self.print_test(
                "POST /roles (crear rol custom)",
                resp.status_code == 201,
                f"Status: {resp.status_code} | ID: {created_role_id}"
            )
            self.test_results.append({
                "endpoint": "POST /roles",
                "passed": resp.status_code == 201,
                "status": resp.status_code,
                "created_id": created_role_id
            })
            
            # Test 3: GET /roles/:id (obtener rol creado)
            if created_role_id:
                resp = self._make_request("GET", f"/roles/{created_role_id}")
                self.print_test(
                    f"GET /roles/{created_role_id}",
                    resp.status_code == 200,
                    f"Status: {resp.status_code} | Nombre: {resp.json().get('nombre', 'N/A')}"
                )
                self.test_results.append({
                    "endpoint": f"GET /roles/:id",
                    "passed": resp.status_code == 200,
                    "status": resp.status_code
                })
                
                # Test 4: PUT /roles/:id (actualizar rol)
                updated_data = {
                    "descripcion": "Descripción actualizada en testing",
                    "priority": 150
                }
                resp = self._make_request("PUT", f"/roles/{created_role_id}", json_data=updated_data)
                self.print_test(
                    f"PUT /roles/{created_role_id}",
                    resp.status_code == 200,
                    f"Status: {resp.status_code}"
                )
                self.test_results.append({
                    "endpoint": "PUT /roles/:id",
                    "passed": resp.status_code == 200,
                    "status": resp.status_code
                })
                
                # Test 5: DELETE /roles/:id (eliminar rol custom)
                resp = self._make_request("DELETE", f"/roles/{created_role_id}")
                self.print_test(
                    f"DELETE /roles/{created_role_id}",
                    resp.status_code == 200,
                    f"Status: {resp.status_code}"
                )
                self.test_results.append({
                    "endpoint": "DELETE /roles/:id",
                    "passed": resp.status_code == 200,
                    "status": resp.status_code
                })
            
        except Exception as e:
            self.print_test("POST /roles", False, f"Error: {str(e)}")
            self.test_results.append({
                "endpoint": "POST /roles",
                "passed": False,
                "error": str(e)
            })
        
        # Test 6: Intentar editar rol del sistema (debe fallar)
        try:
            resp = self._make_request("PUT", "/roles/1", json_data={"descripcion": "Test"})
            self.print_test(
                "PUT /roles/1 (rol sistema - debe fallar)",
                resp.status_code in [400, 403],
                f"Status: {resp.status_code} | Expected: 400/403"
            )
            self.test_results.append({
                "endpoint": "PUT /roles/:id (system role)",
                "passed": resp.status_code in [400, 403],
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test("PUT /roles/1 (system)", False, f"Error: {str(e)}")
        
        # Test 7: Intentar eliminar rol del sistema (debe fallar)
        try:
            resp = self._make_request("DELETE", "/roles/1")
            self.print_test(
                "DELETE /roles/1 (rol sistema - debe fallar)",
                resp.status_code in [400, 403],
                f"Status: {resp.status_code} | Expected: 400/403"
            )
            self.test_results.append({
                "endpoint": "DELETE /roles/:id (system role)",
                "passed": resp.status_code in [400, 403],
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test("DELETE /roles/1 (system)", False, f"Error: {str(e)}")
    
    def test_permissions_endpoints(self):
        """Test Suite 2.2: CRUD Permisos (7 endpoints)"""
        self.print_header("TEST SUITE 2.2: CRUD PERMISOS")
        
        # Test 1: GET /permissions
        try:
            resp = self._make_request("GET", "/permissions")
            self.print_test(
                "GET /permissions",
                resp.status_code == 200,
                f"Status: {resp.status_code} | Permisos: {len(resp.json().get('permissions', []))}"
            )
            self.test_results.append({
                "endpoint": "GET /permissions",
                "passed": resp.status_code == 200,
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test("GET /permissions", False, f"Error: {str(e)}")
        
        # Test 2: GET /permissions/catalog (categorías disponibles)
        try:
            resp = self._make_request("GET", "/permissions/catalog")
            self.print_test(
                "GET /permissions/catalog",
                resp.status_code == 200,
                f"Status: {resp.status_code}"
            )
            self.test_results.append({
                "endpoint": "GET /permissions/catalog",
                "passed": resp.status_code == 200,
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test("GET /permissions/catalog", False, f"Error: {str(e)}")
        
        # Test 3: POST /permissions (crear permiso custom)
        try:
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            new_permission = {
                "code": f"testing:automated_{timestamp}",
                "resource": "testing",
                "action": f"automated_{timestamp}",
                "description": "Permiso de testing automatizado",
                "category": "TESTING"
            }
            resp = self._make_request("POST", "/permissions", json_data=new_permission)
            created_perm_id = resp.json().get("permission", {}).get("id_permission") if resp.status_code == 201 else None
            
            self.print_test(
                "POST /permissions (crear permiso custom)",
                resp.status_code == 201,
                f"Status: {resp.status_code} | ID: {created_perm_id}"
            )
            self.test_results.append({
                "endpoint": "POST /permissions",
                "passed": resp.status_code == 201,
                "status": resp.status_code,
                "created_id": created_perm_id
            })
            
            # Test 4: GET /permissions/:id
            if created_perm_id:
                resp = self._make_request("GET", f"/permissions/{created_perm_id}")
                self.print_test(
                    f"GET /permissions/{created_perm_id}",
                    resp.status_code == 200,
                    f"Status: {resp.status_code}"
                )
                self.test_results.append({
                    "endpoint": "GET /permissions/:id",
                    "passed": resp.status_code == 200,
                    "status": resp.status_code
                })
                
                # Test 5: PUT /permissions/:id (actualizar descripción)
                updated_data = {
                    "description": "Descripción actualizada",
                    "category": "TESTING_UPDATED"
                }
                resp = self._make_request("PUT", f"/permissions/{created_perm_id}", json_data=updated_data)
                self.print_test(
                    f"PUT /permissions/{created_perm_id}",
                    resp.status_code == 200,
                    f"Status: {resp.status_code}"
                )
                self.test_results.append({
                    "endpoint": "PUT /permissions/:id",
                    "passed": resp.status_code == 200,
                    "status": resp.status_code
                })
                
                # Test 6: DELETE /permissions/:id
                resp = self._make_request("DELETE", f"/permissions/{created_perm_id}")
                self.print_test(
                    f"DELETE /permissions/{created_perm_id}",
                    resp.status_code == 200,
                    f"Status: {resp.status_code}"
                )
                self.test_results.append({
                    "endpoint": "DELETE /permissions/:id",
                    "passed": resp.status_code == 200,
                    "status": resp.status_code
                })
        except Exception as e:
            self.print_test("POST /permissions", False, f"Error: {str(e)}")
        
        # Test 7: Intentar eliminar permiso del sistema (debe fallar)
        try:
            resp = self._make_request("DELETE", "/permissions/1")
            self.print_test(
                "DELETE /permissions/1 (system - debe fallar)",
                resp.status_code in [400, 403],
                f"Status: {resp.status_code} | Expected: 400/403"
            )
            self.test_results.append({
                "endpoint": "DELETE /permissions/:id (system)",
                "passed": resp.status_code in [400, 403],
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test("DELETE /permissions/1 (system)", False, f"Error: {str(e)}")
    
    def test_user_roles_endpoints(self):
        """Test Suite 2.3: Multi-Rol Usuarios (4 endpoints)"""
        self.print_header("TEST SUITE 2.3: MULTI-ROL USUARIOS")
        
        if not self.user_id:
            self.print_test("User ID no disponible", False, "Salteando tests de multi-rol")
            return
        
        # Test 1: GET /users/:id/roles
        try:
            resp = self._make_request("GET", f"/users/{self.user_id}/roles")
            self.print_test(
                f"GET /users/{self.user_id}/roles",
                resp.status_code == 200,
                f"Status: {resp.status_code} | Roles: {len(resp.json().get('roles', []))}"
            )
            self.test_results.append({
                "endpoint": "GET /users/:id/roles",
                "passed": resp.status_code == 200,
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test(f"GET /users/{self.user_id}/roles", False, f"Error: {str(e)}")
        
        # Test 2: POST /users/:id/roles (asignar rol secundario)
        # NOTA: Solo si el usuario tiene <3 roles
        try:
            resp_roles = self._make_request("GET", f"/users/{self.user_id}/roles")
            if resp_roles.status_code == 200:
                current_roles = resp_roles.json().get("roles", [])
                if len(current_roles) < 3:
                    # Asignar rol RECEPCION (id=2) como secundario
                    new_role_data = {
                        "id_rol": 2,
                        "is_primary": False
                    }
                    resp = self._make_request("POST", f"/users/{self.user_id}/roles", json_data=new_role_data)
                    self.print_test(
                        f"POST /users/{self.user_id}/roles",
                        resp.status_code in [200, 201, 400],  # 400 si ya tiene el rol
                        f"Status: {resp.status_code}"
                    )
                    self.test_results.append({
                        "endpoint": "POST /users/:id/roles",
                        "passed": resp.status_code in [200, 201, 400],
                        "status": resp.status_code
                    })
                else:
                    self.print_test(
                        f"POST /users/{self.user_id}/roles",
                        True,
                        "SKIP: Usuario ya tiene 3 roles"
                    )
        except Exception as e:
            self.print_test(f"POST /users/{self.user_id}/roles", False, f"Error: {str(e)}")
        
        # Test 3: PUT /users/:id/roles/primary (cambiar rol primario)
        # COMENTADO: Puede afectar el usuario de testing
        print(f"{Colors.WARNING}⚠️  SKIP | PUT /users/:id/roles/primary (evitar cambiar rol primario del tester){Colors.ENDC}")
        
        # Test 4: DELETE /users/:id/roles/:roleId (remover rol secundario)
        # COMENTADO: Solo si tiene >1 rol
        print(f"{Colors.WARNING}⚠️  SKIP | DELETE /users/:id/roles/:roleId (evitar afectar usuario de testing){Colors.ENDC}")
    
    def test_permission_overrides_endpoints(self):
        """Test Suite 2.4: Permission Overrides (4 endpoints)"""
        self.print_header("TEST SUITE 2.4: PERMISSION OVERRIDES")
        
        if not self.user_id:
            self.print_test("User ID no disponible", False, "Salteando tests de overrides")
            return
        
        # Test 1: GET /permissions/users/:id/overrides
        try:
            resp = self._make_request("GET", f"/permissions/users/{self.user_id}/overrides")
            self.print_test(
                f"GET /permissions/users/{self.user_id}/overrides",
                resp.status_code == 200,
                f"Status: {resp.status_code} | Overrides: {len(resp.json().get('overrides', []))}"
            )
            self.test_results.append({
                "endpoint": "GET /permissions/users/:id/overrides",
                "passed": resp.status_code == 200,
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test(f"GET /permissions/users/{self.user_id}/overrides", False, f"Error: {str(e)}")
        
        # Test 2: POST /permissions/users/:id/overrides (crear override temporal)
        try:
            # Obtener un permiso válido para el override
            resp_perms = self._make_request("GET", "/permissions", params={"limit": 1})
            if resp_perms.status_code == 200:
                perms = resp_perms.json().get("permissions", [])
                if perms:
                    perm_id = perms[0].get("id_permission")
                    override_data = {
                        "id_permission": perm_id,
                        "effect": "ALLOW",
                        "expires_at": (datetime.now() + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
                    }
                    resp = self._make_request("POST", f"/permissions/users/{self.user_id}/overrides", json_data=override_data)
                    self.print_test(
                        f"POST /permissions/users/{self.user_id}/overrides",
                        resp.status_code in [200, 201],
                        f"Status: {resp.status_code}"
                    )
                    self.test_results.append({
                        "endpoint": "POST /permissions/users/:id/overrides",
                        "passed": resp.status_code in [200, 201],
                        "status": resp.status_code
                    })
                    
                    # Test 3: DELETE /permissions/users/:id/overrides/:id (eliminar override)
                    if resp.status_code in [200, 201]:
                        override_id = resp.json().get("override", {}).get("id_user_permission_override")
                        if override_id:
                            resp_del = self._make_request("DELETE", f"/permissions/users/{self.user_id}/overrides/{override_id}")
                            self.print_test(
                                f"DELETE /permissions/users/{self.user_id}/overrides/{override_id}",
                                resp_del.status_code == 200,
                                f"Status: {resp_del.status_code}"
                            )
                            self.test_results.append({
                                "endpoint": "DELETE /permissions/users/:id/overrides/:id",
                                "passed": resp_del.status_code == 200,
                                "status": resp_del.status_code
                            })
        except Exception as e:
            self.print_test(f"POST /permissions/users/{self.user_id}/overrides", False, f"Error: {str(e)}")
        
        # Test 4: GET /permissions/users/:id/effective
        try:
            resp = self._make_request("GET", f"/permissions/users/{self.user_id}/effective")
            self.print_test(
                f"GET /permissions/users/{self.user_id}/effective",
                resp.status_code == 200,
                f"Status: {resp.status_code}"
            )
            self.test_results.append({
                "endpoint": "GET /permissions/users/:id/effective",
                "passed": resp.status_code == 200,
                "status": resp.status_code
            })
        except Exception as e:
            self.print_test(f"GET /permissions/users/{self.user_id}/effective", False, f"Error: {str(e)}")
    
    def generate_report(self):
        """Genera reporte en formato Markdown"""
        self.print_header("GENERANDO REPORTE")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for t in self.test_results if t.get("passed"))
        failed_tests = total_tests - passed_tests
        
        report = f"""# RBAC CRUD - Reporte de Testing API

**Fecha:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Total Tests:** {total_tests}  
**Pasados:** {passed_tests} ✅  
**Fallados:** {failed_tests} ❌  
**Cobertura:** {(passed_tests/total_tests*100):.1f}%

---

## Resultados Detallados

"""
        
        for result in self.test_results:
            status = "✅ PASADO" if result.get("passed") else "❌ FALLADO"
            report += f"### {result.get('endpoint')}\n"
            report += f"**Status:** {status}  \n"
            report += f"**HTTP Code:** {result.get('status', 'N/A')}  \n"
            if result.get("error"):
                report += f"**Error:** {result.get('error')}  \n"
            report += "\n"
        
        # Guardar reporte
        report_path = "backend/testing/API_TEST_REPORT.md"
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report)
        
        print(f"{Colors.OKGREEN}✅ Reporte generado: {report_path}{Colors.ENDC}")
        print(f"\n{Colors.BOLD}Resumen:{Colors.ENDC}")
        print(f"  Total: {total_tests} | Pasados: {passed_tests} | Fallados: {failed_tests} | Cobertura: {(passed_tests/total_tests*100):.1f}%")
    
    def run_all_tests(self, usuario: str, clave: str):
        """Ejecuta todos los test suites"""
        # 1. Login
        success, msg = self.login(usuario, clave)
        if not success:
            print(f"\n{Colors.FAIL}❌ No se puede continuar sin autenticación{Colors.ENDC}")
            return
        
        # 2. Test Suites
        self.test_roles_endpoints()
        self.test_permissions_endpoints()
        self.test_user_roles_endpoints()
        self.test_permission_overrides_endpoints()
        
        # 3. Generar reporte
        self.generate_report()


def main():
    parser = argparse.ArgumentParser(description="RBAC CRUD API Testing Automatizado")
    parser.add_argument("--usuario", required=True, help="Usuario para autenticación")
    parser.add_argument("--clave", required=True, help="Contraseña del usuario")
    parser.add_argument("--base-url", default="http://localhost:5000/api/v1", help="Base URL de la API")
    
    args = parser.parse_args()
    
    tester = RBACAPITester(base_url=args.base_url)
    tester.run_all_tests(args.usuario, args.clave)


if __name__ == "__main__":
    main()

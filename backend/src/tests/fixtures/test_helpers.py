"""
Test Helpers y Fixtures Compartidos
Utilidades comunes para todos los tests
"""
import requests
from typing import Tuple, Optional

# Configuración
BASE_URL = "http://localhost:5000/api/v1"
DEFAULT_TIMEOUT = 30

# Usuarios de prueba
TEST_ADMIN_USER = "testrbac"
TEST_ADMIN_PASSWORD = "Test123!"
TEST_ADMIN_ID = 13

TEST_REGULAR_USER = "testmedico"
TEST_REGULAR_PASSWORD = "Test123!"
TEST_REGULAR_USER_ID = 14


class TestSession:
    """
    Wrapper para sesión de requests con autenticación automática.
    """
    def __init__(self):
        self.session = requests.Session()
        self.csrf_token: Optional[str] = None
        self.user_id: Optional[int] = None
        
    def login(self, usuario: str = TEST_ADMIN_USER, clave: str = TEST_ADMIN_PASSWORD) -> Tuple[bool, str]:
        """
        Realiza login y obtiene CSRF token.
        
        Returns:
            (success: bool, message: str)
        """
        try:
            resp = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"usuario": usuario, "clave": clave},
                timeout=DEFAULT_TIMEOUT
            )
            
            if resp.status_code != 200:
                return False, f"Login failed with status {resp.status_code}"
            
            data = resp.json()
            self.user_id = data.get('user', {}).get('id_usuario')
            
            # Obtener CSRF token
            csrf_cookies = [c.value for c in self.session.cookies if c.name == 'csrf_access_token']
            self.csrf_token = csrf_cookies[0] if csrf_cookies else None
            
            if not self.csrf_token:
                return False, "CSRF token not found in cookies"
            
            return True, f"Login exitoso. User ID: {self.user_id}"
            
        except Exception as e:
            return False, f"Exception during login: {e}"
    
    def get(self, endpoint: str, **kwargs) -> requests.Response:
        """GET request con timeout automático."""
        kwargs.setdefault('timeout', DEFAULT_TIMEOUT)
        return self.session.get(f"{BASE_URL}{endpoint}", **kwargs)
    
    def post(self, endpoint: str, **kwargs) -> requests.Response:
        """POST request con CSRF token y timeout."""
        kwargs.setdefault('timeout', DEFAULT_TIMEOUT)
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        if self.csrf_token:
            kwargs['headers']['X-CSRF-TOKEN'] = self.csrf_token
        return self.session.post(f"{BASE_URL}{endpoint}", **kwargs)
    
    def patch(self, endpoint: str, **kwargs) -> requests.Response:
        """PATCH request con CSRF token y timeout."""
        kwargs.setdefault('timeout', DEFAULT_TIMEOUT)
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        if self.csrf_token:
            kwargs['headers']['X-CSRF-TOKEN'] = self.csrf_token
        return self.session.patch(f"{BASE_URL}{endpoint}", **kwargs)
    
    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        """DELETE request con CSRF token y timeout."""
        kwargs.setdefault('timeout', DEFAULT_TIMEOUT)
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        if self.csrf_token:
            kwargs['headers']['X-CSRF-TOKEN'] = self.csrf_token
        return self.session.delete(f"{BASE_URL}{endpoint}", **kwargs)


def print_separator(title: str):
    """Imprime separador visual para tests."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def print_test(number: str, description: str, expected_status: Optional[int] = None):
    """Imprime header de test."""
    status_text = f" (esperado: {expected_status})" if expected_status else ""
    print(f"\n[TEST {number}] {description}{status_text}")
    print("-" * 80)


def check_status(actual: int, expected: int, test_name: str) -> bool:
    """
    Verifica que el status code sea el esperado.
    
    Args:
        actual: Status code obtenido
        expected: Status code esperado
        test_name: Nombre del test
        
    Returns:
        True si coinciden
    """
    if actual == expected:
        print(f"  [OK] {test_name}: {actual}")
        return True
    else:
        print(f"  [FAIL] {test_name}: esperado {expected}, obtuvo {actual}")
        return False


def result(passed: bool, msg: str = "") -> Tuple[int, int]:
    """
    Imprime resultado de test y retorna contadores.
    
    Args:
        passed: Si el test pasó
        msg: Mensaje adicional
        
    Returns:
        (passed_count, failed_count)
    """
    if passed:
        print(f"  [OK] PASS {msg}")
        return 1, 0
    else:
        print(f"  [FAIL] FAIL {msg}")
        return 0, 1


class TestCounter:
    """Contador de tests para reportes."""
    def __init__(self):
        self.passed = 0
        self.failed = 0
    
    def add_result(self, passed: bool):
        """Agrega resultado de un test."""
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def print_summary(self, phase_name: str = ""):
        """Imprime resumen de resultados."""
        print("\n" + "="*80)
        print(f"RESUMEN {phase_name}")
        print("="*80)
        print(f"Passed: {self.passed}/{self.passed + self.failed}")
        print(f"Failed: {self.failed}/{self.passed + self.failed}")
        print("="*80)
    
    @property
    def total(self) -> int:
        """Total de tests ejecutados."""
        return self.passed + self.failed
    
    @property
    def success_rate(self) -> float:
        """Porcentaje de éxito."""
        if self.total == 0:
            return 0.0
        return (self.passed / self.total) * 100


# Fixtures de datos de prueba
SAMPLE_USERS = {
    "admin": {
        "id": TEST_ADMIN_ID,
        "usuario": TEST_ADMIN_USER,
        "nombre": "Admin",
        "paterno": "RBAC",
        "materno": "Test"
    },
    "medico": {
        "id": TEST_REGULAR_USER_ID,
        "usuario": TEST_REGULAR_USER,
        "nombre": "Doctor",
        "paterno": "Test",
        "materno": "Medico"
    }
}

# IDs de roles conocidos
ROLES = {
    "MEDICOS": 1,
    "RECEPCION": 2,
    "ESPECIALISTAS": 3,
    "ADMINISTRADOR": 22
}

# Estados de usuario
USER_STATUS = {
    "ACTIVO": "A",
    "BAJA": "B",  # Soft delete / desactivado
    "INACTIVO": "I"
}

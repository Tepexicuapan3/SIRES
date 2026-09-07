"""
Utilidades compartidas para generar passwords temporales de usuarios.

Compartido por:
- `CreateUserUseCase.execute` (alta de usuario,
  `apps.administracion.use_cases.users.create_user`), que la usa para la
  password inicial enviada (o no) por correo.
- `UserResetPasswordView` (reset administrativo de contraseña sin depender
  de correo, `apps.administracion.views.rbac_views`).

Vive en su propio modulo (en vez de duplicarse o quedar privada de
`create_user.py`) justamente para que ambos casos de uso reusen la MISMA
politica de generacion (longitud, alfabeto, mezcla de mayuscula/minuscula/
digito/simbolo) sin arrastrar el resto de las dependencias de
`create_user.py` (modelos, email service, etc.).
"""

import secrets
import string

TEMP_PASSWORD_LENGTH = 12
TEMP_PASSWORD_SYMBOLS = "!@#$%^&*()-_=+[]{}"
TEMP_PASSWORD_ALPHABET = string.ascii_letters + string.digits + TEMP_PASSWORD_SYMBOLS


def generate_temporary_password(length=TEMP_PASSWORD_LENGTH):
    effective_length = max(length, 12)
    while True:
        candidate = "".join(
            secrets.choice(TEMP_PASSWORD_ALPHABET) for _ in range(effective_length)
        )
        if not any(char.islower() for char in candidate):
            continue
        if not any(char.isupper() for char in candidate):
            continue
        if not any(char.isdigit() for char in candidate):
            continue
        if not any(char in TEMP_PASSWORD_SYMBOLS for char in candidate):
            continue
        return candidate

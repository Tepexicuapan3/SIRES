"""
Create User Use Case - Lógica de negocio para crear usuarios

Responsabilidades:
- Validar que usuario y expediente sean únicos
- Generar password temporal seguro
- Crear usuario en estado "must_change_password"
- Asignar rol por defecto
- NO enviar email (eso es responsabilidad de una capa superior si se requiere)
"""

import secrets
import string
from typing import Dict, Optional, Tuple

from src.infrastructure.repositories.det_user_repository import \
    DetUserRepository
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.password_hasher import PasswordHasher


class CreateUserUseCase:
    """Use case para crear un nuevo usuario en el sistema"""

    def __init__(self):
        self.user_repo = UserRepository()
        self.det_user_repo = DetUserRepository()
        self.password_hasher = PasswordHasher()

    def _generate_temp_password(self, length: int = 12) -> str:
        """
        Genera una contraseña temporal segura.
        
        Formato: Al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 símbolo
        
        Args:
            length: Longitud de la contraseña (default 12)
            
        Returns:
            Password temporal
        """
        # Asegurar al menos un carácter de cada tipo
        chars = [
            secrets.choice(string.ascii_uppercase),
            secrets.choice(string.ascii_lowercase),
            secrets.choice(string.digits),
            secrets.choice("!@#$%&*")
        ]
        
        # Completar con caracteres aleatorios
        all_chars = string.ascii_letters + string.digits + "!@#$%&*"
        chars += [secrets.choice(all_chars) for _ in range(length - 4)]
        
        # Mezclar
        secrets.SystemRandom().shuffle(chars)
        return "".join(chars)

    def execute(
        self,
        usuario: str,
        expediente: str,
        nombre: str,
        paterno: str,
        materno: str,
        id_clin: Optional[int],
        correo: str,
        id_rol: int,
        created_by_user_id: int
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Crea un nuevo usuario en el sistema.
        
        Args:
            usuario: Nombre de usuario (3-20 chars)
            expediente: Número de expediente (8 dígitos)
            nombre: Nombre(s)
            paterno: Apellido paterno
            materno: Apellido materno
            id_clin: ID de la clínica (FK a cat_clinicas, puede ser NULL)
            correo: Email válido
            id_rol: ID del rol a asignar
            created_by_user_id: ID del admin que crea el usuario (auditoría)
            
        Returns:
            (result, error_code)
            - result: { id_usuario, usuario, temp_password, must_change_password }
            - error_code: "USUARIO_EXISTS" | "EXPEDIENTE_EXISTS" | "SERVER_ERROR"
        """
        
        # 1. Validar que el usuario no exista
        existing_user = self.user_repo.get_user_by_username(usuario)
        if existing_user:
            return None, "USUARIO_EXISTS"
        
        # 2. Validar que el expediente no exista
        existing_expediente = self.det_user_repo.get_user_by_expediente(expediente)
        if existing_expediente:
            return None, "EXPEDIENTE_EXISTS"
        
        # 3. Generar password temporal
        temp_password = self._generate_temp_password()
        hashed_password = self.password_hasher.hash_password(temp_password)
        
        # 4. Crear usuario en sy_usuarios
        try:
            user_id = self.user_repo.create_user(
                usuario=usuario,
                clave=hashed_password,
                nombre=nombre,
                paterno=paterno,
                materno=materno,
                expediente=expediente,
                id_clin=id_clin,
                correo=correo,
                created_by=created_by_user_id
            )
            
            if not user_id:
                return None, "USER_CREATION_FAILED"
            
            # 5. Crear registro en det_usuarios
            # Estado inicial: terminos_acept='F', cambiar_clave='T'
            # Nota: det_usuarios NO tiene campos de auditoría (la auditoría está en sy_usuarios)
            self.det_user_repo.create_det_user(
                id_usuario=user_id,
                must_change_password=True
            )
            
            # 6. Asignar rol (is_primary=1 porque es el primer rol)
            self.user_repo.assign_role_to_user(
                user_id=user_id,
                role_id=id_rol,
                is_primary=True,
                created_by=created_by_user_id
            )
            
            return {
                "id_usuario": user_id,
                "usuario": usuario,
                "expediente": expediente,
                "temp_password": temp_password,  # IMPORTANTE: solo en response inicial
                "must_change_password": True,
                "rol_asignado": id_rol
            }, None
        
        except Exception as e:
            print(f"Error creating user: {e}")
            return None, "SERVER_ERROR"

from __future__ import annotations

import getpass

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import Roles


class Command(BaseCommand):
    help = (
        "Bootstrap manual del primer usuario administrador. Pensado para "
        "correr UNA sola vez, a mano, en un servidor recien levantado sin "
        "seed automatico (RUN_SEED_ON_BOOT/RUN_E2E_SEED_ON_BOOT en false). "
        "No es idempotente a proposito: si el usuario ya existe, se detiene "
        "sin tocar nada, para no pisar una cuenta real por error."
    )

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument(
            "--password",
            default=None,
            help="Si se omite, se pide por prompt oculto (no queda en el historial de la shell).",
        )
        parser.add_argument("--nombre", required=True)
        parser.add_argument("--paterno", required=True)
        parser.add_argument("--materno", default="")
        parser.add_argument(
            "--role-code",
            default="ADMIN",
            help="Codigo del rol admin a asegurar/usar (default: ADMIN).",
        )

    def handle(self, *args, **options):
        username = options["username"].strip()
        email = options["email"].strip()
        nombre = options["nombre"].strip()
        paterno = options["paterno"].strip()
        materno = options["materno"].strip()
        role_code = options["role_code"].strip()

        if SyUsuario.objects.filter(usuario=username).exists():
            raise CommandError(
                f"Ya existe un usuario con username '{username}'. "
                "Este comando no sobrescribe cuentas existentes."
            )
        if SyUsuario.objects.filter(correo=email).exists():
            raise CommandError(
                f"Ya existe un usuario con correo '{email}'. "
                "Este comando no sobrescribe cuentas existentes."
            )

        password = options["password"]
        if not password:
            password = getpass.getpass("Contrasena para el nuevo admin: ")
            password_confirm = getpass.getpass("Repeti la contrasena: ")
            if password != password_confirm:
                raise CommandError("Las contrasenas no coinciden.")
        if len(password) < 8:
            raise CommandError("La contrasena debe tener al menos 8 caracteres.")

        with transaction.atomic():
            role, role_created = Roles.objects.get_or_create(
                rol=role_code,
                defaults={
                    "desc_rol": "Administrador",
                    "landing_route": "/admin/roles",
                    "is_admin": True,
                    "es_sistema": True,
                    "is_active": True,
                },
            )
            if not role_created and not role.is_admin:
                raise CommandError(
                    f"El rol '{role_code}' ya existe pero is_admin=False -- "
                    "revisalo a mano antes de usarlo como rol admin."
                )

            user = SyUsuario.objects.create(
                usuario=username,
                correo=email,
                clave_hash=make_password(password),
                est_activo=True,
                est_bloqueado=False,
                cambiar_clave=False,
                terminos_acept=True,
                fch_terminos=timezone.now(),
            )
            DetUsuario.objects.create(
                id_usuario=user,
                nombre=nombre,
                paterno=paterno,
                materno=materno,
            )
            RelUsuarioRol.objects.create(
                id_usuario=user,
                id_rol=role,
                is_primary=True,
                usr_asignacion=user,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Admin creado: username='{username}' rol='{role_code}' "
                f"(rol {'creado' if role_created else 'ya existia'})."
            )
        )

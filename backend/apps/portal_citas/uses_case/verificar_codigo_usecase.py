"""
apps/portal_citas/uses_case/verificar_codigo_usecase.py
===========================================================
Tercer paso: re-resuelve identidad, valida el OTP más reciente no usado y
no expirado del miembro dentro de una transacción con select_for_update()
(evita doble uso concurrente), y si coincide abre PortalSesion + emite el
token Bearer.
"""

from django.db import transaction
from django.utils import timezone

from apps.portal_citas.errors import PortalAuthError
from apps.portal_citas.models import PortalMiembro, PortalOTP, PortalSesion
from apps.portal_citas.services.identity_service import resolve_identity
from apps.portal_citas.services.otp_service import OTP_MAX_ATTEMPTS, verify_code
from apps.portal_citas.services.token_service import (
    PORTAL_SESSION_LIFETIME,
    issue_portal_access_token,
)


def verificar_codigo(no_exp, nombre_completo, fecha_nacimiento, codigo, ip_origen=None):
    identidad = resolve_identity(no_exp, nombre_completo, fecha_nacimiento)
    if identidad is None:
        raise PortalAuthError(
            "IDENTIDAD_NO_ENCONTRADA",
            "No pudimos verificar tus datos. Revisa tu número de expediente, "
            "nombre completo y fecha de nacimiento.",
            401,
        )

    if identidad.es_menor_de_edad:
        raise PortalAuthError(
            "MENOR_DE_EDAD",
            "Un menor de edad no puede iniciar sesión por su cuenta; debe "
            "gestionarlo un adulto del núcleo familiar.",
            403,
        )

    try:
        miembro = PortalMiembro.objects.get(
            no_exp=identidad.no_exp, pk_num=identidad.pk_num
        )
    except PortalMiembro.DoesNotExist:
        raise PortalAuthError("CODIGO_INVALIDO", "Código inválido o expirado.", 400)

    with transaction.atomic():
        otp = (
            PortalOTP.objects
            .select_for_update()
            .filter(portal_miembro=miembro, usado=False, expira_en__gt=timezone.now())
            .order_by("-creado_en")
            .first()
        )
        if otp is None:
            raise PortalAuthError(
                "CODIGO_INVALIDO",
                "Código inválido o expirado. Solicita uno nuevo.",
                400,
            )

        if not verify_code(codigo, otp.codigo_hash):
            otp.intentos += 1
            if otp.intentos >= OTP_MAX_ATTEMPTS:
                # Invalida el OTP para forzar pedir uno nuevo.
                otp.usado = True
            otp.save(update_fields=["intentos", "usado"])
            raise PortalAuthError("CODIGO_INVALIDO", "Código incorrecto.", 400)

        otp.usado = True
        otp.save(update_fields=["usado"])

        campos_miembro = []
        if not miembro.correo_verificado:
            miembro.correo_verificado = True
            campos_miembro.append("correo_verificado")
        if campos_miembro:
            miembro.save(update_fields=[*campos_miembro, "updated_at"])

        sesion = PortalSesion.objects.create(
            portal_miembro=miembro,
            expira_en=timezone.now() + PORTAL_SESSION_LIFETIME,
            ip_origen=ip_origen,
        )

    token = issue_portal_access_token(sesion)
    return {"accessToken": token, "expiraEn": sesion.expira_en}

import secrets
import string
import uuid
from datetime import datetime, time, timezone as dt_timezone

from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.models import (
    AuditoriaEvento,
    RelRolPermiso,
    RelUsuarioOverride,
    RelUsuarioRol,
)
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.email_service import send_user_credentials_email
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.catalogos.models import CatCentroAtencion, Permisos, Roles


TEMP_PASSWORD_LENGTH = 12
TEMP_PASSWORD_SYMBOLS = "!@#$%^&*()-_=+[]{}"
TEMP_PASSWORD_ALPHABET = string.ascii_letters + string.digits + TEMP_PASSWORD_SYMBOLS


def _request_id(request):
    return get_request_id(request) or str(uuid.uuid4())


def _to_utc_iso(value):
    if not value:
        return None
    return value.astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_expires_at_end_of_day(raw_value):
    if not raw_value:
        return None

    parsed_datetime = parse_datetime(raw_value)
    tz = timezone.get_current_timezone()

    if parsed_datetime:
        base = parsed_datetime
    else:
        parsed_date = parse_date(raw_value)
        if not parsed_date:
            return "invalid"
        base = datetime.combine(parsed_date, time.min)

    if timezone.is_naive(base):
        base = timezone.make_aware(base, tz)

    localized = timezone.localtime(base, tz)
    return localized.replace(hour=23, minute=59, second=59, microsecond=999999)


def _generate_temporary_password(length=TEMP_PASSWORD_LENGTH):
    effective_length = max(length, 12)
    while True:
        candidate = "".join(secrets.choice(TEMP_PASSWORD_ALPHABET) for _ in range(effective_length))
        if not any(char.islower() for char in candidate):
            continue
        if not any(char.isupper() for char in candidate):
            continue
        if not any(char.isdigit() for char in candidate):
            continue
        if not any(char in TEMP_PASSWORD_SYMBOLS for char in candidate):
            continue
        return candidate


def _parse_bool(raw_value):
    if raw_value is None:
        return None
    normalized = str(raw_value).strip().lower()
    if normalized in {"true", "1"}:
        return True
    if normalized in {"false", "0"}:
        return False
    return "invalid"


def _parse_pagination(request):
    raw_page = request.query_params.get("page", "1")
    raw_page_size = request.query_params.get("pageSize", "20")

    try:
        page = int(raw_page)
        page_size = int(raw_page_size)
    except (TypeError, ValueError):
        return None, None, error_response(
            "INVALID_FORMAT",
            "Parametros de paginacion invalidos",
            status.HTTP_400_BAD_REQUEST,
            details={"page": ["Debe ser un entero"], "pageSize": ["Debe ser un entero"]},
            request_id=_request_id(request),
        )

    if page < 1 or page_size < 1 or page_size > 100:
        return None, None, error_response(
            "VALIDATION_ERROR",
            "Parametros de paginacion fuera de rango",
            status.HTTP_400_BAD_REQUEST,
            details={
                "page": ["Debe ser mayor o igual a 1"],
                "pageSize": ["Debe estar entre 1 y 100"],
            },
            request_id=_request_id(request),
        )

    return page, page_size, None


def _user_name(user):
    if not user:
        return ""
    profile = getattr(user, "detalle", None)
    if profile and profile.nombre_completo:
        return profile.nombre_completo
    return user.usuario or ""


def _user_ref_by_id(user_id, fallback_system=False):
    if not user_id:
        if fallback_system:
            return {"id": 0, "name": "Sistema"}
        return None

    user = UserRepository.get_by_id(user_id)
    if not user:
        if fallback_system:
            return {"id": 0, "name": "Sistema"}
        return None

    return {"id": user.id_usuario, "name": _user_name(user)}


def _clinic_ref(detalle):
    if not detalle or not detalle.id_centro_atencion:
        return None
    center = detalle.id_centro_atencion
    return {"id": center.id, "name": center.name}


def _serialize_permission(permission):
    return {
        "id": permission.id_permiso,
        "code": permission.codigo,
        "description": permission.descripcion,
        "isSystem": bool(permission.es_sistema),
    }


def _role_permissions(role):
    relations = (
        RelRolPermiso.objects.select_related("id_permiso", "usr_asignacion")
        .filter(id_rol=role, fch_baja__isnull=True, id_permiso__is_active=True)
        .order_by("id_permiso__codigo")
    )
    items = []
    for relation in relations:
        items.append(
            {
                "id": relation.id_permiso.id_permiso,
                "code": relation.id_permiso.codigo,
                "description": relation.id_permiso.descripcion,
                "assignedAt": _to_utc_iso(relation.fch_asignacion),
                "assignedBy": _user_ref_by_id(relation.usr_asignacion_id, fallback_system=True),
            }
        )
    return items


def _role_counts(role):
    permissions_count = RelRolPermiso.objects.filter(
        id_rol=role,
        fch_baja__isnull=True,
        id_permiso__is_active=True,
    ).count()
    users_count = RelUsuarioRol.objects.filter(
        id_rol=role,
        fch_baja__isnull=True,
        id_usuario__est_activo=True,
    ).count()
    return permissions_count, users_count


def _serialize_role(role):
    permissions_count, users_count = _role_counts(role)
    return {
        "id": role.id_rol,
        "name": role.rol,
        "description": role.desc_rol,
        "isActive": bool(role.is_active),
        "isSystem": bool(role.es_sistema),
        "landingRoute": role.landing_route,
        "permissionsCount": permissions_count,
        "usersCount": users_count,
        "createdAt": _to_utc_iso(role.created_at),
        "createdBy": _user_ref_by_id(role.created_by_id, fallback_system=True),
        "updatedAt": _to_utc_iso(role.updated_at),
        "updatedBy": _user_ref_by_id(role.updated_by_id),
    }


def _active_user_role_relations(user):
    return (
        RelUsuarioRol.objects.select_related("id_rol", "usr_asignacion")
        .filter(id_usuario=user, fch_baja__isnull=True, id_rol__is_active=True)
        .order_by("id_usuario_rol")
    )


def _serialize_user_roles(user):
    roles = []
    for relation in _active_user_role_relations(user):
        role = relation.id_rol
        roles.append(
            {
                "id": role.id_rol,
                "name": role.rol,
                "description": role.desc_rol,
                "isPrimary": bool(relation.is_primary),
                "assignedAt": _to_utc_iso(relation.fch_asignacion),
                "assignedBy": _user_ref_by_id(relation.usr_asignacion_id, fallback_system=True),
            }
        )
    return roles


def _serialize_user_overrides(user):
    now = timezone.now()
    overrides = (
        RelUsuarioOverride.objects.select_related("id_permiso", "usr_asignacion")
        .filter(id_usuario=user, fch_baja__isnull=True)
        .order_by("id_override")
    )
    items = []
    for override in overrides:
        is_expired = bool(override.fch_expira and override.fch_expira <= now)
        items.append(
            {
                "id": override.id_override,
                "permissionCode": override.id_permiso.codigo,
                "permissionDescription": override.id_permiso.descripcion,
                "effect": override.efecto,
                "expiresAt": _to_utc_iso(override.fch_expira),
                "isExpired": is_expired,
                "assignedAt": _to_utc_iso(override.fch_asignacion),
                "assignedBy": _user_ref_by_id(override.usr_asignacion_id, fallback_system=True),
            }
        )
    return items


def _serialize_user_list_item(user):
    detail = getattr(user, "detalle", None)
    roles = _active_user_role_relations(user)
    primary = next((relation for relation in roles if relation.is_primary), None)
    if not primary:
        primary = roles[0] if roles else None

    full_name = ""
    if detail and detail.nombre_completo:
        full_name = detail.nombre_completo

    return {
        "id": user.id_usuario,
        "username": user.usuario,
        "fullname": full_name,
        "fullName": full_name,
        "email": user.correo,
        "clinic": _clinic_ref(detail),
        "primaryRole": primary.id_rol.rol if primary else "",
        "isActive": bool(user.est_activo),
        "termsAccepted": bool(user.terminos_acept),
        "mustChangePassword": bool(user.cambiar_clave),
    }


def _serialize_user_detail(user):
    detail = getattr(user, "detalle", None)
    base = _serialize_user_list_item(user)
    return {
        **base,
        "firstName": detail.nombre if detail else "",
        "paternalName": detail.paterno if detail else "",
        "maternalName": detail.materno if detail and detail.materno else "",
        "termsAccepted": bool(user.terminos_acept),
        "mustChangePassword": bool(user.cambiar_clave),
        "lastLoginAt": _to_utc_iso(user.last_conexion),
        "lastIp": user.ip_ultima,
        "createdAt": _to_utc_iso(user.fch_alta),
        "createdBy": _user_ref_by_id(user.usr_alta_id, fallback_system=True),
        "updatedAt": _to_utc_iso(user.fch_modf),
        "updatedBy": _user_ref_by_id(user.usr_modf_id),
    }


def _split_permission_code(code):
    parts = code.split(":")
    if len(parts) < 2:
        return None, None
    return ":".join(parts[:-1]), parts[-1]


def _ensure_read_dependencies(permission_ids):
    permissions = {
        permission.id_permiso: permission
        for permission in Permisos.objects.filter(id_permiso__in=permission_ids, is_active=True)
    }
    expanded = set(permission_ids)

    by_code = {permission.codigo: permission for permission in permissions.values()}

    for permission in list(permissions.values()):
        resource, action = _split_permission_code(permission.codigo)
        if action in {"create", "update", "delete"} and resource:
            read_code = f"{resource}:read"
            read_permission = by_code.get(read_code)
            if read_permission:
                expanded.add(read_permission.id_permiso)

    return expanded


def _authorize(request, permission_code=None, require_csrf=False):
    request_id = _request_id(request)
    try:
        user = authenticate_request(request)
    except AuthServiceError as exc:
        return None, error_response(
            exc.code,
            exc.message,
            exc.status_code,
            details=exc.details,
            request_id=request_id,
        )

    request.user = user

    if permission_code:
        permissions = UserRepository.build_auth_user(user).get("permissions", [])
        if "*" not in permissions and permission_code not in permissions:
            return user, error_response(
                "PERMISSION_DENIED",
                "No tienes permiso para esta accion",
                status.HTTP_403_FORBIDDEN,
                request_id=request_id,
            )

    if require_csrf and not validate_csrf(request):
        return user, error_response(
            "PERMISSION_DENIED",
            "No tienes permiso para esta accion",
            status.HTTP_403_FORBIDDEN,
            request_id=request_id,
        )

    return user, None


def _audit(
    request,
    action,
    resource_type,
    resource_id=None,
    result="SUCCESS",
    error_code=None,
    before=None,
    after=None,
    target_user=None,
):
    actor = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
    try:
        AuditoriaEvento.objects.create(
            request_id=_request_id(request),
            accion=action,
            recurso_tipo=resource_type,
            recurso_id=resource_id,
            actor_usuario=actor,
            actor_nombre=_user_name(actor) if actor else "Sistema",
            target_usuario=target_user,
            target_nombre=_user_name(target_user) if target_user else None,
            resultado=result,
            codigo_error=error_code,
            ip_origen=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
            datos_antes=before,
            datos_despues=after,
            meta={"module": "rbac", "endpoint": request.path, "method": request.method},
        )
    except Exception:
        return


class RolesListCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        user, auth_error = _authorize(request, "admin:gestion:roles:read")
        if auth_error:
            _audit(request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        page, page_size, pagination_error = _parse_pagination(request)
        if pagination_error:
            _audit(request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return pagination_error

        queryset = Roles.objects.all()

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(rol__icontains=search) | Q(desc_rol__icontains=search))

        is_active_raw = _parse_bool(request.query_params.get("isActive"))
        if is_active_raw == "invalid":
            _audit(request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Parametro isActive invalido",
                status.HTTP_400_BAD_REQUEST,
                details={"isActive": ["Debe ser true o false"]},
                request_id=_request_id(request),
            )
        if is_active_raw is not None:
            queryset = queryset.filter(is_active=is_active_raw)

        is_system_raw = _parse_bool(request.query_params.get("isSystem"))
        if is_system_raw == "invalid":
            _audit(request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Parametro isSystem invalido",
                status.HTTP_400_BAD_REQUEST,
                details={"isSystem": ["Debe ser true o false"]},
                request_id=_request_id(request),
            )
        if is_system_raw is not None:
            queryset = queryset.filter(es_sistema=is_system_raw)

        sort_by = request.query_params.get("sortBy", "name")
        sort_order = request.query_params.get("sortOrder", "asc")
        sort_map = {
            "name": "rol",
            "description": "desc_rol",
            "isActive": "is_active",
            "isSystem": "es_sistema",
        }
        if sort_by not in sort_map:
            _audit(request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Parametro sortBy invalido",
                status.HTTP_400_BAD_REQUEST,
                details={"sortBy": ["Campo invalido"]},
                request_id=_request_id(request),
            )
        if sort_order not in {"asc", "desc"}:
            _audit(request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Parametro sortOrder invalido",
                status.HTTP_400_BAD_REQUEST,
                details={"sortOrder": ["Debe ser asc o desc"]},
                request_id=_request_id(request),
            )

        order_field = sort_map[sort_by]
        if sort_order == "desc":
            order_field = f"-{order_field}"
        queryset = queryset.order_by(order_field)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size

        items = [_serialize_role(role) for role in queryset[start:end]]
        payload = {
            "items": items,
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": (total + page_size - 1) // page_size,
        }
        _audit(request, "RBAC_ROLE_LIST", "role", result="SUCCESS")
        return Response(payload, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request):
        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:create",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_ROLE_CREATE", "role", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        name = request.data.get("name")
        description = request.data.get("description")
        landing_route = request.data.get("landingRoute")

        if not name or not description:
            _audit(request, "RBAC_ROLE_CREATE", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={
                    "name": ["Campo requerido"] if not name else [],
                    "description": ["Campo requerido"] if not description else [],
                },
                request_id=_request_id(request),
            )

        if Roles.objects.filter(rol=name).exists():
            _audit(request, "RBAC_ROLE_CREATE", "role", result="FAIL", error_code="ROLE_EXISTS")
            return error_response(
                "ROLE_EXISTS",
                "El rol ya existe",
                status.HTTP_409_CONFLICT,
                request_id=_request_id(request),
            )

        role = Roles.objects.create(
            rol=name,
            desc_rol=description,
            landing_route=landing_route,
            is_active=True,
            created_by_id=user.id_usuario,
        )

        _audit(
            request,
            "RBAC_ROLE_CREATE",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            after={"name": role.rol, "description": role.desc_rol},
        )
        return Response({"id": role.id_rol, "name": role.rol}, status=status.HTTP_201_CREATED)


class RoleDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def _get_role(self, role_id):
        return Roles.objects.filter(id_rol=role_id).first()

    def get(self, request, role_id):
        _, auth_error = _authorize(request, "admin:gestion:roles:read")
        if auth_error:
            _audit(request, "RBAC_ROLE_DETAIL", "role", resource_id=role_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        role = self._get_role(role_id)
        if not role:
            _audit(request, "RBAC_ROLE_DETAIL", "role", resource_id=role_id, result="FAIL", error_code="ROLE_NOT_FOUND")
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        payload = {
            "role": _serialize_role(role),
            "permissions": _role_permissions(role),
        }
        _audit(request, "RBAC_ROLE_DETAIL", "role", resource_id=role.id_rol, result="SUCCESS")
        return Response(payload, status=status.HTTP_200_OK)

    @transaction.atomic
    def put(self, request, role_id):
        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_ROLE_UPDATE", "role", resource_id=role_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        role = self._get_role(role_id)
        if not role:
            _audit(request, "RBAC_ROLE_UPDATE", "role", resource_id=role_id, result="FAIL", error_code="ROLE_NOT_FOUND")
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        if role.es_sistema:
            _audit(request, "RBAC_ROLE_UPDATE", "role", resource_id=role.id_rol, result="FAIL", error_code="ROLE_SYSTEM_PROTECTED")
            return error_response(
                "ROLE_SYSTEM_PROTECTED",
                "El rol de sistema no puede modificarse",
                status.HTTP_403_FORBIDDEN,
                request_id=_request_id(request),
            )

        before = _serialize_role(role)

        name = request.data.get("name")
        if name and Roles.objects.filter(rol=name).exclude(id_rol=role.id_rol).exists():
            _audit(request, "RBAC_ROLE_UPDATE", "role", resource_id=role.id_rol, result="FAIL", error_code="ROLE_EXISTS")
            return error_response(
                "ROLE_EXISTS",
                "El rol ya existe",
                status.HTTP_409_CONFLICT,
                request_id=_request_id(request),
            )

        if "name" in request.data:
            role.rol = name
        if "description" in request.data:
            role.desc_rol = request.data.get("description")
        if "landingRoute" in request.data:
            role.landing_route = request.data.get("landingRoute")
        if "isActive" in request.data:
            role.is_active = bool(request.data.get("isActive"))

        role.updated_at = timezone.now()
        role.updated_by_id = user.id_usuario
        role.save()

        _audit(
            request,
            "RBAC_ROLE_UPDATE",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            before=before,
            after=_serialize_role(role),
        )
        return Response({"role": _serialize_role(role)}, status=status.HTTP_200_OK)

    @transaction.atomic
    def delete(self, request, role_id):
        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:delete",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_ROLE_DELETE", "role", resource_id=role_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        role = self._get_role(role_id)
        if not role:
            _audit(request, "RBAC_ROLE_DELETE", "role", resource_id=role_id, result="FAIL", error_code="ROLE_NOT_FOUND")
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        if role.es_sistema:
            _audit(request, "RBAC_ROLE_DELETE", "role", resource_id=role.id_rol, result="FAIL", error_code="CANNOT_DELETE_SYSTEM_ROLE")
            return error_response(
                "CANNOT_DELETE_SYSTEM_ROLE",
                "No se puede eliminar un rol de sistema",
                status.HTTP_400_BAD_REQUEST,
                request_id=_request_id(request),
            )

        if RelUsuarioRol.objects.filter(id_rol=role, fch_baja__isnull=True, id_usuario__est_activo=True).exists():
            _audit(request, "RBAC_ROLE_DELETE", "role", resource_id=role.id_rol, result="FAIL", error_code="ROLE_HAS_USERS")
            return error_response(
                "ROLE_HAS_USERS",
                "El rol tiene usuarios activos asignados",
                status.HTTP_400_BAD_REQUEST,
                request_id=_request_id(request),
            )

        before = _serialize_role(role)
        role.is_active = False
        role.deleted_at = timezone.now()
        role.deleted_by_id = user.id_usuario
        role.save(update_fields=["is_active", "deleted_at", "deleted_by_id"])

        _audit(
            request,
            "RBAC_ROLE_DELETE",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            before=before,
            after={"isActive": False},
        )
        return Response({"success": True}, status=status.HTTP_200_OK)


class PermissionsCatalogView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        _, auth_error = _authorize(request, "admin:gestion:permisos:read")
        if auth_error:
            _audit(request, "RBAC_PERMISSION_LIST", "permission", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        permissions = [
            _serialize_permission(permission)
            for permission in Permisos.objects.filter(is_active=True).order_by("codigo")
        ]
        payload = {"items": permissions, "total": len(permissions)}
        _audit(request, "RBAC_PERMISSION_LIST", "permission", result="SUCCESS")
        return Response(payload, status=status.HTTP_200_OK)


class AssignRolePermissionsView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def post(self, request):
        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_ROLE_PERMISSIONS_ASSIGN", "role", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        role_id = request.data.get("roleId")
        if role_id is None:
            role_id = request.data.get("role_id")

        permission_ids = request.data.get("permissionIds")
        if permission_ids is None:
            permission_ids = request.data.get("permission_ids", [])

        if role_id is None or not isinstance(permission_ids, list):
            _audit(request, "RBAC_ROLE_PERMISSIONS_ASSIGN", "role", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={"roleId": ["Campo requerido"], "permissionIds": ["Debe ser un arreglo"]},
                request_id=_request_id(request),
            )

        role = Roles.objects.filter(id_rol=role_id).first()
        if not role:
            _audit(request, "RBAC_ROLE_PERMISSIONS_ASSIGN", "role", resource_id=role_id, result="FAIL", error_code="ROLE_NOT_FOUND")
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        requested_ids = set(permission_ids)
        requested_ids = _ensure_read_dependencies(requested_ids)

        permissions = {
            permission.id_permiso: permission
            for permission in Permisos.objects.filter(id_permiso__in=requested_ids, is_active=True)
        }
        missing_ids = sorted(requested_ids - set(permissions.keys()))
        if missing_ids:
            _audit(request, "RBAC_ROLE_PERMISSIONS_ASSIGN", "role", resource_id=role.id_rol, result="FAIL", error_code="PERMISSION_NOT_FOUND")
            return error_response(
                "PERMISSION_NOT_FOUND",
                "Permiso no encontrado",
                status.HTTP_404_NOT_FOUND,
                details={"permissionIds": [f"No existen: {', '.join(str(value) for value in missing_ids)}"]},
                request_id=_request_id(request),
            )

        before = _role_permissions(role)
        relations = {
            relation.id_permiso_id: relation
            for relation in RelRolPermiso.objects.filter(id_rol=role)
        }

        for permission_id in requested_ids:
            relation = relations.get(permission_id)
            if relation:
                if relation.fch_baja is not None:
                    relation.fch_baja = None
                    relation.usr_baja = None
                    relation.save(update_fields=["fch_baja", "usr_baja"])
                continue

            RelRolPermiso.objects.create(
                id_rol=role,
                id_permiso=permissions[permission_id],
                usr_asignacion=user,
            )

        for permission_id, relation in relations.items():
            if permission_id in requested_ids:
                continue
            if relation.fch_baja is None:
                relation.fch_baja = timezone.now()
                relation.usr_baja = user
                relation.save(update_fields=["fch_baja", "usr_baja"])

        payload = {"roleId": role.id_rol, "permissions": _role_permissions(role)}
        _audit(
            request,
            "RBAC_ROLE_PERMISSIONS_ASSIGN",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            before=before,
            after=payload,
        )
        return Response(payload, status=status.HTTP_200_OK)


class RevokeRolePermissionView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def delete(self, request, role_id, permission_id):
        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_ROLE_PERMISSION_REVOKE", "role", resource_id=role_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        role = Roles.objects.filter(id_rol=role_id).first()
        if not role:
            _audit(request, "RBAC_ROLE_PERMISSION_REVOKE", "role", resource_id=role_id, result="FAIL", error_code="ROLE_NOT_FOUND")
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        relation = RelRolPermiso.objects.select_related("id_permiso").filter(
            id_rol=role,
            id_permiso_id=permission_id,
            fch_baja__isnull=True,
        ).first()
        if not relation:
            _audit(request, "RBAC_ROLE_PERMISSION_REVOKE", "role", resource_id=role.id_rol, result="FAIL", error_code="PERMISSION_NOT_FOUND")
            return error_response(
                "PERMISSION_NOT_FOUND",
                "Permiso no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        code = relation.id_permiso.codigo
        resource, action = _split_permission_code(code)
        if action == "read" and resource:
            active_relations = RelRolPermiso.objects.select_related("id_permiso").filter(
                id_rol=role,
                fch_baja__isnull=True,
                id_permiso__is_active=True,
            )
            for active in active_relations:
                if active.id_permiso_id == relation.id_permiso_id:
                    continue
                active_resource, active_action = _split_permission_code(active.id_permiso.codigo)
                if active_resource == resource and active_action in {"create", "update", "delete"}:
                    _audit(request, "RBAC_ROLE_PERMISSION_REVOKE", "role", resource_id=role.id_rol, result="FAIL", error_code="PERMISSION_DEPENDENCY")
                    return error_response(
                        "PERMISSION_DEPENDENCY",
                        "Violacion de dependencia de permisos",
                        status.HTTP_400_BAD_REQUEST,
                        request_id=_request_id(request),
                    )

        before = _role_permissions(role)
        relation.fch_baja = timezone.now()
        relation.usr_baja = user
        relation.save(update_fields=["fch_baja", "usr_baja"])
        payload = {"roleId": role.id_rol, "permissions": _role_permissions(role)}

        _audit(
            request,
            "RBAC_ROLE_PERMISSION_REVOKE",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            before=before,
            after=payload,
        )
        return Response(payload, status=status.HTTP_200_OK)


class UsersListCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        _, auth_error = _authorize(request, "admin:gestion:usuarios:read")
        if auth_error:
            _audit(request, "RBAC_USER_LIST", "user", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        page, page_size, pagination_error = _parse_pagination(request)
        if pagination_error:
            _audit(request, "RBAC_USER_LIST", "user", result="FAIL", error_code="VALIDATION_ERROR")
            return pagination_error

        queryset = SyUsuario.objects.select_related("detalle", "detalle__id_centro_atencion").all()

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(usuario__icontains=search)
                | Q(correo__icontains=search)
                | Q(detalle__nombre_completo__icontains=search)
            )

        is_active_raw = _parse_bool(request.query_params.get("isActive"))
        if is_active_raw == "invalid":
            _audit(request, "RBAC_USER_LIST", "user", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Parametro isActive invalido",
                status.HTTP_400_BAD_REQUEST,
                details={"isActive": ["Debe ser true o false"]},
                request_id=_request_id(request),
            )
        if is_active_raw is not None:
            queryset = queryset.filter(est_activo=is_active_raw)

        role_id = request.query_params.get("roleId")
        if role_id:
            queryset = queryset.filter(relusuariorol__id_rol_id=role_id, relusuariorol__fch_baja__isnull=True)

        clinic_id = request.query_params.get("clinicId")
        if clinic_id:
            queryset = queryset.filter(detalle__id_centro_atencion_id=clinic_id)

        status_filter = request.query_params.get("status")
        if status_filter == "active":
            queryset = queryset.filter(est_activo=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(est_activo=False)
        elif status_filter == "pending":
            queryset = queryset.filter(Q(terminos_acept=False) | Q(cambiar_clave=True))

        queryset = queryset.order_by("usuario").distinct()

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = [_serialize_user_list_item(user) for user in queryset[start:end]]
        payload = {
            "items": items,
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": (total + page_size - 1) // page_size,
        }
        _audit(request, "RBAC_USER_LIST", "user", result="SUCCESS")
        return Response(payload, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:create",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_CREATE", "user", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        required_fields = ["username", "firstName", "paternalName", "email", "primaryRoleId"]
        missing = [field for field in required_fields if not request.data.get(field)]
        if missing:
            _audit(request, "RBAC_USER_CREATE", "user", result="FAIL", error_code="VALIDATION_ERROR")
            return error_response(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={field: ["Campo requerido"] for field in missing},
                request_id=_request_id(request),
            )

        username = request.data.get("username")
        email = request.data.get("email")

        if SyUsuario.objects.filter(usuario=username).exists() or SyUsuario.objects.filter(correo=email).exists():
            _audit(request, "RBAC_USER_CREATE", "user", result="FAIL", error_code="USER_EXISTS")
            return error_response(
                "USER_EXISTS",
                "Ya existe un usuario con estos datos",
                status.HTTP_409_CONFLICT,
                request_id=_request_id(request),
            )

        role = Roles.objects.filter(id_rol=request.data.get("primaryRoleId"), is_active=True).first()
        if not role:
            _audit(request, "RBAC_USER_CREATE", "user", result="FAIL", error_code="ROLE_NOT_FOUND")
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        clinic = None
        clinic_id = request.data.get("clinicId")
        if clinic_id is not None:
            clinic = CatCentroAtencion.objects.filter(id=clinic_id, is_active=True).first()
            if not clinic:
                _audit(request, "RBAC_USER_CREATE", "user", result="FAIL", error_code="CLINIC_NOT_FOUND")
                return error_response(
                    "CLINIC_NOT_FOUND",
                    "Clinica no encontrada",
                    status.HTTP_404_NOT_FOUND,
                    request_id=_request_id(request),
                )

        temporary_password = _generate_temporary_password()
        user = SyUsuario.objects.create(
            usuario=username,
            correo=email,
            clave_hash=make_password(temporary_password),
            est_activo=True,
            est_bloqueado=False,
            cambiar_clave=True,
            terminos_acept=False,
            usr_alta=actor,
        )

        maternal_name = request.data.get("maternalName") or ""
        full_name = " ".join(
            part
            for part in [request.data.get("firstName"), request.data.get("paternalName"), maternal_name]
            if part
        ).strip()

        DetUsuario.objects.create(
            id_usuario=user,
            nombre=request.data.get("firstName"),
            paterno=request.data.get("paternalName"),
            materno=maternal_name,
            nombre_completo=full_name,
            id_centro_atencion=clinic,
        )

        RelUsuarioRol.objects.create(
            id_usuario=user,
            id_rol=role,
            is_primary=True,
            usr_asignacion=actor,
        )

        if not send_user_credentials_email(
            recipient_email=user.correo,
            username=user.usuario,
            temporary_password=temporary_password,
            user_name=full_name or user.usuario,
        ):
            transaction.set_rollback(True)
            _audit(
                request,
                "RBAC_USER_CREATE",
                "user",
                resource_id=user.id_usuario,
                result="FAIL",
                error_code="EMAIL_DELIVERY_FAILED",
                target_user=user,
            )
            return error_response(
                "EMAIL_DELIVERY_FAILED",
                "No se pudo enviar el correo de credenciales. El usuario no fue creado.",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=_request_id(request),
            )

        payload = {
            "id": user.id_usuario,
            "username": user.usuario,
        }
        _audit(
            request,
            "RBAC_USER_CREATE",
            "user",
            resource_id=user.id_usuario,
            result="SUCCESS",
            after={"username": user.usuario},
            target_user=user,
        )
        return Response(payload, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def _get_user(self, user_id):
        return SyUsuario.objects.select_related("detalle", "detalle__id_centro_atencion").filter(id_usuario=user_id).first()

    def get(self, request, user_id):
        _, auth_error = _authorize(request, "admin:gestion:usuarios:read")
        if auth_error:
            _audit(request, "RBAC_USER_DETAIL", "user", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = self._get_user(user_id)
        if not user:
            _audit(request, "RBAC_USER_DETAIL", "user", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        payload = {
            "user": _serialize_user_detail(user),
            "roles": _serialize_user_roles(user),
            "overrides": _serialize_user_overrides(user),
        }
        _audit(request, "RBAC_USER_DETAIL", "user", resource_id=user.id_usuario, result="SUCCESS", target_user=user)
        return Response(payload, status=status.HTTP_200_OK)

    @transaction.atomic
    def patch(self, request, user_id):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_UPDATE", "user", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = self._get_user(user_id)
        if not user:
            _audit(request, "RBAC_USER_UPDATE", "user", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        before = _serialize_user_detail(user)

        detail = getattr(user, "detalle", None)
        if not detail:
            detail = DetUsuario.objects.create(
                id_usuario=user,
                nombre="",
                paterno="",
                materno="",
                nombre_completo="",
            )

        if "email" in request.data:
            email = request.data.get("email")
            if SyUsuario.objects.filter(correo=email).exclude(id_usuario=user.id_usuario).exists():
                _audit(request, "RBAC_USER_UPDATE", "user", resource_id=user.id_usuario, result="FAIL", error_code="USER_EXISTS", target_user=user)
                return error_response(
                    "USER_EXISTS",
                    "Ya existe un usuario con estos datos",
                    status.HTTP_409_CONFLICT,
                    request_id=_request_id(request),
                )
            user.correo = email

        if "firstName" in request.data:
            detail.nombre = request.data.get("firstName") or ""
        if "paternalName" in request.data:
            detail.paterno = request.data.get("paternalName") or ""
        if "maternalName" in request.data:
            detail.materno = request.data.get("maternalName") or ""

        if "clinicId" in request.data:
            clinic_id = request.data.get("clinicId")
            if clinic_id is None:
                detail.id_centro_atencion = None
            else:
                clinic = CatCentroAtencion.objects.filter(id=clinic_id, is_active=True).first()
                if not clinic:
                    _audit(request, "RBAC_USER_UPDATE", "user", resource_id=user.id_usuario, result="FAIL", error_code="CLINIC_NOT_FOUND", target_user=user)
                    return error_response(
                        "CLINIC_NOT_FOUND",
                        "Clinica no encontrada",
                        status.HTTP_404_NOT_FOUND,
                        request_id=_request_id(request),
                    )
                detail.id_centro_atencion = clinic

        detail.nombre_completo = " ".join(
            part for part in [detail.nombre, detail.paterno, detail.materno or ""] if part
        ).strip()
        detail.save()

        user.fch_modf = timezone.now()
        user.usr_modf = actor
        user.save(update_fields=["correo", "fch_modf", "usr_modf"])

        payload = {"user": _serialize_user_detail(user)}
        _audit(
            request,
            "RBAC_USER_UPDATE",
            "user",
            resource_id=user.id_usuario,
            result="SUCCESS",
            before=before,
            after=payload,
            target_user=user,
        )
        return Response(payload, status=status.HTTP_200_OK)


class UserStatusView(APIView):
    authentication_classes = []
    permission_classes = []
    activate = True

    @transaction.atomic
    def patch(self, request, user_id):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        action = "RBAC_USER_ACTIVATE" if self.activate else "RBAC_USER_DEACTIVATE"
        if auth_error:
            _audit(request, action, "user", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            _audit(request, action, "user", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        if not self.activate and actor.id_usuario == user.id_usuario:
            _audit(
                request,
                action,
                "user",
                resource_id=user.id_usuario,
                result="FAIL",
                error_code="SELF_DEACTIVATION_NOT_ALLOWED",
                target_user=user,
            )
            return error_response(
                "SELF_DEACTIVATION_NOT_ALLOWED",
                "No puedes desactivar tu propia cuenta",
                status.HTTP_409_CONFLICT,
                request_id=_request_id(request),
            )

        user.est_activo = self.activate
        user.fch_modf = timezone.now()
        user.usr_modf = actor
        user.save(update_fields=["est_activo", "fch_modf", "usr_modf"])

        payload = {"id": user.id_usuario, "isActive": bool(user.est_activo)}
        _audit(request, action, "user", resource_id=user.id_usuario, result="SUCCESS", after=payload, target_user=user)
        return Response(payload, status=status.HTTP_200_OK)


class UserActivateView(UserStatusView):
    activate = True


class UserDeactivateView(UserStatusView):
    activate = False


class UserRolesView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def post(self, request, user_id):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_ROLES_ASSIGN", "user_role", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            _audit(request, "RBAC_USER_ROLES_ASSIGN", "user_role", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        role_ids = request.data.get("roleIds")
        if not isinstance(role_ids, list) or not role_ids:
            _audit(request, "RBAC_USER_ROLES_ASSIGN", "user_role", resource_id=user.id_usuario, result="FAIL", error_code="VALIDATION_ERROR", target_user=user)
            return error_response(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={"roleIds": ["Debe ser un arreglo no vacio"]},
                request_id=_request_id(request),
            )

        roles = {role.id_rol: role for role in Roles.objects.filter(id_rol__in=role_ids, is_active=True)}
        missing = sorted(set(role_ids) - set(roles.keys()))
        if missing:
            _audit(request, "RBAC_USER_ROLES_ASSIGN", "user_role", resource_id=user.id_usuario, result="FAIL", error_code="ROLE_NOT_FOUND", target_user=user)
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                details={"roleIds": [f"No existen: {', '.join(str(value) for value in missing)}"]},
                request_id=_request_id(request),
            )

        before = _serialize_user_roles(user)

        for role_id in role_ids:
            role = roles[role_id]
            relation = RelUsuarioRol.objects.filter(id_usuario=user, id_rol=role).first()
            if relation:
                if relation.fch_baja is not None:
                    relation.fch_baja = None
                    relation.usr_baja = None
                    relation.save(update_fields=["fch_baja", "usr_baja"])
                continue
            RelUsuarioRol.objects.create(
                id_usuario=user,
                id_rol=role,
                is_primary=False,
                usr_asignacion=actor,
            )

        has_primary = RelUsuarioRol.objects.filter(
            id_usuario=user,
            fch_baja__isnull=True,
            is_primary=True,
        ).exists()
        if not has_primary:
            first_relation = RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True).order_by("id_usuario_rol").first()
            if first_relation:
                first_relation.is_primary = True
                first_relation.save(update_fields=["is_primary"])

        payload = {"userId": user.id_usuario, "roles": _serialize_user_roles(user)}
        _audit(
            request,
            "RBAC_USER_ROLES_ASSIGN",
            "user_role",
            resource_id=user.id_usuario,
            result="SUCCESS",
            before=before,
            after=payload,
            target_user=user,
        )
        return Response(payload, status=status.HTTP_201_CREATED)


class UserPrimaryRoleView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def put(self, request, user_id):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_ROLE_PRIMARY_SET", "user_role", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            _audit(request, "RBAC_USER_ROLE_PRIMARY_SET", "user_role", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        role_id = request.data.get("roleId")
        if not role_id:
            _audit(request, "RBAC_USER_ROLE_PRIMARY_SET", "user_role", resource_id=user.id_usuario, result="FAIL", error_code="VALIDATION_ERROR", target_user=user)
            return error_response(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={"roleId": ["Campo requerido"]},
                request_id=_request_id(request),
            )

        relation = RelUsuarioRol.objects.filter(
            id_usuario=user,
            id_rol_id=role_id,
            fch_baja__isnull=True,
        ).first()
        if not relation:
            _audit(request, "RBAC_USER_ROLE_PRIMARY_SET", "user_role", resource_id=user.id_usuario, result="FAIL", error_code="ROLE_NOT_FOUND", target_user=user)
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        before = _serialize_user_roles(user)

        RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True).update(is_primary=False)
        relation.is_primary = True
        relation.save(update_fields=["is_primary"])

        user.fch_modf = timezone.now()
        user.usr_modf = actor
        user.save(update_fields=["fch_modf", "usr_modf"])

        payload = {"userId": user.id_usuario, "roles": _serialize_user_roles(user)}
        _audit(
            request,
            "RBAC_USER_ROLE_PRIMARY_SET",
            "user_role",
            resource_id=user.id_usuario,
            result="SUCCESS",
            before=before,
            after=payload,
            target_user=user,
        )
        return Response(payload, status=status.HTTP_200_OK)


class UserRoleRevokeView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def delete(self, request, user_id, role_id):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_ROLE_REVOKE", "user_role", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            _audit(request, "RBAC_USER_ROLE_REVOKE", "user_role", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        relation = RelUsuarioRol.objects.select_related("id_rol").filter(
            id_usuario=user,
            id_rol_id=role_id,
            fch_baja__isnull=True,
        ).first()
        if not relation:
            _audit(request, "RBAC_USER_ROLE_REVOKE", "user_role", resource_id=user.id_usuario, result="FAIL", error_code="ROLE_NOT_FOUND", target_user=user)
            return error_response(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        active_count = RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True).count()
        if active_count <= 1:
            _audit(request, "RBAC_USER_ROLE_REVOKE", "user_role", resource_id=user.id_usuario, result="FAIL", error_code="CANNOT_REMOVE_LAST_ROLE", target_user=user)
            return error_response(
                "CANNOT_REMOVE_LAST_ROLE",
                "El usuario debe conservar al menos un rol",
                status.HTTP_400_BAD_REQUEST,
                request_id=_request_id(request),
            )

        before = _serialize_user_roles(user)
        was_primary = relation.is_primary
        relation.fch_baja = timezone.now()
        relation.usr_baja = actor
        relation.is_primary = False
        relation.save(update_fields=["fch_baja", "usr_baja", "is_primary"])

        if was_primary:
            replacement = RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True).order_by("id_usuario_rol").first()
            if replacement:
                replacement.is_primary = True
                replacement.save(update_fields=["is_primary"])

        payload = {"userId": user.id_usuario, "roles": _serialize_user_roles(user)}
        _audit(
            request,
            "RBAC_USER_ROLE_REVOKE",
            "user_role",
            resource_id=user.id_usuario,
            result="SUCCESS",
            before=before,
            after=payload,
            target_user=user,
        )
        return Response(payload, status=status.HTTP_200_OK)


class UserOverridesView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def post(self, request, user_id):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_OVERRIDE_UPSERT", "user_override", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            _audit(request, "RBAC_USER_OVERRIDE_UPSERT", "user_override", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        permission_code = request.data.get("permissionCode")
        effect = request.data.get("effect")
        expires_at_raw = request.data.get("expiresAt")

        if not permission_code or effect not in {"ALLOW", "DENY"}:
            _audit(request, "RBAC_USER_OVERRIDE_UPSERT", "user_override", resource_id=user.id_usuario, result="FAIL", error_code="VALIDATION_ERROR", target_user=user)
            return error_response(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={
                    "permissionCode": ["Campo requerido"] if not permission_code else [],
                    "effect": ["Debe ser ALLOW o DENY"] if effect not in {"ALLOW", "DENY"} else [],
                },
                request_id=_request_id(request),
            )

        permission = Permisos.objects.filter(codigo=permission_code, is_active=True).first()
        if not permission:
            _audit(request, "RBAC_USER_OVERRIDE_UPSERT", "user_override", resource_id=user.id_usuario, result="FAIL", error_code="PERMISSION_NOT_FOUND", target_user=user)
            return error_response(
                "PERMISSION_NOT_FOUND",
                "Permiso no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        expires_at = None
        if expires_at_raw:
            expires_at = _parse_expires_at_end_of_day(expires_at_raw)
            if expires_at == "invalid":
                _audit(request, "RBAC_USER_OVERRIDE_UPSERT", "user_override", resource_id=user.id_usuario, result="FAIL", error_code="INVALID_FORMAT", target_user=user)
                return error_response(
                    "INVALID_FORMAT",
                    "Formato invalido",
                    status.HTTP_400_BAD_REQUEST,
                    details={"expiresAt": ["Debe ser una fecha ISO 8601 valida"]},
                    request_id=_request_id(request),
                )

        before = _serialize_user_overrides(user)

        override = RelUsuarioOverride.objects.filter(id_usuario=user, id_permiso=permission).first()
        if override:
            override.efecto = effect
            override.fch_expira = expires_at
            override.fch_baja = None
            override.usr_baja = None
            if not override.usr_asignacion_id:
                override.usr_asignacion = actor
            override.save()
        else:
            RelUsuarioOverride.objects.create(
                id_usuario=user,
                id_permiso=permission,
                efecto=effect,
                fch_expira=expires_at,
                usr_asignacion=actor,
            )

        payload = {"userId": user.id_usuario, "overrides": _serialize_user_overrides(user)}
        _audit(
            request,
            "RBAC_USER_OVERRIDE_UPSERT",
            "user_override",
            resource_id=user.id_usuario,
            result="SUCCESS",
            before=before,
            after=payload,
            target_user=user,
        )
        return Response(payload, status=status.HTTP_200_OK)


class UserOverrideRemoveView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def delete(self, request, user_id, code):
        actor, auth_error = _authorize(
            request,
            "admin:gestion:usuarios:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(request, "RBAC_USER_OVERRIDE_REMOVE", "user_override", resource_id=user_id, result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            _audit(request, "RBAC_USER_OVERRIDE_REMOVE", "user_override", resource_id=user_id, result="FAIL", error_code="USER_NOT_FOUND")
            return error_response(
                "USER_NOT_FOUND",
                "Usuario no encontrado",
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        before = _serialize_user_overrides(user)
        override = (
            RelUsuarioOverride.objects.select_related("id_permiso")
            .filter(id_usuario=user, id_permiso__codigo=code, fch_baja__isnull=True)
            .first()
        )
        if override:
            override.fch_baja = timezone.now()
            override.usr_baja = actor
            override.save(update_fields=["fch_baja", "usr_baja"])

        payload = {"userId": user.id_usuario, "overrides": _serialize_user_overrides(user)}
        _audit(
            request,
            "RBAC_USER_OVERRIDE_REMOVE",
            "user_override",
            resource_id=user.id_usuario,
            result="SUCCESS",
            before=before,
            after=payload,
            target_user=user,
        )
        return Response(payload, status=status.HTTP_200_OK)

from apps.authentication.repositories.user_repository import UserRepository


def build_me_response(user):
    # Mapea el usuario autenticado a AuthUser.
    return UserRepository.build_auth_user(user)


def build_capabilities_response(user):
    # Proyeccion dedicada de permisos/capabilities para consumo UI.
    auth_user = UserRepository.build_auth_user(user)
    return {
        "permissions": auth_user["permissions"],
        "effectivePermissions": auth_user["effectivePermissions"],
        "capabilities": auth_user["capabilities"],
        "permissionDependenciesVersion": auth_user["permissionDependenciesVersion"],
        "strictCapabilityPrefixes": auth_user["strictCapabilityPrefixes"],
        "authRevision": auth_user["authRevision"],
    }

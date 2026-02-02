from apps.authentication.repositories.user_repository import UserRepository


def build_me_response(user):
    # Mapea el usuario autenticado a AuthUser.
    return UserRepository.build_auth_user(user)

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    # Credenciales de login.
    usuario = serializers.CharField(min_length=2, max_length=10)
    clave = serializers.CharField(min_length=8)


class CompleteOnboardingSerializer(serializers.Serializer):
    # Datos para completar onboarding.
    newPassword = serializers.CharField(min_length=8, max_length=255)
    termsAccepted = serializers.BooleanField()


class RequestResetCodeSerializer(serializers.Serializer):
    # Email para recuperar password.
    correo = serializers.EmailField()


class VerifyResetCodeSerializer(serializers.Serializer):
    # Validacion de OTP.
    correo = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    # Nuevo password a guardar.
    newPassword = serializers.CharField(min_length=8, max_length=255)

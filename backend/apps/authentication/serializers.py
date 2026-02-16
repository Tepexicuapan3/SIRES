from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    # Credenciales de login.
    username = serializers.CharField(min_length=1, max_length=50)
    password = serializers.CharField(min_length=1, max_length=255)


class CompleteOnboardingSerializer(serializers.Serializer):
    # Datos para completar onboarding.
    newPassword = serializers.CharField(min_length=8, max_length=255)
    termsAccepted = serializers.BooleanField()


class RequestResetCodeSerializer(serializers.Serializer):
    # Email para recuperar password.
    email = serializers.EmailField()


class VerifyResetCodeSerializer(serializers.Serializer):
    # Validacion de OTP.
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    # Nuevo password a guardar.
    newPassword = serializers.CharField(min_length=8, max_length=255)

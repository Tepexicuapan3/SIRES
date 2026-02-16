from rest_framework import serializers

class UserRefSerializer(serializers.Serializer):

    id = serializers.IntegerField(source="id_usuario")
    name = serializers.CharField(source="detusuario.nombre_completo")

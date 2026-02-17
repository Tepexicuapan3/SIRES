from rest_framework import serializers

from apps.catalogos.models import CatRol


class RoleDetailSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(source="id_rol")
    name = serializers.CharField(source="rol")
    description = serializers.CharField(source="desc_rol")
    landingRoute = serializers.CharField(
        source="landing_route",
        allow_null=True,
        allow_blank=True,
        required=False,
    )

    class Meta:
        model = CatRol
        fields = [
            "id",
            "name",
            "description",
            "landingRoute",
        ]

from rest_framework import serializers


class StartConsultationSerializer(serializers.Serializer):
    """No payload required for start action."""


class SaveDiagnosisSerializer(serializers.Serializer):
    primaryDiagnosis = serializers.CharField(max_length=255, allow_blank=False)
    finalNote = serializers.CharField(allow_blank=False)
    cieCode = serializers.CharField(
        max_length=8,
        allow_blank=True,
        required=False,
        allow_null=True,
    )

    def validate_primaryDiagnosis(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("primaryDiagnosis es obligatorio.")
        return normalized

    def validate_finalNote(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("finalNote es obligatorio.")
        return normalized

    def validate_cieCode(self, value):
        if value is None:
            return None

        normalized = value.strip().upper()
        if not normalized:
            return None

        return normalized


class SavePrescriptionsSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.CharField(max_length=255, allow_blank=False),
        allow_empty=False,
    )

    def validate_items(self, value):
        normalized_items = []
        for item in value:
            normalized_item = item.strip()
            if normalized_item:
                normalized_items.append(normalized_item)

        if not normalized_items:
            raise serializers.ValidationError("Debes indicar al menos una receta.")

        return normalized_items


class CloseConsultationSerializer(SaveDiagnosisSerializer):
    pass


class SearchCieSerializer(serializers.Serializer):
    search = serializers.CharField(max_length=120, allow_blank=False)
    limit = serializers.IntegerField(min_value=1, max_value=20, required=False, default=8)

    def validate_search(self, value):
        normalized = value.strip()
        if len(normalized) < 2:
            raise serializers.ValidationError(
                "Debes ingresar al menos 2 caracteres para buscar CIE."
            )
        return normalized

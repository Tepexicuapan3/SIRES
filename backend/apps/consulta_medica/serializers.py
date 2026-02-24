from rest_framework import serializers


class StartConsultationSerializer(serializers.Serializer):
    """No payload required for start action."""


class SaveDiagnosisSerializer(serializers.Serializer):
    primaryDiagnosis = serializers.CharField(max_length=255, allow_blank=False)
    finalNote = serializers.CharField(allow_blank=False)

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

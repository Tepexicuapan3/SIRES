from rest_framework import serializers


class StartConsultationSerializer(serializers.Serializer):
    """No payload required for start action."""


class CloseConsultationSerializer(serializers.Serializer):
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

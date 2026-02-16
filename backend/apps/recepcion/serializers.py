from rest_framework import serializers


class CreateVisitSerializer(serializers.Serializer):
    patientId = serializers.IntegerField(min_value=1)
    hasAppointment = serializers.BooleanField(required=False, default=False)


class ListVisitsQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(min_value=1, required=False, default=1)
    pageSize = serializers.IntegerField(min_value=1, max_value=100, required=False, default=20)


class UpdateVisitStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("cancelada", "no_show"))

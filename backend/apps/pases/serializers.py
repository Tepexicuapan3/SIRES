from rest_framework import serializers

from apps.pases.models import Referral

_STUDY_TYPES = {Referral.ReferralType.LABORATORIO, Referral.ReferralType.GABINETE}


class ReferralStudyItemSerializer(serializers.Serializer):
    studyTypeId = serializers.IntegerField()


class CreateReferralSerializer(serializers.Serializer):
    referralType = serializers.ChoiceField(choices=Referral.ReferralType.choices)
    destinationCenterId = serializers.IntegerField(required=False, allow_null=True)
    specialtyId = serializers.IntegerField(required=False, allow_null=True)
    requestedCare = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    visitType = serializers.ChoiceField(
        choices=Referral.VisitType.choices, required=False, allow_null=True,
    )
    studies = ReferralStudyItemSerializer(many=True, required=False)

    def validate(self, attrs):
        referral_type = attrs.get("referralType")
        errors = {}

        if referral_type in _STUDY_TYPES:
            if not attrs.get("studies"):
                errors["studies"] = ["Debes indicar al menos un estudio."]
        elif referral_type == Referral.ReferralType.ESPECIALIDAD:
            for field in ("destinationCenterId", "specialtyId", "requestedCare"):
                if not attrs.get(field):
                    errors[field] = ["Este campo es obligatorio para un pase de Especialidad."]
        elif referral_type == Referral.ReferralType.HOSPITALIZACION:
            for field in ("destinationCenterId", "specialtyId"):
                if not attrs.get(field):
                    errors[field] = [
                        "Este campo es obligatorio para un pase de Hospitalización."
                    ]
        elif referral_type == Referral.ReferralType.TERCER_NIVEL:
            if not attrs.get("destinationCenterId"):
                errors["destinationCenterId"] = [
                    "Este campo es obligatorio para un pase de Tercer Nivel."
                ]

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class CancelReferralSerializer(serializers.Serializer):
    cancellationReasonId = serializers.IntegerField()

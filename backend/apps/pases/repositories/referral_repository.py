from apps.pases.models import Referral, ReferralStudyDetail

_STUDY_TYPES = {Referral.ReferralType.LABORATORIO, Referral.ReferralType.GABINETE}


class ReferralRepository:
    @staticmethod
    def get_by_id(referral_id):
        return Referral.objects.filter(pk=referral_id, is_active=True).first()

    @staticmethod
    def get_active_by_consultation_and_type(consultation, referral_type):
        return Referral.objects.filter(
            consultation=consultation,
            referral_type=referral_type,
            status=Referral.Status.ACTIVO,
            is_active=True,
        ).first()

    @staticmethod
    def create(
        *,
        consultation,
        no_exp,
        pk_num,
        referral_type,
        destination_center=None,
        specialty=None,
        requested_care=None,
        visit_type=None,
        folio,
        created_by_id=None,
        updated_by_id=None,
    ):
        return Referral.objects.create(
            consultation=consultation,
            no_exp=no_exp,
            pk_num=pk_num,
            referral_type=referral_type,
            destination_center=destination_center,
            specialty=specialty,
            requested_care=requested_care,
            visit_type=visit_type,
            folio=folio,
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )

    @staticmethod
    def add_study_detail(*, referral, study_type, created_by_id=None, updated_by_id=None):
        return ReferralStudyDetail.objects.create(
            referral=referral,
            study_type=study_type,
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )

    @staticmethod
    def cancel(referral, *, cancellation_reason, updated_by_id=None):
        referral.status = Referral.Status.CANCELADO
        referral.cancellation_reason = cancellation_reason
        referral.updated_by_id = updated_by_id
        referral.save(
            update_fields=["status", "cancellation_reason", "updated_by_id", "updated_at"]
        )
        return referral

    @staticmethod
    def list_for_patient(no_exp, pk_num):
        return (
            Referral.objects.filter(no_exp=no_exp, pk_num=pk_num, is_active=True)
            .select_related("destination_center", "specialty", "cancellation_reason")
            .prefetch_related("study_details__study_type")
            .order_by("-created_at")
        )

    @staticmethod
    def to_contract(referral):
        studies = []
        if referral.referral_type in _STUDY_TYPES:
            studies = [
                {
                    "id": detail.id_referral_study,
                    "studyTypeId": detail.study_type_id,
                    "studyTypeName": detail.study_type.name,
                    "costApproved": detail.cost_approved,
                    "validUntil": detail.valid_until,
                    "status": detail.status,
                }
                for detail in referral.study_details.all()
                if detail.is_active
            ]

        return {
            "id": referral.id_referral,
            "visitId": referral.consultation.id_visit_id,
            "noExp": referral.no_exp,
            "pkNum": referral.pk_num,
            "referralType": referral.referral_type,
            "destinationCenterId": referral.destination_center_id,
            "destinationCenterName": (
                referral.destination_center.name if referral.destination_center_id else None
            ),
            "specialtyId": referral.specialty_id,
            "specialtyName": referral.specialty.name if referral.specialty_id else None,
            "requestedCare": referral.requested_care,
            "visitType": referral.visit_type,
            "folio": referral.folio,
            "status": referral.status,
            "cancellationReasonId": referral.cancellation_reason_id,
            "studies": studies,
            "isActive": referral.is_active,
            "createdAt": referral.created_at,
        }

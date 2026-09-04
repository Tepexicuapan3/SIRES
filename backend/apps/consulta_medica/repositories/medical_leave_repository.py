from apps.consulta_medica.models import MedicalLeave


class MedicalLeaveRepository:
    @staticmethod
    def get_active_for_consultation(consultation):
        return MedicalLeave.objects.filter(
            consultation=consultation, is_active=True
        ).first()

    @staticmethod
    def get_active_overlap_for_patient(no_exp, pk_num, on_date):
        return (
            MedicalLeave.objects.filter(
                no_exp=no_exp, pk_num=pk_num, is_active=True, end_date__gte=on_date,
            )
            .order_by("-end_date")
            .first()
        )

    @staticmethod
    def create(
        *,
        consultation,
        no_exp,
        pk_num,
        leave_type,
        is_subsequent,
        days,
        start_date,
        end_date,
        folio,
        created_by_id=None,
        updated_by_id=None,
    ):
        return MedicalLeave.objects.create(
            consultation=consultation,
            no_exp=no_exp,
            pk_num=pk_num,
            leave_type=leave_type,
            is_subsequent=is_subsequent,
            days=days,
            start_date=start_date,
            end_date=end_date,
            folio=folio,
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )

    @staticmethod
    def list_for_patient(no_exp, pk_num):
        return (
            MedicalLeave.objects.filter(no_exp=no_exp, pk_num=pk_num, is_active=True)
            .select_related("leave_type")
            .order_by("-start_date")
        )

    @staticmethod
    def to_contract(leave):
        return {
            "id": leave.id_medical_leave,
            "visitId": leave.consultation.id_visit_id,
            "folio": leave.folio,
            "leaveTypeId": leave.leave_type_id,
            "leaveTypeName": leave.leave_type.name,
            "isSubsequent": leave.is_subsequent,
            "days": leave.days,
            "startDate": leave.start_date,
            "endDate": leave.end_date,
            "isActive": leave.is_active,
            "createdAt": leave.created_at,
        }

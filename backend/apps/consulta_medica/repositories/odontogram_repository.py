from apps.consulta_medica.models import OdontogramTooth


class OdontogramRepository:
    @staticmethod
    def list_for_patient(no_exp, pk_num):
        """Mapa {tooth_fdi: OdontogramTooth} solo con las piezas que SI
        tienen registro -- las que faltan se interpretan como "sano" en el
        use case, no aqui (el repository no conoce la lista completa de
        piezas FDI, eso es responsabilidad de odontogram_constants)."""
        teeth = OdontogramTooth.objects.filter(
            no_exp=no_exp, pk_num=pk_num, is_active=True,
        )
        return {tooth.tooth_fdi: tooth for tooth in teeth}

    @staticmethod
    def upsert_tooth(*, no_exp, pk_num, tooth_fdi, condition, notes, updated_by_id=None):
        tooth, created = OdontogramTooth.objects.update_or_create(
            no_exp=no_exp,
            pk_num=pk_num,
            tooth_fdi=tooth_fdi,
            defaults={
                "condition": condition,
                "notes": notes,
                "is_active": True,
                "updated_by_id": updated_by_id,
                **({"created_by_id": updated_by_id} if created else {}),
            },
        )
        return tooth

    @staticmethod
    def to_contract(tooth):
        return {
            "toothFdi": tooth.tooth_fdi,
            "condition": tooth.condition,
            "notes": tooth.notes,
            "updatedAt": tooth.updated_at,
        }

from django.utils import timezone

from apps.somatometria.models import PatientLatestVitals, VisitVitalSigns


class VitalsRepository:
    @staticmethod
    def upsert_for_visit(visit, vitals_payload, *, reused_from=None):
        defaults = {
            "weight_kg": vitals_payload["weightKg"],
            "height_cm": vitals_payload["heightCm"],
            "temperature_c": vitals_payload.get("temperatureC"),
            "oxygen_saturation_pct": vitals_payload.get("oxygenSaturationPct"),
            "heart_rate_bpm": vitals_payload.get("heartRateBpm"),
            "respiratory_rate_bpm": vitals_payload.get("respiratoryRateBpm"),
            "blood_pressure_systolic": vitals_payload.get("bloodPressureSystolic"),
            "blood_pressure_diastolic": vitals_payload.get("bloodPressureDiastolic"),
            "waist_circumference_cm": vitals_payload.get("waistCircumferenceCm"),
            "glucosa_capilar_mgdl": vitals_payload.get("glucosaCapilarMgdl"),
            "bmi": vitals_payload["bmi"],
            "notes": vitals_payload.get("notes"),
            "reused_from_visit": reused_from,
        }
        vital_signs, _ = VisitVitalSigns.objects.update_or_create(
            id_visit=visit,
            defaults=defaults,
        )

        # Espejo "ultima captura por paciente": se sobreescribe a proposito
        # (a diferencia de `VisitVitalSigns`, que jamas se sobreescribe). Es
        # solo para precargar la siguiente consulta, no forma parte del
        # historial clinico. La clave efectiva es SIEMPRE (no_exp, pk_num)
        # -- ver docstring de `PatientLatestVitals` -- por eso el lookup y
        # el upsert usan ambos campos, nunca solo `no_exp`.
        if visit.no_exp:
            latest_defaults = dict(defaults)
            latest_defaults.pop("notes", None)
            latest_defaults.pop("reused_from_visit", None)
            latest_defaults["id_visit_origen"] = visit
            PatientLatestVitals.objects.update_or_create(
                no_exp=visit.no_exp,
                pk_num=visit.pk_num,
                defaults=latest_defaults,
            )

        return vital_signs

    @staticmethod
    def get_latest_for_patient(no_exp, pk_num):
        # Sin defaults a proposito: un caller que se olvide de pasar
        # `pk_num` debe explotar ruidoso (TypeError) en vez de mezclar en
        # silencio el cache entre integrantes del mismo nucleo familiar.
        if not no_exp:
            return None
        return PatientLatestVitals.objects.filter(no_exp=no_exp, pk_num=pk_num).first()

    @staticmethod
    def get_latest_today_for_patient(no_exp, pk_num, *, exclude_visit_id):
        """
        Fuente de verdad (NO el cache) de la captura de signos vitales de
        HOY para la misma persona (no_exp+pk_num), en una visita distinta a
        `exclude_visit_id`. "Hoy" es el dia calendario LOCAL
        (`timezone.localdate()` / `fch_alta__date` con USE_TZ=True aplica
        la zona horaria configurada) -- nunca UTC crudo, para no ofrecer ni
        esconder capturas cerca de medianoche por error.
        """
        if not no_exp:
            return None
        return (
            VisitVitalSigns.objects.select_related("id_visit")
            .filter(
                id_visit__no_exp=no_exp,
                id_visit__pk_num=pk_num,
                fch_alta__date=timezone.localdate(),
            )
            .exclude(id_visit_id=exclude_visit_id)
            .exclude(id_visit__status__in=("cancelada", "no_show"))
            .order_by("-fch_alta")
            .first()
        )

    @staticmethod
    def get_vitals_by_visit_id(visit_id):
        return (
            VisitVitalSigns.objects.select_related("id_visit")
            .filter(id_visit_id=visit_id)
            .first()
        )

    @staticmethod
    def _metrics_contract(vital_signs):
        return {
            "weightKg": float(vital_signs.weight_kg),
            "heightCm": float(vital_signs.height_cm),
            "temperatureC": (
                float(vital_signs.temperature_c)
                if vital_signs.temperature_c is not None
                else None
            ),
            "oxygenSaturationPct": vital_signs.oxygen_saturation_pct,
            "heartRateBpm": vital_signs.heart_rate_bpm,
            "respiratoryRateBpm": vital_signs.respiratory_rate_bpm,
            "bloodPressureSystolic": vital_signs.blood_pressure_systolic,
            "bloodPressureDiastolic": vital_signs.blood_pressure_diastolic,
            "waistCircumferenceCm": vital_signs.waist_circumference_cm,
            "glucosaCapilarMgdl": vital_signs.glucosa_capilar_mgdl,
            "bmi": float(vital_signs.bmi),
        }

    @staticmethod
    def _reused_from_contract(origin_visit):
        """
        Detalle de la visita ORIGEN cuando esta captura fue un reuso --
        mismos nombres de campo que `today_to_contract` (`sourceFolio`,
        `sourceServiceType`, `capturedAt`) para que el medico vea folio,
        especialidad y hora de origen, no solo un id crudo. `None` cuando
        no hubo reuso (retrocompatible con `reusedFromVisitId: None`).
        """
        if origin_visit is None:
            return None
        # Reverse OneToOne: cacheado por select_related en las queries de
        # lista/detalle de visitas; si no vino precargado dispara 1 query
        # extra puntual (no hay N+1 de lista aca, es un solo objeto).
        origin_vitals = getattr(origin_visit, "vital_signs", None)
        return {
            "sourceVisitId": origin_visit.id_visit,
            "sourceFolio": origin_visit.folio,
            "sourceServiceType": origin_visit.service_type,
            "capturedAt": (
                origin_vitals.fch_alta.isoformat() if origin_vitals else None
            ),
        }

    @staticmethod
    def to_contract(vital_signs):
        contract = VitalsRepository._metrics_contract(vital_signs)
        contract["capturedAt"] = vital_signs.fch_alta.isoformat()
        contract["reusedFromVisitId"] = vital_signs.reused_from_visit_id
        contract["reusedFrom"] = VitalsRepository._reused_from_contract(
            vital_signs.reused_from_visit
        )
        return contract

    @staticmethod
    def latest_to_contract(latest):
        contract = VitalsRepository._metrics_contract(latest)
        contract["capturedAt"] = latest.fch_modf.isoformat()
        return contract

    @staticmethod
    def today_to_contract(vital_signs):
        visit = vital_signs.id_visit
        return {
            "sourceVisitId": visit.id_visit,
            "sourceFolio": visit.folio,
            "sourceServiceType": visit.service_type,
            "capturedAt": vital_signs.fch_alta.isoformat(),
            "values": VitalsRepository._metrics_contract(vital_signs),
        }

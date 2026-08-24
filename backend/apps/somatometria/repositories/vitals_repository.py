from apps.somatometria.models import PatientLatestVitals, VisitVitalSigns


class VitalsRepository:
    @staticmethod
    def upsert_for_visit(visit, vitals_payload):
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
        }
        vital_signs, _ = VisitVitalSigns.objects.update_or_create(
            id_visit=visit,
            defaults=defaults,
        )

        # Espejo "ultima captura por paciente": se sobreescribe a proposito
        # (a diferencia de `VisitVitalSigns`, que jamas se sobreescribe). Es
        # solo para precargar la siguiente consulta, no forma parte del
        # historial clinico.
        if visit.no_exp:
            latest_defaults = dict(defaults)
            latest_defaults.pop("notes", None)
            latest_defaults["id_visit_origen"] = visit
            PatientLatestVitals.objects.update_or_create(
                no_exp=visit.no_exp,
                defaults=latest_defaults,
            )

        return vital_signs

    @staticmethod
    def get_latest_for_patient(no_exp):
        if not no_exp:
            return None
        return PatientLatestVitals.objects.filter(no_exp=no_exp).first()

    @staticmethod
    def to_contract(vital_signs):
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
            "notes": vital_signs.notes,
        }

    @staticmethod
    def latest_to_contract(latest):
        return {
            "weightKg": float(latest.weight_kg),
            "heightCm": float(latest.height_cm),
            "temperatureC": (
                float(latest.temperature_c)
                if latest.temperature_c is not None
                else None
            ),
            "oxygenSaturationPct": latest.oxygen_saturation_pct,
            "heartRateBpm": latest.heart_rate_bpm,
            "respiratoryRateBpm": latest.respiratory_rate_bpm,
            "bloodPressureSystolic": latest.blood_pressure_systolic,
            "bloodPressureDiastolic": latest.blood_pressure_diastolic,
            "waistCircumferenceCm": latest.waist_circumference_cm,
            "glucosaCapilarMgdl": latest.glucosa_capilar_mgdl,
            "bmi": float(latest.bmi),
            "capturedAt": latest.fch_modf.isoformat(),
        }

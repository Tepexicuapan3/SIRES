from apps.somatometria.models import VisitVitalSigns


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
            "bmi": vitals_payload["bmi"],
            "notes": vitals_payload.get("notes"),
        }
        vital_signs, _ = VisitVitalSigns.objects.update_or_create(
            id_visit=visit,
            defaults=defaults,
        )
        return vital_signs

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
            "bmi": float(vital_signs.bmi),
            "notes": vital_signs.notes,
        }

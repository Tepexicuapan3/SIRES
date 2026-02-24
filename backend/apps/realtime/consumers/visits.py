from apps.realtime.consumers.base import BaseRealtimeConsumer

VISITS_STREAM_GROUP = "visits.stream"
ALLOWED_VISITS_STREAM_ROLES = {
    "RECEPCION",
    "SOMATOMETRIA",
    "DOCTOR",
    "CLINICO",
}
ALLOWED_VISITS_STREAM_PERMISSIONS = {
    "clinico:somatometria:read",
    "clinico:consultas:read",
}


class VisitsRealtimeConsumer(BaseRealtimeConsumer):
    def get_group_names(self):
        return [VISITS_STREAM_GROUP]

    def authorize_scope(self, realtime_user):
        roles = {(role or "").strip().upper() for role in (realtime_user or {}).get("roles", [])}
        if roles & ALLOWED_VISITS_STREAM_ROLES:
            return True

        permissions = {
            (permission or "").strip() for permission in (realtime_user or {}).get("permissions", [])
        }
        return bool(permissions & ALLOWED_VISITS_STREAM_PERMISSIONS)

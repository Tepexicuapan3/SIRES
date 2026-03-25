from typing import Protocol

from apps.recepcion.contracts.visit_flow_contract import (
    VisitFlowContractError,
    get_visit_by_id,
    resolve_next_visit_state,
    update_visit_status,
)


class VisitFlowError(Exception):
    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class VisitFlowService(Protocol):
    def get_by_id(self, visit_id): ...

    def resolve_next_state(self, current_state, *, vitals_complete=False): ...

    def update_status(self, visit, next_state): ...


class RecepcionVisitFlowService:
    def get_by_id(self, visit_id):
        return get_visit_by_id(visit_id)

    def resolve_next_state(self, current_state, *, vitals_complete=False):
        try:
            return resolve_next_visit_state(
                current_state,
                vitals_complete=vitals_complete,
            )
        except VisitFlowContractError as exc:
            raise VisitFlowError(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
            ) from exc

    def update_status(self, visit, next_state):
        return update_visit_status(visit, next_state)


_visit_flow_service = RecepcionVisitFlowService()


def get_visit_flow_service():
    return _visit_flow_service

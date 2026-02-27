import { VISIT_STATUS, type VisitStatus } from "@api/types";

export const VISIT_STAGE = {
  RECEPCION: "recepcion",
  SOMATOMETRIA: "somatometria",
  DOCTOR: "doctor",
} as const;

export type VisitStage = (typeof VISIT_STAGE)[keyof typeof VISIT_STAGE];

const STAGE_ORDER: Record<VisitStage, number> = {
  [VISIT_STAGE.RECEPCION]: 0,
  [VISIT_STAGE.SOMATOMETRIA]: 1,
  [VISIT_STAGE.DOCTOR]: 2,
};

const STAGE_BY_STATUS: Record<VisitStatus, VisitStage> = {
  [VISIT_STATUS.EN_ESPERA]: VISIT_STAGE.RECEPCION,
  [VISIT_STATUS.EN_SOMATOMETRIA]: VISIT_STAGE.SOMATOMETRIA,
  [VISIT_STATUS.LISTA_PARA_DOCTOR]: VISIT_STAGE.DOCTOR,
  [VISIT_STATUS.EN_CONSULTA]: VISIT_STAGE.DOCTOR,
  [VISIT_STATUS.CERRADA]: VISIT_STAGE.DOCTOR,
  [VISIT_STATUS.CANCELADA]: VISIT_STAGE.RECEPCION,
  [VISIT_STATUS.NO_SHOW]: VISIT_STAGE.RECEPCION,
};

export const getStageByStatus = (status: VisitStatus): VisitStage => {
  return STAGE_BY_STATUS[status];
};

export const isStageAvailableForStatus = (
  status: VisitStatus,
  stage: VisitStage,
): boolean => {
  const currentStage = getStageByStatus(status);
  return STAGE_ORDER[stage] <= STAGE_ORDER[currentStage];
};

export const canRunRecepcionStatusAction = (status: VisitStatus): boolean => {
  return status === VISIT_STATUS.EN_ESPERA;
};

export const canCaptureVitals = (status: VisitStatus): boolean => {
  return status === VISIT_STATUS.EN_SOMATOMETRIA;
};

export const canStartConsultation = (status: VisitStatus): boolean => {
  return status === VISIT_STATUS.LISTA_PARA_DOCTOR;
};

export const canCloseConsultation = (status: VisitStatus): boolean => {
  return status === VISIT_STATUS.EN_CONSULTA;
};

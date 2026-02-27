import {
  ARRIVAL_TYPE,
  type CreateVisitRequest,
  type VisitQueueItem,
} from "@api/types";
import type {
  CheckinFormInput,
  CheckinFormValues,
} from "@features/recepcion/modules/checkin/domain/checkin.schemas";
import {
  RECEPCION_SERVICE,
  resolveRecepcionService,
  stripRecepcionServiceTag,
} from "@features/recepcion/shared/domain/recepcion.services";

export const mapCheckinFormToCreateVisitRequest = (
  values: CheckinFormValues,
): CreateVisitRequest => {
  return {
    patientId: values.patientId,
    arrivalType: values.arrivalType,
    serviceType: values.serviceType,
    appointmentId:
      values.arrivalType === ARRIVAL_TYPE.APPOINTMENT
        ? values.appointmentId?.trim()
        : undefined,
    doctorId: values.doctorId,
    notes: values.notes?.trim() || undefined,
  };
};

export const mapVisitToCheckinDefaults = (
  visit: Pick<
    VisitQueueItem,
    | "patientId"
    | "serviceType"
    | "arrivalType"
    | "appointmentId"
    | "doctorId"
    | "notes"
  >,
): Partial<CheckinFormInput> => {
  const resolvedService = resolveRecepcionService(visit);
  const serviceType =
    resolvedService === RECEPCION_SERVICE.SIN_CLASIFICAR
      ? RECEPCION_SERVICE.MEDICINA_GENERAL
      : resolvedService;

  return {
    patientId: visit.patientId,
    serviceType,
    arrivalType: visit.arrivalType,
    appointmentId: visit.appointmentId ?? "",
    doctorId: visit.doctorId ?? undefined,
    notes: stripRecepcionServiceTag(visit.notes),
  };
};

import * as z from "zod";
import { ARRIVAL_TYPE } from "@api/types";
import {
  RECEPCION_SERVICE,
  isServiceForcedToWalkIn,
} from "@features/recepcion/shared/domain/recepcion.services";

const parseOptionalNumber = (value: unknown): unknown => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const parseOptionalText = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const createCheckinFormSchema = z
  .object({
    patientId: z.coerce
      .number()
      .int()
      .min(1, { error: "Ingresa un ID de paciente valido." }),
    serviceType: z.enum([
      RECEPCION_SERVICE.MEDICINA_GENERAL,
      RECEPCION_SERVICE.ESPECIALIDAD,
      RECEPCION_SERVICE.URGENCIAS,
    ]),
    arrivalType: z.enum([ARRIVAL_TYPE.APPOINTMENT, ARRIVAL_TYPE.WALK_IN]),
    appointmentId: z.preprocess(parseOptionalText, z.string().optional()),
    doctorId: z.preprocess(
      parseOptionalNumber,
      z.coerce.number().int().min(1).optional(),
    ),
    notes: z.preprocess(parseOptionalText, z.string().max(255).optional()),
  })
  .superRefine((data, ctx) => {
    if (
      data.arrivalType === ARRIVAL_TYPE.APPOINTMENT &&
      !data.appointmentId?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointmentId"],
        message: "appointmentId es obligatorio para arrivalType=appointment.",
      });
    }

    if (
      data.arrivalType === ARRIVAL_TYPE.WALK_IN &&
      data.appointmentId?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointmentId"],
        message: "appointmentId debe ir vacio para arrivalType=walk_in.",
      });
    }

    if (
      isServiceForcedToWalkIn(data.serviceType) &&
      data.arrivalType !== ARRIVAL_TYPE.WALK_IN
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["arrivalType"],
        message: "Urgencias solo permite registro de llegada sin cita.",
      });
    }
  });

export type CheckinFormValues = z.infer<typeof createCheckinFormSchema>;
export type CheckinFormInput = z.input<typeof createCheckinFormSchema>;

export const DEFAULT_CHECKIN_FORM_VALUES: CheckinFormInput = {
  patientId: undefined,
  serviceType: RECEPCION_SERVICE.MEDICINA_GENERAL,
  arrivalType: ARRIVAL_TYPE.APPOINTMENT,
  appointmentId: "",
  doctorId: undefined,
  notes: "",
};

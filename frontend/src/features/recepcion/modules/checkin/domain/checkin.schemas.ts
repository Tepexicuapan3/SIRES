import * as z from "zod";
import { ARRIVAL_TYPE } from "@api/types";
import {
  RECEPCION_SERVICE,
  isServiceForcedToWalkIn,
} from "@features/recepcion/shared/domain/recepcion.services";

const parseOptionalNumber = (value: unknown): unknown => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const parseOptionalText = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const createCheckinFormSchema = z
  .object({
    // Identificación del paciente por expediente + miembro familiar.
    noExp: z.string().min(1, { message: "Ingresa el número de expediente." }).max(20),
    pkNum: z.coerce.number().int().min(0).default(0),

    serviceType: z.enum([
      RECEPCION_SERVICE.MEDICINA_GENERAL,
      RECEPCION_SERVICE.ESPECIALIDAD,
      RECEPCION_SERVICE.URGENCIAS,
    ]),
    arrivalType:   z.enum([ARRIVAL_TYPE.APPOINTMENT, ARRIVAL_TYPE.WALK_IN]),
    appointmentId: z.preprocess(parseOptionalText, z.string().optional()),
    doctorId:      z.preprocess(parseOptionalNumber, z.coerce.number().int().min(1).optional()),
    consultorioId: z.preprocess(parseOptionalNumber, z.coerce.number().int().min(1).optional()),
    tipoCitaId:    z.preprocess(parseOptionalNumber, z.coerce.number().int().min(1).optional()),
    notes:          z.preprocess(parseOptionalText, z.string().max(255).optional()),
    horaConsulta:   z.string().optional(),
    fechaConsulta:  z.string().optional(),  // YYYY-MM-DD
  })
  .superRefine((data, ctx) => {
    if (data.arrivalType === ARRIVAL_TYPE.APPOINTMENT && !data.appointmentId?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentId"],
        message: "appointmentId es obligatorio para arrivalType=appointment.",
      });
    }

    if (data.arrivalType === ARRIVAL_TYPE.WALK_IN && data.appointmentId?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentId"],
        message: "appointmentId debe ir vacío para arrivalType=walk_in.",
      });
    }

    if (isServiceForcedToWalkIn(data.serviceType) && data.arrivalType !== ARRIVAL_TYPE.WALK_IN) {
      ctx.addIssue({
        code: "custom",
        path: ["arrivalType"],
        message: "Urgencias solo permite registro de llegada sin cita.",
      });
    }
  });

export type CheckinFormValues = z.infer<typeof createCheckinFormSchema>;
export type CheckinFormInput  = z.input<typeof createCheckinFormSchema>;

export const DEFAULT_CHECKIN_FORM_VALUES: CheckinFormInput = {
  noExp:          "",
  pkNum:          0,
  serviceType:    RECEPCION_SERVICE.MEDICINA_GENERAL,
  // El campo "ID de cita" se saco del formulario de generar ficha (no
  // aporta al flujo de recepcion) -- las visitas creadas ahi quedan
  // siempre como walk-in, nunca "con cita" (arrivalType=appointment
  // exige un appointmentId que ya no hay forma de cargar en la UI).
  arrivalType:    ARRIVAL_TYPE.WALK_IN,
  appointmentId:  "",
  doctorId:       undefined,
  consultorioId:  undefined,
  tipoCitaId:     undefined,
  notes:          "",
  horaConsulta:   undefined,
  fechaConsulta:  undefined,
};

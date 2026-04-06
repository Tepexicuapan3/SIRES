import { z } from "zod";

export const crearCitaSchema = z
  .object({
    no_exp: z.coerce
      .number({ error: "El expediente debe ser un número." })
      .int()
      .positive("Ingrese un expediente válido."),

    tipo_paciente: z.enum(["trabajador", "derechohabiente"]),

    pk_num: z.coerce.number().int().min(0),

    medico_id: z.coerce
      .number({ error: "Seleccione un médico." })
      .int()
      .positive("Seleccione un médico."),

    centro_atencion_id: z.coerce
      .number({ error: "Seleccione un centro." })
      .int()
      .positive("Seleccione un centro de atención."),

    consultorio_id: z.coerce
      .number({ error: "Seleccione un consultorio." })
      .int()
      .positive("Seleccione un consultorio."),

    fecha_hora: z
      .string()
      .min(1, "Seleccione fecha y hora.")
      .transform((val) => {
        // Convierte "2026-04-01T09:30" → "2026-04-01T09:30:00"
        if (!val) return val;
        return val.length === 16 ? `${val}:00` : val;
      }),

    motivo: z.string().max(500).optional().default(""),

    email_notificacion: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine(
        (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Correo electrónico inválido." }
      ),
  })

  // ── reglas de negocio ─────────────────────────────────────

  .refine(
    (d) => (d.tipo_paciente === "trabajador" ? d.pk_num === 0 : true),
    {
      message: "Para trabajador, pk_num debe ser 0.",
      path: ["pk_num"],
    }
  )
  .refine(
    (d) => (d.tipo_paciente === "derechohabiente" ? d.pk_num > 0 : true),
    {
      message: "Para derechohabiente, pk_num debe ser mayor a 0.",
      path: ["pk_num"],
    }
  )
  .refine(
    (d) => {
      const fecha = new Date(d.fecha_hora);
      return fecha > new Date();
    },
    {
      message: "La fecha y hora debe ser futura.",
      path: ["fecha_hora"],
    }
  );

export type CrearCitaFormValues = z.infer<typeof crearCitaSchema>;
export type CrearCitaFormInput = z.input<typeof crearCitaSchema>;
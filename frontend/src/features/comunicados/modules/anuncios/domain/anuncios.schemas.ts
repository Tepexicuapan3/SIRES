import * as z from "zod";
import type { ListResponse, SuccessResponse } from "@api/types/common.types";

/* =======================
   Entidades
======================= */

export interface AnuncioListItem {
  id: number;
  titulo: string;
  imagenUrl: string;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  activo: boolean;
  orden: number;
}

export interface AnuncioDetail extends AnuncioListItem {
  descripcion: string;
  adjuntoUrl: string | null;
  enlaceUrl: string;
  creadoPorId: number | null;
  creadoEn: string;
  actualizadoEn: string;
}

/** Alias usado por el resto del módulo — el "Anuncio" completo es el detalle. */
export type Anuncio = AnuncioDetail;

/* =======================
   Requests / Responses
======================= */

export type AnunciosListResponse = ListResponse<AnuncioListItem>;

export interface AnuncioDetailResponse {
  anuncio: AnuncioDetail;
}

export interface CreateAnuncioResponse {
  anuncio: AnuncioDetail;
}

export interface UpdateAnuncioResponse {
  anuncio: AnuncioDetail;
}

export type DeleteAnuncioResponse = SuccessResponse;

export interface AnunciosListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  activo?: boolean;
}

/* =======================
   Zod — formulario
======================= */

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength, { error: `${label} demasiado largo` });

const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const anuncioFormSchema = z
  .object({
    titulo: requiredText("Título", 150),
    descripcion: z.string().trim().max(2000).optional().default(""),
    enlaceUrl: z
      .union([z.url({ error: "URL inválida" }), z.literal("")])
      .optional()
      .default(""),
    vigenciaDesde: requiredText("Vigencia desde", 10),
    vigenciaHasta: z.string().optional().default(""),
    orden: z.number().int().min(0).default(0),
    activo: z.boolean().default(true),
    imagen: z
      .instanceof(File)
      .nullable()
      .refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
        { error: "La imagen debe ser JPG, PNG o WEBP" },
      )
      .refine((file) => !file || file.size <= MAX_IMAGE_BYTES, {
        error: "La imagen no puede superar 1 MB",
      }),
    adjuntoPdf: z
      .instanceof(File)
      .nullable()
      .optional()
      .refine((file) => !file || file.type === "application/pdf", {
        error: "El adjunto debe ser un PDF",
      })
      .refine((file) => !file || file.size <= MAX_PDF_BYTES, {
        error: "El adjunto no puede superar 5 MB",
      }),
  })
  .refine(
    (values) =>
      !values.vigenciaHasta ||
      !values.vigenciaDesde ||
      values.vigenciaHasta >= values.vigenciaDesde,
    {
      error: "La vigencia hasta no puede ser anterior a la vigencia desde",
      path: ["vigenciaHasta"],
    },
  );

export const createAnuncioSchema = anuncioFormSchema.refine(
  (values) => values.imagen instanceof File,
  { error: "La imagen es obligatoria", path: ["imagen"] },
);

export type AnuncioFormInput = z.input<typeof anuncioFormSchema>;
export type AnuncioFormValues = z.infer<typeof anuncioFormSchema>;
export type CreateAnuncioFormInput = z.input<typeof createAnuncioSchema>;
export type CreateAnuncioFormValues = z.infer<typeof createAnuncioSchema>;

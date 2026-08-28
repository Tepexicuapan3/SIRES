import type {
  AnuncioDetail,
  AnuncioFormValues,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";

export const ANUNCIO_DEFAULT_VALUES: AnuncioFormValues = {
  titulo: "",
  descripcion: "",
  enlaceUrl: "",
  vigenciaDesde: "",
  vigenciaHasta: "",
  orden: 0,
  activo: true,
  imagen: null,
  adjuntoPdf: null,
};

export const mapAnuncioDetailToFormValues = (
  detail?: AnuncioDetail | null,
): AnuncioFormValues => ({
  titulo: detail?.titulo ?? "",
  descripcion: detail?.descripcion ?? "",
  enlaceUrl: detail?.enlaceUrl ?? "",
  vigenciaDesde: detail?.vigenciaDesde ?? "",
  vigenciaHasta: detail?.vigenciaHasta ?? "",
  orden: detail?.orden ?? 0,
  activo: detail?.activo ?? true,
  imagen: null,
  adjuntoPdf: null,
});

/**
 * Solo incluye los campos "dirty" del formulario en el payload de PATCH.
 * `imagen`/`adjuntoPdf` solo se incluyen si el usuario seleccionó un
 * archivo nuevo (si no, el backend conserva el archivo existente).
 */
export const buildUpdateAnuncioPayload = (
  values: AnuncioFormValues,
  dirtyFields: Partial<Record<keyof AnuncioFormValues, boolean>>,
): Partial<AnuncioFormValues> => {
  const payload: Partial<AnuncioFormValues> = {};

  if (dirtyFields.titulo) payload.titulo = values.titulo.trim();
  if (dirtyFields.descripcion) payload.descripcion = values.descripcion;
  if (dirtyFields.enlaceUrl) payload.enlaceUrl = values.enlaceUrl;
  if (dirtyFields.vigenciaDesde) payload.vigenciaDesde = values.vigenciaDesde;
  if (dirtyFields.vigenciaHasta) payload.vigenciaHasta = values.vigenciaHasta;
  if (dirtyFields.orden) payload.orden = values.orden;
  if (dirtyFields.activo) payload.activo = values.activo;
  if (values.imagen) payload.imagen = values.imagen;
  if (values.adjuntoPdf) payload.adjuntoPdf = values.adjuntoPdf;

  return payload;
};

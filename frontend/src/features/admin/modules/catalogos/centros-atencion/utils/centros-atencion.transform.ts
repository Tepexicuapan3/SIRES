import type {
  CentroAtencionDetail,
  CreateCentroAtencionRequest,
  UpdateCentroAtencionRequest,
  CentroAtencionHorarioDetail,
  CreateCentroAtencionHorarioRequest,
  UpdateCentroAtencionHorarioRequest,
} from "@api/types";

import type {
  CentroAtencionDetailsFormValues,
  CreateCentroAtencionFormValues,
  UpdateCentroAtencionFormValues,
  CentroAtencionHorarioFormValues,
  CreateCentroAtencionHorarioFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";

// =============================================================================
// HELPERS
// =============================================================================

const normalizeNullableText = (value?: string | null): string | null => {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
};

const normalizeCode = (value: string) => value.trim().toUpperCase();
const normalizeCenterType = (value: string) => value.trim().toUpperCase();

const normalizeTime = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.length === 5 ? `${normalized}:00` : normalized;
};

// =============================================================================
// CENTROS DE ATENCION - API -> FORM
// =============================================================================

export const mapCentroAtencionDetailToFormValues = (
  detail?: CentroAtencionDetail | null,
): CentroAtencionDetailsFormValues => ({
  name: detail?.name ?? "",
  code: detail?.code ?? "",
  centerType: detail?.centerType ?? "CLINICA",
  legacyFolio: detail?.legacyFolio ?? null,
  isExternal: detail?.isExternal ?? false,

  address: detail?.address ?? null,
  postalCode: detail?.postalCode ?? null,
  neighborhood: detail?.neighborhood ?? null,
  municipality: detail?.municipality ?? null,
  state: detail?.state ?? null,
  city: detail?.city ?? null,
  phone: detail?.phone ?? null,

  isActive: detail?.isActive ?? true,
});

// =============================================================================
// CENTROS DE ATENCION - FORM -> API
// =============================================================================

export const buildCreateCentroAtencionPayload = (
  values: CreateCentroAtencionFormValues,
): CreateCentroAtencionRequest => ({
  name: values.name.trim(),
  code: normalizeCode(values.code),
  centerType: normalizeCenterType(values.centerType) as "CLINICA" | "HOSPITAL",
  legacyFolio: normalizeNullableText(values.legacyFolio),
  isExternal: values.isExternal,

  address: normalizeNullableText(values.address),
  postalCode: normalizeNullableText(values.postalCode),
  neighborhood: normalizeNullableText(values.neighborhood),
  municipality: normalizeNullableText(values.municipality),
  state: normalizeNullableText(values.state),
  city: normalizeNullableText(values.city),
  phone: normalizeNullableText(values.phone),

  isActive: values.isActive,
});

export const buildUpdateCentroAtencionPayload = (
  values: UpdateCentroAtencionFormValues,
  dirtyFields: Partial<Record<keyof CentroAtencionDetailsFormValues, boolean>>,
): UpdateCentroAtencionRequest => {
  const payload: UpdateCentroAtencionRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  if (dirtyFields.code && values.code !== undefined) {
    payload.code = normalizeCode(values.code);
  }

  if (dirtyFields.centerType && values.centerType !== undefined) {
    payload.centerType = normalizeCenterType(values.centerType) as
      | "CLINICA"
      | "HOSPITAL";
  }

  if (dirtyFields.legacyFolio) {
    payload.legacyFolio = normalizeNullableText(values.legacyFolio);
  }

  if (dirtyFields.isExternal && values.isExternal !== undefined) {
    payload.isExternal = values.isExternal;
  }

  if (dirtyFields.address) {
    payload.address = normalizeNullableText(values.address);
  }

  if (dirtyFields.postalCode) {
    payload.postalCode = normalizeNullableText(values.postalCode);
  }

  if (dirtyFields.neighborhood) {
    payload.neighborhood = normalizeNullableText(values.neighborhood);
  }

  if (dirtyFields.municipality) {
    payload.municipality = normalizeNullableText(values.municipality);
  }

  if (dirtyFields.state) {
    payload.state = normalizeNullableText(values.state);
  }

  if (dirtyFields.city) {
    payload.city = normalizeNullableText(values.city);
  }

  if (dirtyFields.phone) {
    payload.phone = normalizeNullableText(values.phone);
  }

  if (dirtyFields.isActive && values.isActive !== undefined) {
    payload.isActive = values.isActive;
  }

  return payload;
};

// =============================================================================
// HORARIOS - API -> FORM
// =============================================================================

export const mapCentroAtencionHorarioDetailToFormValues = (
  detail?: CentroAtencionHorarioDetail | null,
): CentroAtencionHorarioFormValues => ({
  centerId: detail?.center?.id ?? 0,
  shiftId: detail?.shift?.id ?? 0,
  weekDay: detail?.weekDay ?? 1,
  isOpen: detail?.isOpen ?? true,
  is24Hours: detail?.is24Hours ?? false,
  openingTime: detail?.openingTime ?? null,
  closingTime: detail?.closingTime ?? null,
  observations: detail?.observations ?? null,
  isActive: detail?.isActive ?? true,
});

// =============================================================================
// HORARIOS - FORM -> API
// =============================================================================

export const buildCreateCentroAtencionHorarioPayload = (
  values: CreateCentroAtencionHorarioFormValues,
): CreateCentroAtencionHorarioRequest => ({
  centerId: values.centerId,
  shiftId: values.shiftId,
  weekDay: values.weekDay,
  isOpen: values.isOpen,
  is24Hours: values.is24Hours,
  openingTime: normalizeTime(values.openingTime),
  closingTime: normalizeTime(values.closingTime),
  observations: normalizeNullableText(values.observations),
  isActive: values.isActive,
});

export const buildUpdateCentroAtencionHorarioPayload = (
  values: Partial<CentroAtencionHorarioFormValues>,
  dirtyFields: Partial<Record<keyof CentroAtencionHorarioFormValues, boolean>>,
): UpdateCentroAtencionHorarioRequest => {
  const payload: UpdateCentroAtencionHorarioRequest = {};

  if (dirtyFields.centerId && values.centerId !== undefined) {
    payload.centerId = values.centerId;
  }

  if (dirtyFields.shiftId && values.shiftId !== undefined) {
    payload.shiftId = values.shiftId;
  }

  if (dirtyFields.weekDay && values.weekDay !== undefined) {
    payload.weekDay = values.weekDay;
  }

  if (dirtyFields.isOpen && values.isOpen !== undefined) {
    payload.isOpen = values.isOpen;
  }

  if (dirtyFields.is24Hours && values.is24Hours !== undefined) {
    payload.is24Hours = values.is24Hours;
  }

  if (dirtyFields.openingTime) {
    payload.openingTime = normalizeTime(values.openingTime);
  }

  if (dirtyFields.closingTime) {
    payload.closingTime = normalizeTime(values.closingTime);
  }

  if (dirtyFields.observations) {
    payload.observations = normalizeNullableText(values.observations);
  }

  if (dirtyFields.isActive && values.isActive !== undefined) {
    payload.isActive = values.isActive;
  }

  return payload;
};
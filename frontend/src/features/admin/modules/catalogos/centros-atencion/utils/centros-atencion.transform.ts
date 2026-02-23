import type {
  CentroAtencionDetail,
  CreateCentroAtencionRequest,
  UpdateCentroAtencionRequest,
} from "@api/types";
import type {
  CentroAtencionDetailsFormValues,
  CreateCentroAtencionFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";

const normalizeFolioCode = (value: string) => value.trim().toUpperCase();

const buildSchedulePayload = (values: {
  morningStartsAt: string;
  morningEndsAt: string;
  afternoonStartsAt: string;
  afternoonEndsAt: string;
  nightStartsAt: string;
  nightEndsAt: string;
}) => ({
  morning: {
    startsAt: values.morningStartsAt,
    endsAt: values.morningEndsAt,
  },
  afternoon: {
    startsAt: values.afternoonStartsAt,
    endsAt: values.afternoonEndsAt,
  },
  night: {
    startsAt: values.nightStartsAt,
    endsAt: values.nightEndsAt,
  },
});

export const mapCentroAtencionDetailToFormValues = (
  detail?: CentroAtencionDetail | null,
): CentroAtencionDetailsFormValues => ({
  name: detail?.name ?? "",
  folioCode: detail?.folioCode ?? "",
  address: detail?.address ?? "",
  isExternal: detail?.isExternal ?? false,
  morningStartsAt: detail?.schedule.morning.startsAt ?? "07:00",
  morningEndsAt: detail?.schedule.morning.endsAt ?? "14:00",
  afternoonStartsAt: detail?.schedule.afternoon.startsAt ?? "14:00",
  afternoonEndsAt: detail?.schedule.afternoon.endsAt ?? "20:00",
  nightStartsAt: detail?.schedule.night.startsAt ?? "20:00",
  nightEndsAt: detail?.schedule.night.endsAt ?? "23:00",
});

export const buildCreateCentroAtencionPayload = (
  values: CreateCentroAtencionFormValues,
): CreateCentroAtencionRequest => ({
  name: values.name.trim(),
  folioCode: normalizeFolioCode(values.folioCode),
  isExternal: values.isExternal,
  address: values.address.trim(),
  schedule: buildSchedulePayload(values),
});

export const buildUpdateCentroAtencionPayload = (
  values: CentroAtencionDetailsFormValues,
  dirtyFields: Partial<Record<keyof CentroAtencionDetailsFormValues, boolean>>,
): UpdateCentroAtencionRequest => {
  const payload: UpdateCentroAtencionRequest = {};

  if (dirtyFields.name) payload.name = values.name.trim();
  if (dirtyFields.folioCode)
    payload.folioCode = normalizeFolioCode(values.folioCode);
  if (dirtyFields.address) payload.address = values.address.trim();
  if (dirtyFields.isExternal) payload.isExternal = values.isExternal;

  const hasScheduleChanges =
    Boolean(dirtyFields.morningStartsAt) ||
    Boolean(dirtyFields.morningEndsAt) ||
    Boolean(dirtyFields.afternoonStartsAt) ||
    Boolean(dirtyFields.afternoonEndsAt) ||
    Boolean(dirtyFields.nightStartsAt) ||
    Boolean(dirtyFields.nightEndsAt);

  if (hasScheduleChanges) {
    payload.schedule = buildSchedulePayload(values);
  }

  return payload;
};

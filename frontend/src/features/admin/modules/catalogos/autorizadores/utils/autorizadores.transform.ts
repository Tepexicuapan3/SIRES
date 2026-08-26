import type {
  AutorizadorDetail,
  CreateAutorizadorRequest,
  UpdateAutorizadorRequest,
} from "@api/types";
import type {
  AutorizadorDetailsFormValues,
  CreateAutorizadorFormValues,
} from "@features/admin/modules/catalogos/autorizadores/domain/autorizadores.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapAutorizadorDetailToFormValues = (
  detail?: AutorizadorDetail | null,
): AutorizadorDetailsFormValues => ({
  name: detail?.name ?? "",
  position: detail?.position ?? "",
  centerId: detail?.center?.id ?? 0,
  authorizationTypeId: detail?.authorizationType?.id ?? 0,
  userId: detail?.user?.id ?? 0,
  authorizerPassword: "",
  fileNumber: detail?.fileNumber ?? "",
  signatureImage: detail?.signatureImage ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateAutorizadorPayload = (
  values: CreateAutorizadorFormValues,
): CreateAutorizadorRequest => ({
  name: values.name.trim(),
  position: values.position.trim(),
  centerId: values.centerId,
  authorizationTypeId: values.authorizationTypeId,
  userId: values.userId,
  authorizerPassword: values.authorizerPassword.trim(),
  fileNumber: values.fileNumber?.trim() || undefined,
  signatureImage: values.signatureImage?.trim() || undefined,
});

export const buildUpdateAutorizadorPayload = (
  values: AutorizadorDetailsFormValues,
  dirtyFields: Partial<Record<keyof AutorizadorDetailsFormValues, boolean>>,
): UpdateAutorizadorRequest => {
  const payload: UpdateAutorizadorRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  if (dirtyFields.position && values.position !== undefined) {
    payload.position = values.position.trim();
  }

  if (dirtyFields.centerId && values.centerId !== undefined) {
    payload.centerId = values.centerId;
  }

  if (dirtyFields.authorizationTypeId && values.authorizationTypeId !== undefined) {
    payload.authorizationTypeId = values.authorizationTypeId;
  }

  if (dirtyFields.userId && values.userId !== undefined) {
    payload.userId = values.userId;
  }

  if (dirtyFields.fileNumber && values.fileNumber !== undefined) {
    payload.fileNumber = values.fileNumber.trim() || undefined;
  }

  if (dirtyFields.signatureImage && values.signatureImage !== undefined) {
    payload.signatureImage = values.signatureImage.trim() || undefined;
  }

  // La contraseña solo se envia si el usuario efectivamente escribio algo:
  // el backend no la devuelve en el detalle (write-only), asi que el campo
  // siempre arranca vacio y "dirty" no aplica bien aca.
  if (values.authorizerPassword && values.authorizerPassword.trim().length > 0) {
    payload.authorizerPassword = values.authorizerPassword.trim();
  }

  return payload;
};

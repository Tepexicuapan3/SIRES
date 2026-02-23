import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissionsCatalog } from "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog";
import { UserDetailsFooter } from "@features/admin/modules/rbac/users/components/UserDetailsFooter";
import { UserDetailsGeneralTab } from "@features/admin/modules/rbac/users/components/UserDetailsGeneralTab";
import { UserDetailsPermissionsTab } from "@features/admin/modules/rbac/users/components/UserDetailsPermissionsTab";
import { UserDetailsRolesTab } from "@features/admin/modules/rbac/users/components/UserDetailsRolesTab";
import { UserDetailsSidePanel } from "@features/admin/modules/rbac/users/components/UserDetailsSidePanel";
import { UserDialogHeader } from "@features/admin/modules/rbac/users/components/UserDialogHeader";
import {
  userDetailsSchema,
  type UserDetailsFormValues,
} from "@features/admin/modules/rbac/users/domain/users.schemas";
import { useAddUserOverride } from "@features/admin/modules/rbac/users/mutations/useAddUserOverride";
import { useActivateUser } from "@features/admin/modules/rbac/users/mutations/useActivateUser";
import { useAssignRoles } from "@features/admin/modules/rbac/users/mutations/useAssignRoles";
import { useDeactivateUser } from "@features/admin/modules/rbac/users/mutations/useDeactivateUser";
import { useRemoveUserOverride } from "@features/admin/modules/rbac/users/mutations/useRemoveUserOverride";
import { useRevokeUserRole } from "@features/admin/modules/rbac/users/mutations/useRevokeUserRole";
import { useSetPrimaryRole } from "@features/admin/modules/rbac/users/mutations/useSetPrimaryRole";
import { useUpdateUser } from "@features/admin/modules/rbac/users/mutations/useUpdateUser";
import { useUserDetail } from "@features/admin/modules/rbac/users/queries/useUserDetail";
import {
  areUserOverridesEquivalent,
  areUserRolesEquivalent,
  buildUserOverridesDiff,
  buildUserRolesDiff,
} from "@features/admin/modules/rbac/users/utils/users.access-draft";
import {
  buildUserProfilePayload,
  addOverrideToDraft,
  addRoleToDraft,
  hasUserProfileChanges,
  mapUserDetailToFormValues,
  removeOverrideFromDraft,
  removeRoleFromDraft,
  setOverrideDateInDraft,
  setPrimaryRoleInDraft,
  toggleOverrideEffectInDraft,
} from "@features/admin/modules/rbac/users/utils/users.details-draft";
import { getUserErrorMessage } from "@features/admin/modules/rbac/users/utils/users.feedback";
import {
  applyUserDetailsSavePlan,
  hasUserDetailsChanges,
} from "@features/admin/modules/rbac/users/utils/users.details-save";
import {
  formatDateTime,
  resolveUserUiStatus,
} from "@features/admin/modules/rbac/users/utils/users.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type {
  CentroAtencionListItem,
  RoleListItem,
  UserListItem,
  UserOverride,
  UserRole,
} from "@api/types";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  userSummary: UserListItem | null;
  roleOptions: RoleListItem[];
  clinicOptions: CentroAtencionListItem[];
  isClinicsCatalogLoading?: boolean;
  canEdit: boolean;
  canReadRolesCatalog?: boolean;
  canReadPermissionsCatalog?: boolean;
  currentUserId?: number | null;
}

const DEFAULT_FORM_VALUES: UserDetailsFormValues = {
  firstName: "",
  paternalName: "",
  maternalName: "",
  email: "",
  clinicId: null,
};

const DRAFT_ASSIGNER = {
  id: 0,
  name: "Tu (ahora)",
} as const;

const FORM_ID = "user-details-form";

export function UserDetailsDialog({
  open,
  onOpenChange,
  onClose,
  userSummary,
  roleOptions,
  clinicOptions,
  isClinicsCatalogLoading = false,
  canEdit,
  canReadRolesCatalog = true,
  canReadPermissionsCatalog = true,
  currentUserId = null,
}: UserDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const userId = userSummary?.id;
  const {
    data: userDetailResponse,
    isLoading,
    isError,
    error: userDetailError,
    refetch,
  } = useUserDetail(userId, open && Boolean(userId));
  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
    isError: isPermissionsCatalogError,
    error: permissionsCatalogError,
    refetch: refetchPermissionsCatalog,
  } = usePermissionsCatalog(open && canReadPermissionsCatalog);

  const userDetail = userDetailResponse?.user;
  const roles = userDetailResponse?.roles ?? [];
  const overrides = userDetailResponse?.overrides ?? [];

  const updateUser = useUpdateUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const assignRoles = useAssignRoles();
  const setPrimaryRole = useSetPrimaryRole();
  const revokeUserRole = useRevokeUserRole();
  const addUserOverride = useAddUserOverride();
  const removeUserOverride = useRemoveUserOverride();

  const [draftRoles, setDraftRoles] = useState<UserRole[]>([]);
  const [draftOverrides, setDraftOverrides] = useState<UserOverride[]>([]);
  const [draftAccountIsActive, setDraftAccountIsActive] = useState<
    boolean | null
  >(null);
  const [draftUserId, setDraftUserId] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const draftOverrideIdRef = useRef(-1);

  const form = useForm<UserDetailsFormValues>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const formStateIsDirty = form.formState.isDirty;
  const [
    draftFirstName,
    draftPaternalName,
    draftMaternalName,
    draftEmail,
    draftClinicId,
  ] = form.watch([
    "firstName",
    "paternalName",
    "maternalName",
    "email",
    "clinicId",
  ]);

  const watchedFormValues: UserDetailsFormValues = {
    firstName: draftFirstName ?? "",
    paternalName: draftPaternalName ?? "",
    maternalName: draftMaternalName ?? "",
    email: draftEmail ?? "",
    clinicId: draftClinicId ?? null,
  };
  const baselineFormValues = userDetail
    ? mapUserDetailToFormValues(userDetail)
    : DEFAULT_FORM_VALUES;
  const isFormDirty = userDetail
    ? hasUserProfileChanges(baselineFormValues, watchedFormValues)
    : false;

  const hasDraftForCurrentUser =
    userDetail !== undefined && draftUserId === userDetail.id;
  const workingRoles = hasDraftForCurrentUser ? draftRoles : roles;
  const workingOverrides = hasDraftForCurrentUser ? draftOverrides : overrides;
  const workingAccountIsActive = hasDraftForCurrentUser
    ? (draftAccountIsActive ?? userDetail?.isActive ?? false)
    : (userDetail?.isActive ?? false);
  const viewedUserId = userDetail?.id ?? userSummary?.id ?? null;
  const isSelfUser = viewedUserId !== null && currentUserId === viewedUserId;

  const rolesDirty = userDetail
    ? !areUserRolesEquivalent(roles, workingRoles)
    : false;
  const overridesDirty = userDetail
    ? !areUserOverridesEquivalent(overrides, workingOverrides)
    : false;
  const accountStatusDirty = userDetail
    ? workingAccountIsActive !== userDetail.isActive
    : false;
  const isDirty =
    isFormDirty || rolesDirty || overridesDirty || accountStatusDirty;

  useEffect(() => {
    if (!userDetail || !open || formStateIsDirty) return;
    form.reset(mapUserDetailToFormValues(userDetail));
  }, [form, formStateIsDirty, open, userDetail]);

  useEffect(() => {
    if (!open || !userDetailResponse) return;
    setDraftUserId(userDetailResponse.user.id);
    setDraftRoles(userDetailResponse.roles);
    setDraftOverrides(userDetailResponse.overrides);
    setDraftAccountIsActive(userDetailResponse.user.isActive);
  }, [open, userDetailResponse]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      userDetail ? mapUserDetailToFormValues(userDetail) : DEFAULT_FORM_VALUES,
    );
    setDraftRoles([]);
    setDraftOverrides([]);
    setDraftAccountIsActive(null);
    setDraftUserId(null);
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !userDetail));

  const isEditable = canEdit;
  const readOnlyUserMessage =
    "Solo lectura: no puedes actualizar este usuario porque no tienes permisos.";
  const roleCatalogAccessMessage = canReadRolesCatalog
    ? null
    : "No tienes acceso al catalogo de roles. Puedes gestionar solo los roles ya asignados.";
  const permissionsCatalogAccessMessage = canReadPermissionsCatalog
    ? null
    : "No tienes acceso al catalogo de permisos. Puedes gestionar solo los overrides existentes.";

  const isAccessMutating =
    assignRoles.isPending ||
    setPrimaryRole.isPending ||
    revokeUserRole.isPending ||
    addUserOverride.isPending ||
    removeUserOverride.isPending;
  const isStatusMutating = activateUser.isPending || deactivateUser.isPending;
  const isSaving =
    isSavingAll || updateUser.isPending || isAccessMutating || isStatusMutating;

  const handleAccountStatusChangeDraft = (nextActive: boolean) => {
    if (!isEditable || !userDetail) return;
    if (isSelfUser && !nextActive) {
      toast.error("No puedes desactivar tu propia cuenta", {
        description:
          "Usa otra cuenta administradora para cambiar el estado de este usuario.",
      });
      return;
    }

    setDraftUserId(userDetail.id);
    setDraftAccountIsActive(nextActive);
  };

  const handleAddRoleDraft = (roleId: number) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftRoles((previousRoles) => {
      const baseRoles = hasDraftForCurrentUser ? previousRoles : roles;
      return addRoleToDraft(baseRoles, roleOptions, roleId, DRAFT_ASSIGNER);
    });
  };

  const handleSetPrimaryRoleDraft = (roleId: number) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftRoles((previousRoles) => {
      const baseRoles = hasDraftForCurrentUser ? previousRoles : roles;
      return setPrimaryRoleInDraft(baseRoles, roleId, DRAFT_ASSIGNER);
    });
  };

  const handleRemoveRoleDraft = (roleId: number) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftRoles((previousRoles) => {
      const baseRoles = hasDraftForCurrentUser ? previousRoles : roles;
      return removeRoleFromDraft(baseRoles, roleId);
    });
  };

  const handleAddOverrideDraft = (permissionCode: string) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftOverrides((previousOverrides) => {
      const baseOverrides = hasDraftForCurrentUser
        ? previousOverrides
        : overrides;

      const draftResult = addOverrideToDraft({
        baseOverrides,
        permissions: permissionsData?.items ?? [],
        permissionCode,
        nextOverrideId: draftOverrideIdRef.current,
        assigner: DRAFT_ASSIGNER,
      });
      draftOverrideIdRef.current = draftResult.nextOverrideId;
      return draftResult.overrides;
    });
  };

  const handleToggleOverrideDraft = (permissionCode: string) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftOverrides((previousOverrides) => {
      const baseOverrides = hasDraftForCurrentUser
        ? previousOverrides
        : overrides;
      return toggleOverrideEffectInDraft(baseOverrides, permissionCode);
    });
  };

  const handleOverrideDateDraft = (permissionCode: string, value: string) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftOverrides((previousOverrides) => {
      const baseOverrides = hasDraftForCurrentUser
        ? previousOverrides
        : overrides;
      return setOverrideDateInDraft(baseOverrides, permissionCode, value);
    });
  };

  const handleRemoveOverrideDraft = (permissionCode: string) => {
    if (!isEditable || !userDetail) return;

    setDraftUserId(userDetail.id);
    setDraftOverrides((previousOverrides) => {
      const baseOverrides = hasDraftForCurrentUser
        ? previousOverrides
        : overrides;
      return removeOverrideFromDraft(baseOverrides, permissionCode);
    });
  };

  const syncDraftStateFromServer = (nextData?: typeof userDetailResponse) => {
    if (!nextData) return false;

    form.reset(mapUserDetailToFormValues(nextData.user));
    setDraftUserId(nextData.user.id);
    setDraftRoles(nextData.roles);
    setDraftOverrides(nextData.overrides);
    setDraftAccountIsActive(nextData.user.isActive);
    return true;
  };

  const handleSave = async (values: UserDetailsFormValues) => {
    if (!userDetail || !isEditable || isSaving) return;

    const payload = buildUserProfilePayload(
      mapUserDetailToFormValues(userDetail),
      values,
    );

    const rolesDiff = buildUserRolesDiff(roles, workingRoles);
    const overridesDiff = buildUserOverridesDiff(overrides, workingOverrides);
    const hasStatusChanges = workingAccountIsActive !== userDetail.isActive;

    if (isSelfUser && hasStatusChanges && !workingAccountIsActive) {
      toast.error("No puedes desactivar tu propia cuenta", {
        description:
          "Usa otra cuenta administradora para cambiar el estado de este usuario.",
      });
      return;
    }

    const savePlan = {
      profilePayload: payload,
      hasStatusChanges,
      nextIsActive: workingAccountIsActive,
      rolesDiff,
      overridesDiff,
    };

    if (!hasUserDetailsChanges(savePlan)) {
      return;
    }

    setIsSavingAll(true);
    let completedGroups = 0;

    try {
      completedGroups = await applyUserDetailsSavePlan(savePlan, {
        updateProfile: (profilePayload) =>
          updateUser.mutateAsync({
            userId: userDetail.id,
            data: profilePayload,
          }),
        activateUser: () => activateUser.mutateAsync({ userId: userDetail.id }),
        deactivateUser: () =>
          deactivateUser.mutateAsync({ userId: userDetail.id }),
        assignRoles: (roleIds) =>
          assignRoles.mutateAsync({
            userId: userDetail.id,
            data: { roleIds },
          }),
        setPrimaryRole: (roleId) =>
          setPrimaryRole.mutateAsync({
            userId: userDetail.id,
            data: { roleId },
          }),
        revokeRole: (roleId) =>
          revokeUserRole.mutateAsync({ userId: userDetail.id, roleId }),
        upsertOverride: (overridePayload) =>
          addUserOverride.mutateAsync({
            userId: userDetail.id,
            data: overridePayload,
          }),
        removeOverride: (permissionCode) =>
          removeUserOverride.mutateAsync({
            userId: userDetail.id,
            permissionCode,
          }),
      });

      const refreshedDetail = await refetch();
      const refreshedData = refreshedDetail.data;

      if (!syncDraftStateFromServer(refreshedData)) {
        form.reset(values);
      }

      toast.success("Cambios guardados", {
        description:
          "Perfil, estado de cuenta, roles y permisos actualizados correctamente.",
      });
    } catch (error) {
      const fallbackMessage =
        completedGroups > 0
          ? "Se aplicaron cambios parciales. Revisa el detalle y vuelve a intentar."
          : "No se pudieron guardar los cambios del usuario.";

      toast.error("No se pudieron guardar todos los cambios", {
        description: getUserErrorMessage(error, fallbackMessage),
      });

      try {
        const refreshedDetail = await refetch();
        syncDraftStateFromServer(refreshedDetail.data);
      } catch {
        // Si el refetch falla, mantenemos estado local actual para no bloquear al usuario.
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  const avatarUrl = (userSummary as { avatarUrl?: string | null })?.avatarUrl;
  const title =
    userDetail?.fullname ||
    userSummary?.fullname ||
    userSummary?.username ||
    "Usuario";
  const username = userDetail?.username || userSummary?.username || null;
  const subtitle = userDetail?.email || userSummary?.email || null;
  const primaryRoleLabel =
    userDetail?.primaryRole || userSummary?.primaryRole || "Sin rol";
  const clinicLabel =
    userDetail?.clinic?.name || userSummary?.clinic?.name || "-";
  const rolesCount = workingRoles.length;
  const overridesCount = workingOverrides.length;

  const statusSource = userDetail
    ? {
        isActive: workingAccountIsActive,
        termsAccepted: userDetail.termsAccepted,
        mustChangePassword: userDetail.mustChangePassword,
      }
    : userSummary;
  const uiStatus = statusSource ? resolveUserUiStatus(statusSource) : null;

  const statusBadge =
    uiStatus === "pending" ? (
      <Badge variant="alert" className="gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-status-alert" />
        Pendiente
      </Badge>
    ) : uiStatus === "active" ? (
      <Badge variant="stable" className="gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-status-stable" />
        Activo
      </Badge>
    ) : uiStatus === "inactive" ? (
      <Badge variant="secondary" className="gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-txt-muted" />
        Inactivo
      </Badge>
    ) : null;

  const lastLoginLabel = formatDateTime(userDetail?.lastLoginAt);
  const lastIpLabel = userDetail?.lastIp ?? "-";
  const createdByLabel = userDetail
    ? `${userDetail.createdBy?.name ?? "-"} ${formatDateTime(userDetail.createdAt)}`
    : "-";
  const updatedByLabel = userDetail
    ? `${userDetail.updatedBy?.name ?? "-"} ${formatDateTime(userDetail.updatedAt)}`
    : "-";

  const loadingContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`tab-skel-${index}`} className="h-9 w-28" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`field-skel-${index}`} className="h-12" />
        ))}
      </div>
    </div>
  );

  const errorContent = (
    <div className="rounded-2xl border border-line-struct bg-paper p-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-critical/10 text-status-critical">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-txt-body">
        No se pudo cargar el usuario
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getUserErrorMessage(
          userDetailError,
          "Intenta nuevamente para ver el detalle completo.",
        )}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => void refetch()}
      >
        Reintentar
      </Button>
    </div>
  );

  const sections: AdminDetailsDialogSection[] = userDetail
    ? [
        {
          id: "general",
          label: "General",
          icon: <UserRound className="size-4" />,
          content: (
            <>
              <UserDetailsGeneralTab
                form={form}
                formId={FORM_ID}
                clinicOptions={clinicOptions}
                isClinicsCatalogLoading={isClinicsCatalogLoading}
                userDetail={userDetail}
                accountIsActive={workingAccountIsActive}
                onSubmit={handleSave}
                onAccountStatusChange={handleAccountStatusChangeDraft}
                isEditable={isEditable}
                canChangeAccountStatus={isEditable && !isSelfUser}
              />
              {!isEditable ? (
                <AdminReadOnlyNotice
                  className="mt-4"
                  message={readOnlyUserMessage}
                />
              ) : null}
            </>
          ),
        },
        {
          id: "roles",
          label: "Roles",
          icon: <ShieldCheck className="size-4" />,
          badge: (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 rounded-full px-1 text-[10px]"
            >
              {rolesCount}
            </Badge>
          ),
          content: (
            <UserDetailsRolesTab
              roles={workingRoles}
              roleOptions={roleOptions}
              isEditable={isEditable}
              readOnlyMessage={readOnlyUserMessage}
              catalogAccessMessage={roleCatalogAccessMessage}
              isSaving={isSaving}
              onAddRole={handleAddRoleDraft}
              onSetPrimaryRole={handleSetPrimaryRoleDraft}
              onRemoveRole={handleRemoveRoleDraft}
            />
          ),
        },
        {
          id: "permissions",
          label: "Permisos",
          icon: <ShieldAlert className="size-4" />,
          badge: (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 rounded-full px-1 text-[10px]"
            >
              {overridesCount}
            </Badge>
          ),
          content: (
            <UserDetailsPermissionsTab
              overrides={workingOverrides}
              permissions={permissionsData?.items ?? []}
              isLoadingPermissions={isLoadingPermissions}
              isEditable={isEditable}
              readOnlyMessage={readOnlyUserMessage}
              isSaving={isSaving}
              catalogAccessMessage={permissionsCatalogAccessMessage}
              catalogErrorMessage={
                canReadPermissionsCatalog && isPermissionsCatalogError
                  ? getUserErrorMessage(
                      permissionsCatalogError,
                      "No se pudo cargar el catalogo de permisos. Verifica que tengas admin:gestion:permisos:read.",
                    )
                  : null
              }
              onRetryCatalog={
                canReadPermissionsCatalog
                  ? () => {
                      void refetchPermissionsCatalog();
                    }
                  : undefined
              }
              onAddOverride={handleAddOverrideDraft}
              onToggleOverride={handleToggleOverrideDraft}
              onOverrideDateChange={handleOverrideDateDraft}
              onRemoveOverride={handleRemoveOverrideDraft}
            />
          ),
        },
      ]
    : [];

  return (
    <AdminDetailsDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      onRequestClose={closeDialog}
      titleSrOnly="Detalle de usuario"
      descriptionSrOnly="Gestiona perfil, roles y permisos desde un solo lugar."
      sidePanel={
        userSummary || userDetail ? (
          <UserDetailsSidePanel
            fullname={title}
            username={username}
            email={subtitle}
            avatarUrl={avatarUrl}
            status={statusBadge}
            primaryRole={primaryRoleLabel}
            clinicName={clinicLabel}
            termsAccepted={userDetail?.termsAccepted}
            mustChangePassword={userDetail?.mustChangePassword}
            lastLoginLabel={lastLoginLabel}
            lastIpLabel={lastIpLabel}
            createdByLabel={createdByLabel}
            updatedByLabel={updatedByLabel}
          />
        ) : null
      }
      sidePanelClassName="hidden min-h-0 w-[292px] shrink-0 border-r border-line-struct/70 bg-subtle/20 lg:flex"
      splitBodyClassName="flex h-full min-h-0"
      header={
        userSummary || userDetail ? (
          <div className="lg:hidden">
            <UserDialogHeader
              title={title}
              subtitle={subtitle}
              avatarUrl={avatarUrl}
              status={statusBadge}
              fallbackLabel={userSummary?.username || "Usuario"}
            />
          </div>
        ) : null
      }
      headerClassName="px-5 pt-5 lg:px-8 lg:pt-5"
      scrollAreaClassName="min-h-0 flex-1 px-5 pb-8 lg:px-8 lg:pb-10"
      contentClassName="min-w-0 space-y-5 overflow-x-auto pt-0"
      tabsContainerClassName="gap-3"
      tabsListClassName="h-auto w-full items-center gap-1 rounded-full border border-line-struct/60 bg-subtle/30 p-1"
      tabsTriggerClassName="h-8 min-w-0 flex-1 rounded-full border-0 px-3 text-sm font-semibold text-txt-muted shadow-none hover:text-txt-body data-[state=active]:bg-paper data-[state=active]:text-txt-body data-[state=active]:shadow-sm"
      tabsContentClassName="pt-5"
      isDirty={isDirty}
      isLoading={shouldShowLoading}
      isError={shouldShowError}
      loadingContent={loadingContent}
      errorContent={errorContent}
      sections={sections}
      defaultSectionId="general"
      dialogContentClassName="h-[70vh] max-h-[70vh] w-[96vw] max-w-none overflow-hidden rounded-3xl bg-paper p-0 sm:max-w-none lg:w-[980px] xl:w-[1060px]"
      showCloseButton={false}
      footer={({ onCancel }) => (
        <UserDetailsFooter
          isDirty={isDirty}
          isSaving={isSaving}
          formId={FORM_ID}
          onCancel={onCancel}
          onSave={() => {
            void form.handleSubmit(handleSave)();
          }}
          disableSave={!isEditable}
        />
      )}
    />
  );
}

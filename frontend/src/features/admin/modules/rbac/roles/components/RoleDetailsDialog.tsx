import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissionsCatalog } from "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog";
import { RoleDetailsAuditTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsAuditTab";
import { RoleDetailsGeneralTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsGeneralTab";
import { RoleDetailsFooter } from "@features/admin/modules/rbac/roles/components/RoleDetailsFooter";
import { RoleDetailsPermissionsTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsPermissionsTab";
import { RoleDetailsSidePanel } from "@features/admin/modules/rbac/roles/components/RoleDetailsSidePanel";
import { RoleDialogHeader } from "@features/admin/modules/rbac/roles/components/RoleDialogHeader";
import {
  roleDetailsSchema,
  type RoleDetailsFormValues,
} from "@features/admin/modules/rbac/roles/domain/roles.schemas";
import { useAssignRolePermissions } from "@features/admin/modules/rbac/roles/mutations/useAssignRolePermissions";
import { useUpdateRole } from "@features/admin/modules/rbac/roles/mutations/useUpdateRole";
import { useRoleDetail } from "@features/admin/modules/rbac/roles/queries/useRoleDetail";
import {
  addPermissionToDraft,
  arePermissionSetsDifferent,
  mapRoleDetailToFormValues,
  removePermissionFromDraft,
} from "@features/admin/modules/rbac/roles/utils/roles.details-draft";
import {
  applyRoleDetailsSavePlan,
  hasRoleDetailsChanges,
} from "@features/admin/modules/rbac/roles/utils/roles.details-save";
import { getRoleErrorMessage } from "@features/admin/modules/rbac/roles/utils/roles.feedback";
import { formatDateTime } from "@features/admin/modules/rbac/roles/utils/roles.format";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { RoleListItem, UpdateRoleRequest } from "@api/types";

interface RoleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  roleSummary: RoleListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: RoleDetailsFormValues = {
  name: "",
  description: "",
  landingRoute: "",
};

const FORM_ID = "role-details-form";

export function RoleDetailsDialog({
  open,
  onOpenChange,
  onClose,
  roleSummary,
  canEdit,
}: RoleDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const roleId = roleSummary?.id;
  const {
    data: roleDetailResponse,
    isLoading,
    isError,
    error: roleDetailError,
    refetch,
  } = useRoleDetail(roleId, open && Boolean(roleId));
  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
    isError: isPermissionsCatalogError,
    error: permissionsCatalogError,
    refetch: refetchPermissionsCatalog,
  } = usePermissionsCatalog(open);

  const roleDetail = roleDetailResponse?.role;
  const assignedPermissions = roleDetailResponse?.permissions ?? [];
  const permissionCatalog = permissionsData?.items ?? [];

  const updateRole = useUpdateRole();
  const assignPermissions = useAssignRolePermissions();

  const [draftRoleId, setDraftRoleId] = useState<number | null>(null);
  const [draftIsActive, setDraftIsActive] = useState<boolean>(
    roleSummary?.isActive ?? true,
  );
  const [draftPermissions, setDraftPermissions] = useState<
    typeof assignedPermissions
  >([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const form = useForm<RoleDetailsFormValues>({
    resolver: zodResolver(roleDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isFormDirty = form.formState.isDirty;

  const hasDraftForCurrentRole =
    roleDetail !== undefined && draftRoleId === roleDetail.id;
  const workingPermissions = hasDraftForCurrentRole
    ? draftPermissions
    : assignedPermissions;
  const workingIsActive = hasDraftForCurrentRole
    ? draftIsActive
    : (roleDetail?.isActive ?? roleSummary?.isActive ?? true);

  const permissionsDirty = arePermissionSetsDifferent(
    assignedPermissions,
    workingPermissions,
  );
  const statusDirty =
    roleDetail !== undefined ? roleDetail.isActive !== workingIsActive : false;
  const isDirty = isFormDirty || permissionsDirty || statusDirty;

  useEffect(() => {
    if (!roleDetail || !open || isFormDirty) return;
    form.reset(mapRoleDetailToFormValues(roleDetail));
  }, [form, isFormDirty, open, roleDetail]);

  useEffect(() => {
    if (!open || !roleDetailResponse) return;
    setDraftRoleId(roleDetailResponse.role.id);
    setDraftIsActive(roleDetailResponse.role.isActive);
    setDraftPermissions(roleDetailResponse.permissions);
  }, [open, roleDetailResponse]);

  const closeDialog = () => {
    markClosing();
    if (roleDetail) {
      form.reset(mapRoleDetailToFormValues(roleDetail));
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
    setDraftRoleId(null);
    setDraftIsActive(roleDetail?.isActive ?? roleSummary?.isActive ?? true);
    setDraftPermissions([]);
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !roleDetail));
  const isSystem = roleDetail?.isSystem ?? roleSummary?.isSystem;
  const isEditable = canEdit && !isSystem;

  const isSaving =
    isSavingAll || updateRole.isPending || assignPermissions.isPending;

  const handleAddPermissionDraft = (permissionId: number) => {
    if (!isEditable || !roleDetail) return;

    setDraftRoleId(roleDetail.id);
    setDraftPermissions((previousPermissions) => {
      const basePermissions = hasDraftForCurrentRole
        ? previousPermissions
        : assignedPermissions;
      return addPermissionToDraft(
        basePermissions,
        permissionCatalog,
        permissionId,
      );
    });
  };

  const handleRemovePermissionDraft = (permissionId: number) => {
    if (!isEditable || !roleDetail) return;

    setDraftRoleId(roleDetail.id);
    setDraftPermissions((previousPermissions) => {
      const basePermissions = hasDraftForCurrentRole
        ? previousPermissions
        : assignedPermissions;
      return removePermissionFromDraft(basePermissions, permissionId);
    });
  };

  const syncRoleDraftState = (nextData?: typeof roleDetailResponse) => {
    if (!nextData) return false;

    form.reset(mapRoleDetailToFormValues(nextData.role));
    setDraftRoleId(nextData.role.id);
    setDraftIsActive(nextData.role.isActive);
    setDraftPermissions(nextData.permissions);
    return true;
  };

  const handleSave = async (values: RoleDetailsFormValues) => {
    if (!roleDetail || !isEditable || isSaving) return;
    const payload: UpdateRoleRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;
    if (dirtyFields.description) payload.description = values.description;
    if (dirtyFields.landingRoute) {
      payload.landingRoute = values.landingRoute?.trim() || undefined;
    }

    if (statusDirty) {
      payload.isActive = workingIsActive;
    }

    const savePlan = {
      rolePayload: payload,
      permissionsDirty,
      permissionIds: workingPermissions.map((permission) => permission.id),
    };

    if (!hasRoleDetailsChanges(savePlan)) return;

    setIsSavingAll(true);
    let completedGroups = 0;

    try {
      completedGroups = await applyRoleDetailsSavePlan(savePlan, {
        updateRole: (rolePayload) =>
          updateRole.mutateAsync({ roleId: roleDetail.id, data: rolePayload }),
        assignPermissions: (permissionIds) =>
          assignPermissions.mutateAsync({
            data: {
              roleId: roleDetail.id,
              permissionIds,
            },
          }),
      });

      const refreshedDetail = await refetch();
      if (!syncRoleDraftState(refreshedDetail.data)) {
        form.reset(values);
      }

      toast.success("Cambios guardados", {
        description: "Configuracion y permisos del rol actualizados.",
      });
    } catch (error) {
      const fallbackMessage =
        completedGroups > 0
          ? "Se aplicaron cambios parciales. Revisa el detalle y vuelve a intentar."
          : "No se pudieron guardar los cambios del rol.";

      toast.error("No se pudieron guardar todos los cambios", {
        description: getRoleErrorMessage(error, fallbackMessage),
      });

      try {
        const refreshedDetail = await refetch();
        syncRoleDraftState(refreshedDetail.data);
      } catch {
        // Si falla el refetch, mantenemos el borrador local para no perder cambios.
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleStatusChange = (nextActive: boolean) => {
    if (!roleDetail || !isEditable) return;
    setDraftRoleId(roleDetail.id);
    setDraftIsActive(nextActive);
  };

  const title = roleDetail?.name || roleSummary?.name || "Rol";
  const subtitle = roleDetail?.description || roleSummary?.description || null;
  const isActive = workingIsActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <Badge variant={isActive ? "stable" : "secondary"} className="gap-2">
        <span
          className={
            isActive
              ? "size-1.5 shrink-0 rounded-full bg-status-stable"
              : "size-1.5 shrink-0 rounded-full bg-txt-muted"
          }
        />
        {isActive ? "Activo" : "Inactivo"}
      </Badge>
    ) : null;

  const createdByLabel = roleDetail
    ? `${roleDetail.createdBy?.name ?? "-"} ${formatDateTime(roleDetail.createdAt)}`
    : "-";
  const updatedByLabel = roleDetail?.updatedAt
    ? `${roleDetail.updatedBy?.name ?? "-"} ${formatDateTime(roleDetail.updatedAt)}`
    : "Sin actualizaciones registradas.";

  const loadingContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-2xl" />
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
        No se pudo cargar el rol
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getRoleErrorMessage(
          roleDetailError,
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

  const sections: AdminDetailsDialogSection[] = roleDetail
    ? [
        {
          id: "general",
          label: "General",
          icon: <SlidersHorizontal className="size-4" />,
          content: (
            <>
              <RoleDetailsGeneralTab
                form={form}
                formId={FORM_ID}
                roleDetail={roleDetail}
                activeStatus={workingIsActive}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={isSaving}
                isEditable={isEditable}
              />
              {!isEditable ? (
                <div className="mt-4 rounded-xl border border-line-struct bg-subtle/40 px-4 py-3 text-xs text-txt-muted">
                  Este rol es de sistema o no tienes permisos para modificarlo.
                </div>
              ) : null}
            </>
          ),
        },
        {
          id: "permissions",
          label: "Permisos",
          icon: <ShieldCheck className="size-4" />,
          badge: (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 rounded-full px-1 text-[10px]"
            >
              {workingPermissions.length}
            </Badge>
          ),
          content: (
            <RoleDetailsPermissionsTab
              permissions={workingPermissions}
              permissionCatalog={permissionCatalog}
              isLoadingPermissions={isLoadingPermissions}
              isEditable={isEditable}
              isSaving={isSaving}
              catalogErrorMessage={
                isPermissionsCatalogError
                  ? getRoleErrorMessage(
                      permissionsCatalogError,
                      "No se pudo cargar el catalogo de permisos. Verifica que tengas admin:gestion:permisos:read.",
                    )
                  : null
              }
              onRetryCatalog={() => {
                void refetchPermissionsCatalog();
              }}
              onAddPermission={handleAddPermissionDraft}
              onRemovePermission={handleRemovePermissionDraft}
            />
          ),
        },
        {
          id: "audit",
          label: "Auditoria",
          icon: <Clock3 className="size-4" />,
          content: <RoleDetailsAuditTab roleDetail={roleDetail} />,
        },
      ]
    : [];

  return (
    <AdminDetailsDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      onRequestClose={closeDialog}
      titleSrOnly="Detalle de rol"
      descriptionSrOnly="Gestiona la configuracion del rol y sus permisos."
      sidePanel={
        roleSummary || roleDetail ? (
          <RoleDetailsSidePanel
            name={title}
            description={subtitle}
            status={statusBadge}
            isSystem={Boolean(isSystem)}
            landingRoute={roleDetail?.landingRoute ?? roleSummary?.landingRoute}
            permissionsCount={
              roleDetail?.permissionsCount ?? roleSummary?.permissionsCount ?? 0
            }
            usersCount={roleDetail?.usersCount ?? roleSummary?.usersCount ?? 0}
            createdByLabel={createdByLabel}
            updatedByLabel={updatedByLabel}
          />
        ) : null
      }
      sidePanelClassName="hidden min-h-0 w-[292px] shrink-0 border-r border-line-struct/70 bg-subtle/20 lg:flex"
      splitBodyClassName="flex h-full min-h-0"
      header={
        roleSummary || roleDetail ? (
          <div className="lg:hidden">
            <RoleDialogHeader
              title={title}
              subtitle={subtitle}
              status={statusBadge}
            />
          </div>
        ) : null
      }
      headerClassName="px-5 pt-5 lg:px-8 lg:pt-5"
      scrollAreaClassName="min-h-0 flex-1 px-5 pb-8 lg:px-8 lg:pb-10"
      contentClassName="min-w-0 space-y-5 overflow-x-auto pt-3"
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
        <RoleDetailsFooter
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

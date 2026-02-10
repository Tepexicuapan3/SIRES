import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissionsCatalog } from "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog";
import { useRoleDetail } from "@features/admin/modules/rbac/roles/queries/useRoleDetail";
import { useUpdateRole } from "@features/admin/modules/rbac/roles/mutations/useUpdateRole";
import {
  roleDetailsSchema,
  type RoleDetailsFormValues,
} from "@features/admin/modules/rbac/roles/domain/roles.schemas";
import { getRoleErrorMessage } from "@features/admin/modules/rbac/roles/utils/roles.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/rbac/roles/utils/roles.format";
import { RoleDialogHeader } from "@features/admin/modules/rbac/roles/components/RoleDialogHeader";
import { RoleDetailsFooter } from "@features/admin/modules/rbac/roles/components/RoleDetailsFooter";
import { RoleDetailsGeneralTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsGeneralTab";
import { RoleDetailsPermissionsTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsPermissionsTab";
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

  const updateRole = useUpdateRole();

  const [activeTab, setActiveTab] = useState("general");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const form = useForm<RoleDetailsFormValues>({
    resolver: zodResolver(roleDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!roleDetail || !open || isDirty) return;
    form.reset({
      name: roleDetail.name ?? "",
      description: roleDetail.description ?? "",
      landingRoute: roleDetail.landingRoute ?? "",
    });
  }, [form, isDirty, open, roleDetail]);

  const closeDialog = () => {
    if (roleDetail) {
      form.reset({
        name: roleDetail.name ?? "",
        description: roleDetail.description ?? "",
        landingRoute: roleDetail.landingRoute ?? "",
      });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
    setActiveTab("general");
    onClose?.();
    onOpenChange(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (isDirty) {
        setConfirmCloseOpen(true);
        return;
      }

      closeDialog();
      return;
    }

    onOpenChange(true);
  };

  const handleSave = async (values: RoleDetailsFormValues) => {
    if (!roleDetail || !canEdit) return;
    const payload: UpdateRoleRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;
    if (dirtyFields.description) payload.description = values.description;
    if (dirtyFields.landingRoute) {
      payload.landingRoute = values.landingRoute?.trim() || undefined;
    }

    if (Object.keys(payload).length === 0) return;

    try {
      await updateRole.mutateAsync({ roleId: roleDetail.id, data: payload });
      toast.success("Rol actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getRoleErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!roleDetail || !canEdit || roleDetail.isSystem) return;
    try {
      await updateRole.mutateAsync({
        roleId: roleDetail.id,
        data: { isActive: nextActive },
      });
      toast.success("Estado actualizado", {
        description: "El estado del rol se actualizo correctamente.",
      });
    } catch (error) {
      toast.error("No se pudo actualizar", {
        description: getRoleErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = roleDetail?.name || roleSummary?.name || "Rol";
  const subtitle = roleDetail?.description || roleSummary?.description || null;
  const isActive = roleDetail?.isActive ?? roleSummary?.isActive;
  const isSystem = roleDetail?.isSystem ?? roleSummary?.isSystem;
  const isEditable = canEdit && !isSystem;

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

  const createdMeta = roleDetail ? (
    <span className="inline-flex items-center gap-2">
      <CalendarDays className="size-4" />
      Creado {formatDate(roleDetail.createdAt)} por{" "}
      {roleDetail.createdBy?.name ?? "-"}
    </span>
  ) : null;

  const updatedMeta = roleDetail?.updatedAt ? (
    <span className="inline-flex items-center gap-2">
      <Pencil className="size-4" />
      Actualizado {formatDateTime(roleDetail.updatedAt)} por{" "}
      {roleDetail.updatedBy?.name ?? "-"}
    </span>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-[1120px] xl:w-[1260px]">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Detalle de rol</DialogTitle>
            <DialogDescription className="sr-only">
              Gestiona la configuracion del rol y sus permisos.
            </DialogDescription>
            {roleSummary || roleDetail ? (
              <RoleDialogHeader
                title={title}
                subtitle={subtitle}
                status={statusBadge}
                meta={
                  roleDetail ? (
                    <span className="flex flex-wrap gap-3">
                      {createdMeta}
                      {updatedMeta}
                    </span>
                  ) : null
                }
              />
            ) : null}
          </DialogHeader>
          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Skeleton
                        key={`tab-skel-${index}`}
                        className="h-9 w-28"
                      />
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={`field-skel-${index}`} className="h-12" />
                    ))}
                  </div>
                </div>
              ) : isError || !roleDetail ? (
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
              ) : (
                <>
                  <Separator />

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start gap-2 rounded-xl border border-line-struct/60 bg-subtle/40 p-1">
                      <TabsTrigger
                        value="general"
                        className="gap-2 px-4 data-[state=active]:border-line-struct data-[state=active]:shadow-sm"
                      >
                        General
                      </TabsTrigger>
                      <TabsTrigger
                        value="permissions"
                        className="gap-2 px-4 data-[state=active]:border-line-struct data-[state=active]:shadow-sm"
                      >
                        Permisos
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[11px]"
                        >
                          {assignedPermissions.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="pt-4">
                      <RoleDetailsGeneralTab
                        form={form}
                        formId={FORM_ID}
                        roleDetail={roleDetail}
                        onSubmit={handleSave}
                        onStatusChange={handleStatusChange}
                        isStatusPending={updateRole.isPending}
                        isEditable={isEditable}
                      />
                      {!isEditable ? (
                        <div className="mt-4 rounded-xl border border-line-struct bg-subtle/40 px-4 py-3 text-xs text-txt-muted">
                          Este rol es de sistema o no tienes permisos para
                          modificarlo.
                        </div>
                      ) : null}
                    </TabsContent>

                    <TabsContent value="permissions" className="pt-4">
                      <RoleDetailsPermissionsTab
                        roleId={roleDetail.id}
                        permissions={assignedPermissions}
                        permissionCatalog={permissionsData?.items ?? []}
                        isLoadingPermissions={isLoadingPermissions}
                        isEditable={isEditable}
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
                      />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </ScrollArea>
          <RoleDetailsFooter
            isDirty={isDirty}
            isSaving={updateRole.isPending}
            formId={FORM_ID}
            onCancel={() => handleDialogOpenChange(false)}
            disableSave={!isEditable}
          />
        </div>
      </DialogContent>
      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salir sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, perderas la
              informacion capturada en este formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmCloseOpen(false);
                closeDialog();
              }}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

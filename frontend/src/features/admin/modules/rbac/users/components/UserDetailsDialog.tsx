import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
import { useUserDetail } from "@features/admin/modules/rbac/users/queries/useUserDetail";
import { useUpdateUser } from "@features/admin/modules/rbac/users/mutations/useUpdateUser";
import { useActivateUser } from "@features/admin/modules/rbac/users/mutations/useActivateUser";
import { useDeactivateUser } from "@features/admin/modules/rbac/users/mutations/useDeactivateUser";
import {
  userDetailsSchema,
  type UserDetailsFormValues,
} from "@features/admin/modules/rbac/users/domain/users.schemas";
import { getUserErrorMessage } from "@features/admin/modules/rbac/users/utils/users.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/rbac/users/utils/users.format";
import { UserDialogHeader } from "@features/admin/modules/rbac/users/components/UserDialogHeader";
import { UserDetailsFooter } from "@features/admin/modules/rbac/users/components/UserDetailsFooter";
import { UserDetailsGeneralTab } from "@features/admin/modules/rbac/users/components/UserDetailsGeneralTab";
import { UserDetailsPermissionsTab } from "@features/admin/modules/rbac/users/components/UserDetailsPermissionsTab";
import { UserDetailsRolesTab } from "@features/admin/modules/rbac/users/components/UserDetailsRolesTab";
import type {
  CentroAtencionListItem,
  RoleListItem,
  UserListItem,
} from "@api/types";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  userSummary: UserListItem | null;
  roleOptions: RoleListItem[];
  clinicOptions: CentroAtencionListItem[];
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: UserDetailsFormValues = {
  firstName: "",
  paternalName: "",
  maternalName: "",
  email: "",
  clinicId: null,
};

const FORM_ID = "user-details-form";

export function UserDetailsDialog({
  open,
  onOpenChange,
  onClose,
  userSummary,
  roleOptions,
  clinicOptions,
  canEdit,
}: UserDetailsDialogProps) {
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
  } = usePermissionsCatalog(open);

  const userDetail = userDetailResponse?.user;
  const roles = userDetailResponse?.roles ?? [];
  const overrides = userDetailResponse?.overrides ?? [];

  const updateUser = useUpdateUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();

  const [activeTab, setActiveTab] = useState("general");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const form = useForm<UserDetailsFormValues>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!userDetail || !open || isDirty) return;
    form.reset({
      firstName: userDetail.firstName ?? "",
      paternalName: userDetail.paternalName ?? "",
      maternalName: userDetail.maternalName ?? "",
      email: userDetail.email ?? "",
      clinicId: userDetail.clinic?.id ?? null,
    });
  }, [form, isDirty, open, userDetail]);

  const closeDialog = () => {
    if (userDetail) {
      form.reset({
        firstName: userDetail.firstName ?? "",
        paternalName: userDetail.paternalName ?? "",
        maternalName: userDetail.maternalName ?? "",
        email: userDetail.email ?? "",
        clinicId: userDetail.clinic?.id ?? null,
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

  const handleSave = async (values: UserDetailsFormValues) => {
    if (!userDetail || !isEditable) return;
    const payload: Partial<UserDetailsFormValues> = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.firstName) payload.firstName = values.firstName;
    if (dirtyFields.paternalName) payload.paternalName = values.paternalName;
    if (dirtyFields.maternalName) payload.maternalName = values.maternalName;
    if (dirtyFields.email) payload.email = values.email;
    if (dirtyFields.clinicId) payload.clinicId = values.clinicId;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateUser.mutateAsync({ userId: userDetail.id, data: payload });
      toast.success("Perfil actualizado", {
        description: "Los cambios del usuario se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getUserErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!userDetail || !isEditable) return;
    try {
      if (nextActive) {
        await activateUser.mutateAsync({ userId: userDetail.id });
        toast.success("Usuario activado");
      } else {
        await deactivateUser.mutateAsync({ userId: userDetail.id });
        toast.success("Usuario desactivado");
      }
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getUserErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const avatarUrl = (userSummary as { avatarUrl?: string | null })?.avatarUrl;
  const title =
    userDetail?.fullname ||
    userSummary?.fullname ||
    userSummary?.username ||
    "Usuario";
  const subtitle = userDetail?.email || userSummary?.email || null;
  const rolesCount = roles.length;
  const overridesCount = overrides.length;
  const isEditable = canEdit;

  const isActive = userDetail?.isActive ?? userSummary?.isActive;
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

  const createdMeta = userDetail ? (
    <span className="inline-flex items-center gap-2">
      <CalendarDays className="size-4" />
      Creado {formatDate(userDetail.createdAt)} por{" "}
      {userDetail.createdBy?.name ?? "-"}
    </span>
  ) : null;

  const lastLoginLabel = formatDateTime(userDetail?.lastLoginAt);

  const lastIpLabel = userDetail?.lastIp ?? "-";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-[1120px] xl:w-[1260px]">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Detalle de usuario</DialogTitle>
            <DialogDescription className="sr-only">
              Gestiona perfil, roles y permisos desde un solo lugar.
            </DialogDescription>
            {userSummary || userDetail ? (
              <UserDialogHeader
                title={title}
                subtitle={subtitle}
                avatarUrl={avatarUrl}
                status={statusBadge}
                meta={createdMeta}
                fallbackLabel={userSummary?.username || "Usuario"}
              />
            ) : null}
          </DialogHeader>
          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              {isLoading ? (
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
              ) : isError || !userDetail ? (
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
              ) : (
                <>
                  <Separator />

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start gap-2 rounded-xl border border-line-struct/60 bg-subtle/40 p-1">
                      <TabsTrigger
                        value="general"
                        className="gap-2 px-4 data-[state=active]:border-line-struct data-[state=active]:shadow-sm"
                      >
                        <UserRound className="size-4" />
                        General
                      </TabsTrigger>
                      <TabsTrigger
                        value="roles"
                        className="gap-2 px-4 data-[state=active]:border-line-struct data-[state=active]:shadow-sm"
                      >
                        <ShieldCheck className="size-4" />
                        Roles
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[11px]"
                        >
                          {rolesCount}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="permissions"
                        className="gap-2 px-4 data-[state=active]:border-line-struct data-[state=active]:shadow-sm"
                      >
                        <ShieldAlert className="size-4" />
                        Permisos
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[11px]"
                        >
                          {overridesCount}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="pt-4">
                      <UserDetailsGeneralTab
                        form={form}
                        formId={FORM_ID}
                        clinicOptions={clinicOptions}
                        userDetail={userDetail}
                        onSubmit={handleSave}
                        onStatusChange={handleStatusChange}
                        isStatusPending={
                          activateUser.isPending || deactivateUser.isPending
                        }
                        lastLoginLabel={lastLoginLabel}
                        lastIpLabel={lastIpLabel}
                        isEditable={isEditable}
                      />
                      {!isEditable ? (
                        <div className="mt-4 rounded-xl border border-line-struct bg-subtle/40 px-4 py-3 text-xs text-txt-muted">
                          Solo lectura: no tienes permisos para modificar este
                          usuario.
                        </div>
                      ) : null}
                    </TabsContent>

                    <TabsContent value="roles" className="pt-4">
                      <UserDetailsRolesTab
                        userId={userDetail.id}
                        roles={roles}
                        roleOptions={roleOptions}
                        isEditable={isEditable}
                      />
                    </TabsContent>

                    <TabsContent value="permissions" className="pt-4">
                      <UserDetailsPermissionsTab
                        userId={userDetail.id}
                        overrides={overrides}
                        permissions={permissionsData?.items ?? []}
                        isLoadingPermissions={isLoadingPermissions}
                        isEditable={isEditable}
                        catalogErrorMessage={
                          isPermissionsCatalogError
                            ? getUserErrorMessage(
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
          <UserDetailsFooter
            isDirty={isDirty}
            isSaving={updateUser.isPending}
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

import { useState } from "react";
import { ArrowLeft, Users, AlertCircle, UserPlus } from "lucide-react";
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
import { UsersTableToolbar } from "../components/users/UsersTableToolbar";
import { UsersDataTable } from "../components/users/UsersDataTable";
import { UserDetailCard } from "../components/users/UserDetailCard";
import { UserRolesManager } from "../components/users/UserRolesManager";
import { UserPermissionOverrides } from "../components/users/UserPermissionOverrides";
import { UserFormDialog } from "../components/users/UserFormDialog";
import {
  useUser,
  useActivateUser,
  useDeactivateUser,
} from "../hooks/useAdminUsers";
import { useUsersFilters } from "../hooks/useUsersFilters";
import { toast } from "sonner";

/**
 * UsersPage - Página principal de gestión de usuarios
 *
 * ARQUITECTURA:
 * - State Machine: list (tabla) | detail (vista completa)
 * - Container/Presenter: Este componente orquesta, los hijos renderizan
 * - Hooks: useUser() para detalle completo
 *
 * FLUJO:
 * list → (click "Ver Detalle") → detail → (volver) → list
 *
 * VISTA LIST (REFACTORIZADA - FASE 1-3):
 * - UsersTableToolbar: Búsqueda + filtros + botón crear
 * - UsersDataTable: Tabla completa con paginación, loading, estados vacíos
 *   → Usa useUsersFilters() para estado de filtros (sincronizado con URL)
 *   → Usa useUsers(filters) para datos (TanStack Query con cache)
 *
 * VISTA DETAIL:
 * - UserDetailCard: Información básica + imagen + auditoría
 * - UserRolesManager: Gestión de roles del usuario
 * - UserPermissionOverrides: Permisos excepcionales (ALLOW/DENY)
 */

type ViewMode = "list" | "detail";

export function UsersPage() {
  // ============================================================
  // ESTADO DE NAVEGACIÓN
  // ============================================================

  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // ============================================================
  // HOOKS - FILTERS (SINGLE SOURCE OF TRUTH)
  // ============================================================

  /**
   * 🔥 FIX CRÍTICO: Hook llamado UNA SOLA VEZ en el componente padre
   *
   * PROBLEMA ANTERIOR:
   * - UsersTableToolbar llamaba useUsersFilters() (instancia #1)
   * - UsersDataTable llamaba useUsersFilters() (instancia #2)
   * - Ambas instancias tenían estado SEPARADO y peleaban por actualizar la URL
   * - Resultado: filtros nunca se disparaban correctamente
   *
   * SOLUCIÓN:
   * - Llamar useUsersFilters() UNA SOLA VEZ aquí en el padre
   * - Pasar el hook completo como prop a ambos componentes hijos
   * - Los hijos destructuran solo lo que necesitan
   *
   * ARQUITECTURA:
   * UsersPage (llama hook AQUÍ)
   *   ├─ UsersTableToolbar (recibe filtersHook como prop)
   *   └─ UsersDataTable (recibe filtersHook como prop)
   */
  const filtersHook = useUsersFilters();

  // ============================================================
  // ESTADO DE MODALES
  // ============================================================

  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // ============================================================
  // TANSTACK QUERY - Datos
  // ============================================================

  /**
   * Detalle completo de usuario seleccionado (vista detail)
   * Incluye: user (con auditoría) + roles asignados
   *
   * enabled: solo ejecuta si hay userId seleccionado
   */
  const {
    data: userDetailData,
    isLoading: isLoadingDetail,
    error: errorDetail,
  } = useUser(selectedUserId);

  // Extraer datos
  const userDetail = userDetailData?.user ?? null;

  // ============================================================
  // MUTACIONES (Activar/Desactivar)
  // ============================================================

  const activateUserMutation = useActivateUser(selectedUserId || 0);
  const deactivateUserMutation = useDeactivateUser(selectedUserId || 0);

  // ============================================================
  // HANDLERS DE NAVEGACIÓN
  // ============================================================

  /**
   * Navegar a vista detallada
   * @param userId - ID del usuario a ver
   */
  const handleViewDetails = (userId: number) => {
    setSelectedUserId(userId);
    setMode("detail");
  };

  /**
   * Volver a la lista
   */
  const handleBackToList = () => {
    setSelectedUserId(null);
    setMode("list");
  };

  /**
   * Callback después de crear usuario exitosamente
   * Invalida cache automáticamente (TanStack Query lo hace en el hook)
   */
  const handleUserCreated = () => {
    setShowCreateUserDialog(false);
    // El hook useCreateUser ya invalida la cache de usuarios
  };

  /**
   * Abrir modal de edición
   */
  const handleEditUser = () => {
    setShowEditUserDialog(true);
  };

  /**
   * Callback después de editar usuario exitosamente
   */
  const handleUserEdited = () => {
    setShowEditUserDialog(false);
  };

  /**
   * Confirmar activación de usuario
   */
  const handleConfirmActivate = async () => {
    try {
      await activateUserMutation.mutateAsync();
      toast.success("Usuario activado correctamente");
      setShowActivateDialog(false);
    } catch (error: any) {
      toast.error("Error al activar usuario", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  /**
   * Confirmar desactivación de usuario
   */
  const handleConfirmDeactivate = async () => {
    try {
      await deactivateUserMutation.mutateAsync();
      toast.success("Usuario desactivado correctamente");
      setShowDeactivateDialog(false);
    } catch (error: any) {
      toast.error("Error al desactivar usuario", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Botón "Volver" solo en modo detail */}
          {mode === "detail" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la lista
            </Button>
          )}

          {/* Título */}
          <div>
            <h1 className="text-3xl font-bold text-txt-body">
              {mode === "list" ? "Gestión de Usuarios" : "Detalle de Usuario"}
            </h1>
            <p className="text-txt-muted mt-1">
              {mode === "list" &&
                "Administra usuarios, roles y permisos del sistema"}
              {mode === "detail" && userDetail && (
                <>
                  {userDetail.nombre} {userDetail.paterno} {userDetail.materno}{" "}
                  (@{userDetail.usuario})
                </>
              )}
            </p>
          </div>
        </div>

        {/* Ícono decorativo en modo detail */}
        {mode === "detail" && (
          <div className="hidden md:block">
            <Users className="h-12 w-12 text-brand opacity-20" />
          </div>
        )}
      </div>

      {/* ========== VISTA LIST ========== */}
      {mode === "list" && (
        <div className="space-y-4">
          {/* Toolbar con búsqueda, filtros y botón crear */}
          <UsersTableToolbar
            onCreateUser={() => setShowCreateUserDialog(true)}
            filtersHook={filtersHook}
          />

          {/* Tabla completa con todos los estados (loading, error, empty, success) */}
          <UsersDataTable
            onViewDetail={handleViewDetails}
            filtersHook={filtersHook}
          />
        </div>
      )}

      {/* ========== VISTA DETAIL ========== */}
      {mode === "detail" && selectedUserId && (
        <>
          {/* Loading state */}
          {isLoadingDetail && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
          )}

          {/* Error state */}
          {errorDetail && (
            <div className="bg-white rounded-lg shadow-sm border border-line-struct p-12 text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-status-critical mb-4" />
              <h3 className="text-xl font-semibold text-txt-body mb-2">
                Error al cargar usuario
              </h3>
              <p className="text-txt-muted mb-6 max-w-md mx-auto">
                {errorDetail instanceof Error
                  ? errorDetail.message
                  : "No se pudo obtener la información del usuario"}
              </p>
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a la lista
              </Button>
            </div>
          )}

          {/* Vista detallada completa */}
          {!isLoadingDetail && !errorDetail && userDetail && (
            <div className="space-y-6">
              {/* 1. Información Básica + Auditoría + Acciones */}
              <UserDetailCard
                user={userDetail}
                onEdit={handleEditUser}
                onActivate={() => setShowActivateDialog(true)}
                onDeactivate={() => setShowDeactivateDialog(true)}
              />

              {/* 2. Gestión de Roles */}
              <UserRolesManager userId={selectedUserId} />

              {/* 3. Gestión de Permisos (Overrides) */}
              <UserPermissionOverrides userId={selectedUserId} />
            </div>
          )}
        </>
      )}

      {/* ========== MODAL DE CREACIÓN DE USUARIO ========== */}
      <UserFormDialog
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
        mode="create"
        onSuccess={handleUserCreated}
      />

      {/* ========== MODAL DE EDICIÓN DE USUARIO ========== */}
      {userDetail && (
        <UserFormDialog
          open={showEditUserDialog}
          onOpenChange={setShowEditUserDialog}
          mode="edit"
          user={userDetail}
          onSuccess={handleUserEdited}
        />
      )}

      {/* ========== CONFIRMACIÓN: ACTIVAR USUARIO ========== */}
      <AlertDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés activar a{" "}
              <strong>
                {userDetail?.nombre} {userDetail?.paterno}
              </strong>
              ? El usuario podrá iniciar sesión nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivate}
              disabled={activateUserMutation.isPending}
            >
              {activateUserMutation.isPending ? "Activando..." : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== CONFIRMACIÓN: DESACTIVAR USUARIO ========== */}
      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés desactivar a{" "}
              <strong>
                {userDetail?.nombre} {userDetail?.paterno}
              </strong>
              ? El usuario NO podrá iniciar sesión hasta que lo reactives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              disabled={deactivateUserMutation.isPending}
              className="bg-status-critical hover:bg-status-critical/90"
            >
              {deactivateUserMutation.isPending
                ? "Desactivando..."
                : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UsersPage;

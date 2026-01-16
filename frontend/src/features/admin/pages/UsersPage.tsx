/**
 * ============================================
 * PÁGINA: UsersPage
 * ============================================
 *
 * Página principal de gestión de usuarios del sistema SIRES.
 *
 * **Responsabilidad:**
 * - Integrar UsersTableToolbar + UsersDataTable
 * - Gestionar estado de diálogos (crear/editar/ver)
 * - Coordinar acciones entre componentes
 *
 * **Patrón Aplicado:**
 * - Container/Presentational Pattern
 * - State Machine para diálogos (closed → create/edit/view)
 * - Composición de componentes especializados
 *
 * **Arquitectura:**
 * UsersPage (orquestador)
 *   ├─ Header (título + descripción)
 *   ├─ UsersTableToolbar (búsqueda + filtros + botón crear)
 *   ├─ UsersDataTable (tabla + paginación + estados)
 *   ├─ CreateUserDialog (modal crear usuario)
 *   ├─ EditUserDialog (modal editar usuario)
 *   └─ UserDetailDialog (modal ver detalle) [FUTURO]
 */

import { useState } from "react";
import { Users } from "lucide-react";
import { UsersTableToolbar } from "../components/users/UsersTableToolbar";
import { UsersDataTable } from "../components/users/UsersDataTable";
import { CreateUserDialog } from "../components/users/CreateUserDialog";
import { EditUserDialog } from "../components/users/EditUserDialog";
import { useUsersFilters } from "../hooks/useUsersFilters";

/**
 * Estado de los diálogos
 * - null: Todos cerrados
 * - { type: "create" }: Diálogo crear usuario
 * - { type: "edit", userId: number }: Diálogo editar usuario
 * - { type: "view", userId: number }: Diálogo ver detalle [FUTURO]
 */
type DialogState =
  | null
  | { type: "create" }
  | { type: "edit"; userId: number }
  | { type: "view"; userId: number };

/**
 * Página de gestión de usuarios
 *
 * **Features:**
 * - Búsqueda en tiempo real (debounced)
 * - Filtrado por rol y estado
 * - Paginación con URL state
 * - CRUD completo de usuarios
 * - Activar/desactivar con toast + undo
 * - Responsive design Metro CDMX
 *
 * **Integración:**
 * - Todos los componentes hijos usan hooks compartidos (useUsersFilters, useUsers)
 * - Estado de diálogos centralizado en este componente
 * - Callbacks para abrir diálogos específicos
 *
 * @example
 * // En tu router
 * <Route path="/admin/users" element={<UsersPage />} />
 */
export function UsersPage() {
  // ============================================================
  // STATE - FILTROS (SINGLE SOURCE OF TRUTH)
  // ============================================================

  /**
   * 🔥 FIX CRÍTICO: Hook llamado UNA SOLA VEZ en el componente padre
   *
   * ANTES: UsersTableToolbar y UsersDataTable llamaban useUsersFilters() por separado
   * → Dos instancias del hook peleándose por escribir a la URL
   * → Condiciones de carrera, estado inconsistente
   *
   * AHORA: Hook llamado acá, valores/setters pasados como props
   * → Una sola fuente de verdad
   * → Estado consistente entre componentes
   */
  const filtersHook = useUsersFilters();

  // ============================================================
  // STATE - DIÁLOGOS
  // ============================================================

  const [dialogState, setDialogState] = useState<DialogState>(null);

  // ============================================================
  // HANDLERS - ABRIR/CERRAR DIÁLOGOS
  // ============================================================

  /**
   * Abrir diálogo de crear usuario
   * Llamado desde UsersTableToolbar (botón "Crear Usuario")
   */
  const handleCreateUser = () => {
    setDialogState({ type: "create" });
  };

  /**
   * Abrir diálogo de editar usuario
   * Llamado desde UsersTableRow (acción dropdown "Editar")
   */
  const handleEditUser = (userId: number) => {
    setDialogState({ type: "edit", userId });
  };

  /**
   * Abrir vista detallada de usuario
   * Llamado desde UsersTableRow (acción dropdown "Ver Detalle")
   *
   * NOTA: Por ahora abre el diálogo de editar (porque UserDetailDialog no existe aún)
   * TODO: Crear UserDetailDialog component
   */
  const handleViewDetail = (userId: number) => {
    // Por ahora, "Ver Detalle" redirige a editar
    // En el futuro: setDialogState({ type: "view", userId });
    setDialogState({ type: "edit", userId });
  };

  /**
   * Cerrar cualquier diálogo abierto
   */
  const handleCloseDialog = () => {
    setDialogState(null);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="flex items-start gap-4">
        {/* Icono decorativo */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Users className="size-6" aria-hidden="true" />
        </div>

        {/* Título + descripción */}
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold leading-tight text-txt-body">
            Gestión de Usuarios
          </h1>
          <p className="text-base text-txt-muted">
            Administrá los usuarios del sistema Metro CDMX. Creá, editá y
            gestioná accesos.
          </p>
        </div>
      </header>

      {/* ============================================================
          TOOLBAR
          Búsqueda + Filtros + Botón Crear Usuario
          ============================================================ */}
      <UsersTableToolbar
        onCreateUser={handleCreateUser}
        filtersHook={filtersHook}
      />

      {/* ============================================================
          TABLA DE USUARIOS
          Incluye: Header, Rows, Paginación, Estados (loading/error/empty)
          ============================================================ */}
      <UsersDataTable
        onViewDetail={handleViewDetail}
        onEdit={handleEditUser}
        filtersHook={filtersHook}
      />

      {/* ============================================================
          DIÁLOGOS
          ============================================================ */}

      {/* Crear Usuario */}
      {dialogState?.type === "create" && (
        <CreateUserDialog open onClose={handleCloseDialog} />
      )}

      {/* Editar Usuario */}
      {dialogState?.type === "edit" && (
        <EditUserDialog
          open
          userId={dialogState.userId}
          onClose={handleCloseDialog}
        />
      )}

      {/* Ver Detalle - TODO: Crear UserDetailDialog */}
      {/* {dialogState?.type === "view" && (
        <UserDetailDialog
          open
          userId={dialogState.userId}
          onClose={handleCloseDialog}
          onEdit={() => handleEditUser(dialogState.userId)}
        />
      )} */}
    </div>
  );
}

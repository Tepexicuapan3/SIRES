import { useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UsersList } from "./UsersList";
import { UserRolesManager } from "./UserRolesManager";
import { UserPermissionOverrides } from "./UserPermissionOverrides";
import { api } from "@api/client";
import type { User } from "@api/types/users.types";

/**
 * UsersPage - Orquestador principal de gestión de usuarios
 *
 * ARQUITECTURA:
 * - State Machine con 2 modos: list | detail
 * - Container/Presenter: Este componente orquesta, los hijos renderizan
 * - Composite Pattern: Vista detail combina RolesManager + PermissionOverrides
 *
 * FLUJO DE NAVEGACIÓN:
 * list → (click usuario) → detail → (volver) → list
 *
 * VISTA DETAIL:
 * - Muestra información del usuario seleccionado
 * - UserRolesManager (gestión de múltiples roles)
 * - UserPermissionOverrides (permisos excepcionales)
 *
 * HOOKS USADOS:
 * - useQuery(): Listar usuarios (endpoint genérico de usuarios)
 *
 * SEGURIDAD:
 * - Solo accesible con permiso usuarios:assign_permissions
 * - Validación en RoleGuard (Routes.tsx)
 */

type ViewMode = "list" | "detail";

export function UsersPage() {
  // Estado de navegación (State Machine)
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // ============================================================
  // TANSTACK QUERY - Listar usuarios
  // ============================================================

  /**
   * NOTA: Este endpoint no está especificado en el plan original.
   * Asumimos que existe un endpoint GET /api/v1/users que retorna
   * lista de usuarios con sus roles asignados.
   *
   * Si el endpoint real es diferente, ajustar aquí.
   */
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Usuario seleccionado para vista detail
  const selectedUser = users.find((u) => u.id_usuario === selectedUserId);

  // ============================================================
  // NAVEGACIÓN (State Transitions)
  // ============================================================

  /**
   * Transición: list → detail
   * @param userId - ID del usuario a ver
   */
  const handleViewUser = (userId: number) => {
    setSelectedUserId(userId);
    setMode("detail");
  };

  /**
   * Transición: detail → list
   */
  const handleBackToList = () => {
    setSelectedUserId(null);
    setMode("list");
  };

  // ============================================================
  // RENDER CONDICIONAL (State Machine Output)
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header con navegación contextual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Botón "Volver" solo visible en modo detail */}
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

          {/* Título dinámico basado en modo */}
          <div>
            <h1 className="text-3xl font-bold text-txt-body">
              {mode === "list" && "Gestión de Usuarios"}
              {mode === "detail" && selectedUser && (
                <>
                  {selectedUser.nombre} {selectedUser.apellido_paterno}
                </>
              )}
            </h1>
            <p className="text-txt-muted mt-1">
              {mode === "list" &&
                "Administra roles y permisos de usuarios del sistema"}
              {mode === "detail" && selectedUser && (
                <>
                  @{selectedUser.usuario} · Expediente:{" "}
                  {selectedUser.numero_expediente || "N/A"}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Ícono decorativo en modo list */}
        {mode === "list" && (
          <div className="hidden md:block">
            <Users className="h-12 w-12 text-brand opacity-20" />
          </div>
        )}
      </div>

      {/* Vista condicional según modo */}
      {mode === "list" && (
        <UsersList
          users={users}
          isLoading={isLoading}
          error={error}
          onViewUser={handleViewUser}
        />
      )}

      {mode === "detail" && selectedUserId && (
        <div className="space-y-6">
          {/* Card de información del usuario */}
          <div className="bg-white rounded-lg shadow-sm border border-line-struct p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-txt-muted">Usuario</p>
                <p className="font-semibold text-txt-body">
                  @{selectedUser?.usuario}
                </p>
              </div>
              <div>
                <p className="text-sm text-txt-muted">Nombre Completo</p>
                <p className="font-semibold text-txt-body">
                  {selectedUser?.nombre} {selectedUser?.apellido_paterno}{" "}
                  {selectedUser?.apellido_materno}
                </p>
              </div>
              <div>
                <p className="text-sm text-txt-muted">Número de Expediente</p>
                <p className="font-semibold text-txt-body font-mono">
                  {selectedUser?.numero_expediente || "No asignado"}
                </p>
              </div>
            </div>
          </div>

          {/* Gestión de Roles */}
          <UserRolesManager userId={selectedUserId} />

          {/* Gestión de Permission Overrides */}
          <UserPermissionOverrides userId={selectedUserId} />
        </div>
      )}
    </div>
  );
}

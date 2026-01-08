import { useState, useMemo } from "react";
import { ArrowLeft, Users, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UsersList } from "./UsersList";
import { UserRolesManager } from "./UserRolesManager";
import { UserPermissionOverrides } from "./UserPermissionOverrides";
import { api } from "@api/client";
import type { User, UsersListResponse } from "@api/types/users.types";

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
   * IMPORTANTE: El endpoint GET /api/v1/users retorna un objeto paginado:
   * {
   *   items: User[],
   *   page: number,
   *   page_size: number,
   *   total: number,
   *   total_pages: number
   * }
   *
   * Por eso destructuramos `response.data.items` en el queryFn.
   * Si intentás retornar `response.data` directo, `users` será un objeto
   * y `users.find()` explotará con "TypeError: users.find is not a function".
   *
   * OPCIÓN FUTURA: Si querés paginación server-side, guardá el objeto completo
   * en vez de solo `items`, y usá `users.items.find()` más abajo.
   */
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get<UsersListResponse>("/users");

      // Validación defensiva: verificar que la respuesta tenga la estructura esperada
      if (!response.data || !Array.isArray(response.data.items)) {
        console.error("Respuesta inesperada del backend:", response.data);
        throw new Error("El servidor retornó una estructura inválida");
      }

      // ✅ CORRECTO: Extraer el array de items del objeto paginado
      return response.data.items;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Usuario seleccionado para vista detail (con validación defensiva)
  const selectedUser = useMemo(() => {
    // Early return si no hay userId seleccionado
    if (!selectedUserId) return null;

    // Validación defensiva: asegurarse que users sea un array
    if (!Array.isArray(users)) {
      console.error("users no es un array:", users);
      return null;
    }

    // Buscar usuario y retornar null si no existe (en vez de undefined)
    return users.find((u) => u.id_usuario === selectedUserId) ?? null;
  }, [selectedUserId, users]);

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
        <>
          {/* Manejo de error en parent component */}
          {error && (
            <div className="rounded-lg border border-status-critical bg-status-critical/10 p-4">
              <p className="text-status-critical">
                Error al cargar usuarios:{" "}
                {error instanceof Error ? error.message : "Error desconocido"}
              </p>
            </div>
          )}

          <UsersList
            users={users}
            isLoading={isLoading}
            error={error}
            onViewUser={handleViewUser}
          />
        </>
      )}

      {mode === "detail" && selectedUserId && (
        <>
          {/* Empty State: Usuario no encontrado */}
          {!selectedUser ? (
            <div className="bg-white rounded-lg shadow-sm border border-line-struct p-12 text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-status-alert mb-4" />
              <h3 className="text-xl font-semibold text-txt-body mb-2">
                Usuario no encontrado
              </h3>
              <p className="text-txt-muted mb-6 max-w-md mx-auto">
                El usuario puede haber sido eliminado o no tenés permisos para
                verlo. La lista de usuarios se revalidó y este usuario ya no
                existe.
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
          ) : (
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
                    <p className="text-sm text-txt-muted">
                      Número de Expediente
                    </p>
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
        </>
      )}
    </div>
  );
}

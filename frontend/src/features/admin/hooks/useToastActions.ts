/**
 * useToastActions - Hook para gestionar toasts mejorados con undo actions
 *
 * ARQUITECTURA:
 * - Centraliza la lógica de toasts de usuarios
 * - Mensajes descriptivos que mencionan nombre del usuario
 * - Undo actions automáticos para operaciones no-críticas
 * - Loading states durante mutaciones
 *
 * PATRÓN: Factory Hook
 * - Genera funciones pre-configuradas para cada tipo de acción
 * - Separa acciones críticas (requieren confirmación) de no-críticas (permiten undo)
 *
 * CLASIFICACIÓN DE ACCIONES:
 * - Críticas: Crear usuario, eliminar permanente → Require confirm dialog
 * - Semi-críticas: Desactivar usuario, revocar rol → Confirm + undo
 * - No críticas: Activar, editar, asignar roles → Undo directo
 *
 * USO:
 * ```tsx
 * const { showActivateToast, showDeactivateToast, showErrorToast } = useToastActions();
 *
 * // En mutation onSuccess:
 * showActivateToast(user, () => handleDeactivate(user.id_usuario));
 * ```
 */

import { toast } from "sonner";
import type { UserDetail, User } from "@api/types";

/**
 * Tipos de acciones clasificadas por criticidad
 */
type UndoAction = () => void | Promise<void>;

/**
 * Helper: Construir nombre completo
 */
const getFullName = (user: User | UserDetail): string => {
  return `${user.nombre} ${user.paterno} ${user.materno}`;
};

/**
 * Hook principal
 */
export const useToastActions = () => {
  // ============================================================
  // ACCIONES NO CRÍTICAS (con undo)
  // ============================================================

  /**
   * Toast cuando se activa un usuario
   * Permite deshacer (desactivar de nuevo)
   */
  const showActivateToast = (user: User | UserDetail, onUndo: UndoAction) => {
    const fullName = getFullName(user);

    toast.success("Usuario activado", {
      description: fullName,
      action: {
        label: "Deshacer",
        onClick: async () => {
          try {
            await onUndo();
            toast.info("Acción revertida");
          } catch (error) {
            toast.error("Error al deshacer", {
              description:
                error instanceof Error ? error.message : "Inténtalo nuevamente",
            });
          }
        },
      },
      duration: 5000,
    });
  };

  /**
   * Toast cuando se desactiva un usuario
   * Permite deshacer (reactivar)
   */
  const showDeactivateToast = (user: User | UserDetail, onUndo: UndoAction) => {
    const fullName = getFullName(user);

    toast.success("Usuario desactivado", {
      description: fullName,
      action: {
        label: "Deshacer",
        onClick: async () => {
          try {
            await onUndo();
            toast.info("Acción revertida");
          } catch (error) {
            toast.error("Error al deshacer", {
              description:
                error instanceof Error ? error.message : "Inténtalo nuevamente",
            });
          }
        },
      },
      duration: 5000,
    });
  };

  /**
   * Toast cuando se actualiza un usuario
   * Permite deshacer (revertir cambios)
   */
  const showUpdateToast = (user: User | UserDetail, onUndo?: UndoAction) => {
    const fullName = getFullName(user);

    toast.success("Usuario actualizado", {
      description: fullName,
      action: onUndo
        ? {
            label: "Deshacer",
            onClick: async () => {
              try {
                await onUndo();
                toast.info("Cambios revertidos");
              } catch (error) {
                toast.error("Error al deshacer", {
                  description:
                    error instanceof Error
                      ? error.message
                      : "Inténtalo nuevamente",
                });
              }
            },
          }
        : undefined,
      duration: onUndo ? 5000 : 3000,
    });
  };

  /**
   * Toast cuando se asignan roles
   * Permite deshacer (revocar roles recién asignados)
   */
  const showAssignRolesToast = (
    user: User | UserDetail,
    rolesCount: number,
    onUndo?: UndoAction,
  ) => {
    const fullName = getFullName(user);

    toast.success(`${rolesCount} rol(es) asignado(s) a "${fullName}"`, {
      description: "Los permisos fueron actualizados",
      action: onUndo
        ? {
            label: "Deshacer",
            onClick: async () => {
              try {
                await onUndo();
                toast.info(`Roles de "${fullName}" revertidos`);
              } catch (error) {
                toast.error("No se pudo deshacer la asignación", {
                  description:
                    error instanceof Error
                      ? error.message
                      : "Error desconocido",
                });
              }
            },
          }
        : undefined,
      duration: onUndo ? 5000 : 3000,
    });
  };

  /**
   * Toast cuando se cambia el rol primario
   */
  const showChangePrimaryRoleToast = (
    user: User | UserDetail,
    roleName: string,
    onUndo?: UndoAction,
  ) => {
    const fullName = getFullName(user);

    toast.success(`Rol primario de "${fullName}" actualizado`, {
      description: `Ahora es: ${roleName}`,
      action: onUndo
        ? {
            label: "Deshacer",
            onClick: async () => {
              try {
                await onUndo();
                toast.info(`Rol primario de "${fullName}" revertido`);
              } catch (error) {
                toast.error("No se pudo deshacer el cambio", {
                  description:
                    error instanceof Error
                      ? error.message
                      : "Error desconocido",
                });
              }
            },
          }
        : undefined,
      duration: onUndo ? 5000 : 3000,
    });
  };

  // ============================================================
  // ACCIONES SEMI-CRÍTICAS (confirmación + feedback)
  // ============================================================

  /**
   * Toast cuando se revoca un rol
   * Sin undo porque es semi-crítico (ya hubo confirmación)
   */
  const showRevokeRoleToast = (user: User | UserDetail, roleName: string) => {
    const fullName = getFullName(user);

    toast.success(`Rol "${roleName}" revocado de "${fullName}"`, {
      description: "Los permisos fueron actualizados",
      duration: 3000,
    });
  };

  // ============================================================
  // ACCIONES CRÍTICAS (solo feedback, sin undo)
  // ============================================================

  /**
   * Toast cuando se crea un usuario
   * Sin undo porque genera contraseña temporal (irreversible)
   */
  const showCreateUserToast = (username: string, tempPassword: string) => {
    toast.success(`Usuario "${username}" creado exitosamente`, {
      description: `Contraseña temporal generada (copiar y entregar al usuario)`,
      duration: 10000, // 10 segundos para dar tiempo a leer
    });
  };

  // ============================================================
  // ESTADOS DE CARGA
  // ============================================================

  /**
   * Toast de loading para operaciones largas
   * Retorna el ID del toast para poder actualizarlo/cerrarlo
   */
  const showLoadingToast = (
    action: string,
    userName?: string,
  ): string | number => {
    const message = userName
      ? `${action} usuario "${userName}"...`
      : `${action}...`;

    return toast.loading(message, {
      description: "Por favor esperá un momento",
    });
  };

  /**
   * Cerrar un toast de loading (por ID)
   */
  const dismissToast = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  // ============================================================
  // ERRORES
  // ============================================================

  /**
   * Toast de error genérico
   * Muestra mensaje descriptivo y permite reintentar si hay callback
   */
  const showErrorToast = (
    action: string,
    error: unknown,
    onRetry?: () => void,
  ) => {
    // Extraer mensaje del error
    let errorMessage = "Error desconocido";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      errorMessage = axiosError.response?.data?.message || "Error del servidor";
    }

    toast.error(`No se pudo ${action}`, {
      description: errorMessage,
      action: onRetry
        ? {
            label: "Reintentar",
            onClick: onRetry,
          }
        : undefined,
      duration: 6000,
    });
  };

  /**
   * Toast de error específico para usuario
   */
  const showUserErrorToast = (
    action: string,
    user: User | UserDetail,
    error: unknown,
  ) => {
    const fullName = getFullName(user);

    let errorMessage = "Error desconocido";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      errorMessage = axiosError.response?.data?.message || "Error del servidor";
    }

    toast.error(`No se pudo ${action} a "${fullName}"`, {
      description: errorMessage,
      duration: 6000,
    });
  };

  // ============================================================
  // RETURN
  // ============================================================

  return {
    // No críticas (con undo)
    showActivateToast,
    showDeactivateToast,
    showUpdateToast,
    showAssignRolesToast,
    showChangePrimaryRoleToast,

    // Semi-críticas (sin undo)
    showRevokeRoleToast,

    // Críticas (solo feedback)
    showCreateUserToast,

    // Estados
    showLoadingToast,
    dismissToast,

    // Errores
    showErrorToast,
    showUserErrorToast,
  };
};

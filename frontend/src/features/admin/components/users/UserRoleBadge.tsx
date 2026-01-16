/**
 * ============================================
 * COMPONENTE: UserRoleBadge
 * ============================================
 *
 * Badge que muestra el rol primario de un usuario con color diferenciado.
 *
 * **Decisión de Diseño:**
 * - Usamos las "líneas del metro" para diferenciar visualmente los roles
 * - Mapeo de colores por tipo de rol (admin → naranja, médico → azul, etc.)
 * - Fallback a gris para roles no reconocidos
 *
 * **Patrón Aplicado:**
 * - Visual differentiation: color ayuda a identificar rol rápidamente
 * - Extensible: fácil agregar nuevos roles al mapeo
 * - Accesibilidad: aria-label descriptivo
 */

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Mapeo de roles a colores Metro CDMX
 *
 * **Decisión de Colores:**
 * - ADMIN → brand (naranja Metro) = identidad corporativa
 * - MEDICO → line-blue = Línea 2 (medicina general)
 * - ENFERMERO → line-teal = Línea 4 (cuidados)
 * - RECEPCION → line-olive = Línea 3 (administrativo)
 * - default → muted (gris) = roles no categorizados
 */
const ROLE_COLOR_MAP: Record<string, string> = {
  ADMIN: "admin",
  ADMINISTRADOR: "admin",
  MEDICO: "medico",
  DOCTOR: "medico",
  ENFERMERO: "enfermero",
  ENFERMERA: "enfermero",
  RECEPCION: "recepcion",
  RECEPCIONISTA: "recepcion",
  DEFAULT: "default",
};

/**
 * Función helper para determinar el color del rol
 *
 * **Lógica:**
 * 1. Normaliza el rol a mayúsculas (case-insensitive)
 * 2. Busca en el mapeo exacto
 * 3. Fallback a 'default' si no se encuentra
 */
function getRoleVariant(roleName?: string): string {
  if (!roleName) return "default";

  const normalized = roleName.toUpperCase().trim();
  return ROLE_COLOR_MAP[normalized] || "default";
}

/**
 * Variantes de color por tipo de rol usando CVA
 */
const roleBadgeVariants = cva(
  // Base styles
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        admin: "bg-brand/10 text-brand", // Naranja Metro
        medico: "bg-[#007ac1]/10 text-[#007ac1]", // Línea 2 - Azul
        enfermero: "bg-[#49c0b7]/10 text-[#49c0b7]", // Línea 4 - Teal
        recepcion: "bg-[#b59b28]/10 text-[#b59b28]", // Línea 3 - Oliva
        default: "bg-subtle text-txt-muted", // Gris muted
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface UserRoleBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof roleBadgeVariants> {
  /** Nombre del rol (ej: "ADMIN", "MEDICO", "ENFERMERO") */
  roleName?: string;
  /** Clase CSS adicional para customización */
  className?: string;
}

/**
 * Badge de rol de usuario con color diferenciado
 *
 * @example
 * // Rol de administrador
 * <UserRoleBadge roleName="ADMIN" />
 *
 * @example
 * // Rol de médico
 * <UserRoleBadge roleName="MEDICO" />
 *
 * @example
 * // En tabla con datos (puede ser undefined)
 * <UserRoleBadge roleName={user.rol_primario} />
 *
 * @example
 * // Rol no reconocido (fallback a gris)
 * <UserRoleBadge roleName="CUSTOM_ROL" />
 */
const UserRoleBadge = forwardRef<HTMLSpanElement, UserRoleBadgeProps>(
  ({ roleName, variant, className, ...props }, ref) => {
    // Auto-determinar variant si no se especifica
    const computedVariant = variant || (getRoleVariant(roleName) as any);
    const displayName = roleName || "Sin rol";

    return (
      <span
        ref={ref}
        className={cn(
          roleBadgeVariants({ variant: computedVariant, className }),
        )}
        aria-label={`Rol: ${displayName}`}
        {...props}
      >
        {displayName}
      </span>
    );
  },
);

UserRoleBadge.displayName = "UserRoleBadge";

export { UserRoleBadge, roleBadgeVariants, getRoleVariant };

/**
 * ============================================
 * COMPONENTE: UserAvatar
 * ============================================
 *
 * Avatar circular con iniciales generadas automáticamente.
 *
 * **Decisión de Diseño:**
 * - Usamos generateAvatar() para colores consistentes
 * - El tamaño se controla vía CVA (class-variance-authority)
 * - Accesibilidad: aria-label con nombre completo del usuario
 *
 * **Patrón Aplicado:**
 * - Presentational component: recibe props, renderiza UI
 * - Variant-driven: sizes definidas con type-safety
 * - Composition: se puede usar en tabla, cards, headers, etc.
 */

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { generateAvatar } from "@/lib/utils/generateAvatar";
import { cn } from "@/lib/utils";

/**
 * Variantes de tamaño usando CVA
 *
 * **Por qué CVA:**
 * - Type-safe: TypeScript infiere los tipos automáticamente
 * - Composable: podemos combinar variantes
 * - Mantenible: cambios en una sola fuente de verdad
 */
const avatarVariants = cva(
  // Base styles (aplicados siempre)
  "inline-flex items-center justify-center rounded-full font-semibold select-none",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs", // 32px - Para tablas densas
        md: "h-10 w-10 text-sm", // 40px - Default, equilibrado
        lg: "h-12 w-12 text-base", // 48px - Para headers, cards destacadas
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface UserAvatarProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** Nombre completo del usuario (ej: "Juan García López") */
  fullName: string;
  /** Clase CSS adicional para customización */
  className?: string;
}

/**
 * Avatar de usuario con iniciales y color generado automáticamente
 *
 * @example
 * // Básico
 * <UserAvatar fullName="Juan García López" />
 *
 * @example
 * // Con tamaño específico
 * <UserAvatar fullName="María Rodríguez" size="lg" />
 *
 * @example
 * // En tabla (tamaño pequeño)
 * <UserAvatar fullName={user.nombre} size="sm" />
 */
const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(
  ({ fullName, size, className, ...props }, ref) => {
    // Generar avatar data (consistente para el mismo nombre)
    const avatar = generateAvatar(fullName);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        style={{
          backgroundColor: avatar.backgroundColor,
          color: avatar.textColor,
        }}
        aria-label={`Avatar de ${fullName}`}
        role="img"
        {...props}
      >
        {avatar.initials}
      </div>
    );
  },
);

UserAvatar.displayName = "UserAvatar";

export { UserAvatar, avatarVariants };

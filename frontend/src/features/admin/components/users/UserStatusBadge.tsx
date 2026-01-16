/**
 * ============================================
 * COMPONENTE: UserStatusBadge (MEJORADO)
 * ============================================
 *
 * Badge profesional de estado de usuario usando shadcn/ui + tokens Metro CDMX.
 *
 * **MEJORAS APLICADAS:**
 * 1. ✅ Usa Badge de shadcn como base (variants pre-configuradas)
 * 2. ✅ Colores Metro mejorados con border y opacidades refinadas
 * 3. ✅ Dot indicator más visible (size-2 vs 1.5)
 * 4. ✅ Font weight medium para mejor legibilidad
 * 5. ✅ Border sutil para más presencia visual
 *
 * **Decisión de Diseño:**
 * - Activo (stable): Verde esmeralda con border sutil → "Sistema OK"
 * - Inactivo (critical): Rojo con border sutil → "Requiere atención"
 * - Dot indicator: Punto sólido más grande para mejor visibilidad
 * - Border: 30% opacity del color base para diferenciación sutil
 *
 * **Tokens Metro CDMX:**
 * - Activo: `bg-status-stable/15 text-status-stable border-status-stable/30`
 * - Inactivo: `bg-status-critical/15 text-status-critical border-status-critical/30`
 *
 * **Patrón Aplicado:**
 * - Composition over configuration: usa Badge de shadcn como primitivo
 * - Semantic colors: el color transmite significado inmediato
 * - Visual hierarchy: dot + texto + border crean jerarquía clara
 * - Accessibility: aria-label descriptivo + contraste WCAG AA
 */

import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface UserStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Estado del usuario (true = activo, false = inactivo) */
  isActive: boolean;
  /** Clase CSS adicional para customización */
  className?: string;
}

/**
 * Badge de estado de usuario con diseño profesional shadcn
 *
 * **Comparación Antes/Ahora:**
 *
 * ANTES:
 * - Span genérico con clases manuales
 * - Dot indicator pequeño (1.5px)
 * - Sin border
 * - Opacidad 10% (poco contraste)
 *
 * AHORA:
 * - Badge de shadcn (component primitivo)
 * - Dot indicator visible (2px)
 * - Border sutil (30% opacity)
 * - Opacidad 15% (mejor contraste)
 * - Font medium (mejor legibilidad)
 *
 * @example
 * // Usuario activo
 * <UserStatusBadge isActive={true} />
 * // Resultado: Badge verde con "● Activo"
 *
 * @example
 * // Usuario inactivo
 * <UserStatusBadge isActive={false} />
 * // Resultado: Badge rojo con "● Inactivo"
 *
 * @example
 * // En tabla con datos (uso típico)
 * <UserStatusBadge isActive={user.est_usuario === "A"} />
 *
 * @example
 * // Con clase personalizada
 * <UserStatusBadge isActive={true} className="shadow-sm" />
 */
const UserStatusBadge = forwardRef<HTMLSpanElement, UserStatusBadgeProps>(
  ({ isActive, className, ...props }, ref) => {
    // Determinar variante del Badge según estado
    const variant = isActive ? "stable" : "critical";
    const label = isActive ? "Activo" : "Inactivo";

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn(
          // Mejoras visuales (override de Badge base)
          "gap-1.5 px-2.5 py-1", // Spacing generoso
          "font-medium", // Font weight para legibilidad
          "border", // Border para presencia
          // Colores personalizados Metro CDMX (más refinados)
          isActive
            ? [
                // Activo: Verde esmeralda con border sutil
                "bg-status-stable/15", // Background 15% opacity (antes 10%)
                "text-status-stable", // Texto sólido
                "border-status-stable/30", // Border sutil 30% opacity
                "hover:bg-status-stable/25", // Hover más visible
              ]
            : [
                // Inactivo: Rojo con border sutil
                "bg-status-critical/15", // Background 15% opacity
                "text-status-critical", // Texto sólido
                "border-status-critical/30", // Border sutil 30% opacity
                "hover:bg-status-critical/25", // Hover más visible
              ],
          className,
        )}
        aria-label={`Estado: ${label}`}
        {...props}
      >
        {/* Dot Indicator (mejorado) */}
        <span
          className={cn(
            "size-2 rounded-full shrink-0", // size-2 (8px) vs size-1.5 (6px) antes
            isActive ? "bg-status-stable" : "bg-status-critical",
          )}
          aria-hidden="true"
        />
        {/* Label */}
        {label}
      </Badge>
    );
  },
);

UserStatusBadge.displayName = "UserStatusBadge";

export { UserStatusBadge };

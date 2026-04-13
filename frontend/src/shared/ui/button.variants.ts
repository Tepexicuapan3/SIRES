import { cva } from "class-variance-authority";

/**
 * Button Variants - Sistema Metro CDMX
 *
 * Basado en shadcn/ui pero adaptado al sistema de diseño SISEM:
 * - bg-brand: Color institucional Metro (#fe5000)
 * - status-critical/alert/stable/info: Estados clínicos
 * - txt-body/muted/inverse: Jerarquía de texto
 * - rounded-xl: Consistencia visual en todo el sistema
 *
 * Co-located with button.tsx for better maintainability.
 */
export const buttonVariants = cva(
  // Base classes: estructura, estados, transiciones y accesibilidad
  [
    // Layout
    "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
    // Typography
    "text-sm font-semibold font-body",
    // Shape - rounded-xl consistente en todo el sistema
    "rounded-xl",
    // Interaction
    "cursor-pointer select-none",
    // Transitions
    "transition-all duration-200",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // Focus state - shadcn pattern con ring-offset
    "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    // SVG handling
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // Acción primaria: Naranja Metro CDMX
        default: [
          "bg-brand text-txt-inverse",
          "hover:bg-brand-hover",
          "active:scale-[0.98]",
          "shadow-sm",
        ],

        // Acciones destructivas: Rojo clínico (eliminar, cancelar)
        destructive: [
          "bg-status-critical text-white",
          "hover:bg-status-critical/90",
          "active:scale-[0.98]",
          "shadow-sm",
          "focus-visible:ring-status-critical",
        ],

        // Outline: Borde visible, fondo transparente (acciones secundarias)
        outline: [
          "border border-line-struct bg-paper text-txt-body",
          "hover:bg-subtle hover:border-line-struct/80",
          "active:scale-[0.98]",
          "focus-visible:ring-line-struct",
        ],

        // Secondary: Fondo sutil (acciones terciarias)
        secondary: [
          "bg-subtle text-txt-body",
          "hover:bg-subtle/80",
          "active:scale-[0.98]",
          "focus-visible:ring-line-struct",
        ],

        // Ghost: Sin fondo, solo hover (navegación, acciones discretas)
        ghost: [
          "text-txt-body",
          "hover:bg-subtle",
          "active:bg-subtle/80",
          "focus-visible:ring-line-struct",
        ],

        // Link: Estilo de enlace (navegación inline)
        link: [
          "text-brand",
          "underline-offset-4 hover:underline",
          "focus-visible:ring-brand",
          // Links don't need the same padding/height
          "h-auto p-0",
        ],
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 px-3 gap-1.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        xl: "h-14 px-8 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

import { cva } from "class-variance-authority";

/**
 * Button Variants - Sistema Metro CDMX
 *
 * Usa tokens semánticos del sistema de diseño:
 * - bg-brand: Color institucional Metro (#fe5000)
 * - status-critical/alert/stable/info: Estados clínicos
 * - txt-body/muted/inverse: Jerarquía de texto
 *
 * Extraído del componente Button para evitar Fast Refresh warnings.
 */
export const buttonVariants = cva(
  // Clases base: estructura, estados y accesibilidad
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold font-body transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Acción primaria: Naranja Metro CDMX
        default:
          "bg-brand text-txt-inverse hover:bg-brand-hover focus-visible:ring-brand shadow-sm",

        // Acciones destructivas: Rojo clínico (eliminar, cancelar)
        destructive:
          "bg-status-critical text-white hover:bg-status-critical/90 focus-visible:ring-status-critical/50 shadow-sm",

        // Outline: Borde visible, fondo transparente (acciones secundarias)
        outline:
          "border border-line-struct bg-paper text-txt-body hover:bg-subtle hover:text-txt-body focus-visible:ring-line-struct",

        // Secondary: Fondo sutil (acciones terciarias)
        secondary:
          "bg-subtle text-txt-body hover:bg-subtle/80 focus-visible:ring-line-struct",

        // Ghost: Sin fondo, solo hover (navegación, acciones discretas)
        ghost:
          "hover:bg-subtle hover:text-txt-body focus-visible:ring-line-struct",

        // Link: Estilo de enlace (navegación inline)
        link: "text-brand underline-offset-4 hover:underline focus-visible:ring-brand",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
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

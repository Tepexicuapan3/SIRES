import type { ReactNode } from "react";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AuthCard - Componente Reutilizable para Flujos de Autenticación
 *
 * PROPÓSITO:
 * Provee un contenedor consistente (glassmorphism) para todas las vistas de auth:
 * - Login
 * - Recovery (request/verify/reset)
 * - Onboarding (terms/password)
 *
 * DECISIONES DE DISEÑO:
 * - Identidad: Logo SIRES redondo
 * - Ancho: Configurable (sm/md/lg) con mobile-first responsive
 * - Glassmorphism: bg-paper con backdrop-blur (consistente cross-browser)
 * - Accesibilidad: ARIA labels, navegación por teclado, min-h-[44px] en botones
 */

interface AuthCardProps {
  /** Título principal (h1) - requerido solo si hideHeader=false */
  title?: string;
  /** Subtítulo opcional (p) */
  subtitle?: string;
  /** Clase extra para título */
  titleClassName?: string;
  /** Clase extra para subtítulo */
  subtitleClassName?: string;
  /** Contenido del card (formularios, términos, etc.) */
  children: ReactNode;
  /** Mostrar botón "Volver" (default: false) */
  showBackButton?: boolean;
  /** Callback al hacer click en "Volver" */
  onBack?: () => void;
  /** Ancho máximo del card (default: "md") */
  maxWidth?: "sm" | "md" | "lg";
  /** Ocultar header con logo SIRES (útil si el children tiene su propio header) */
  hideHeader?: boolean;
  /** Posicionar botón "Volver" en esquina superior izquierda (default: false, debajo header) */
  backButtonCorner?: boolean;
  /** Ícono custom para reemplazar logo SIRES (ej: Lock para password step) */
  customIcon?: ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-sm", // ~384px (ej: OTP simple)
  md: "max-w-md", // ~448px (login/password forms)
  lg: "max-w-2xl", // ~672px (términos con mucho texto)
} as const;

const currentYear = new Date().getFullYear();

const BackButton = ({
  onBack,
  className,
}: {
  onBack: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onBack}
    className={cn(
      "flex items-center gap-1 text-xs text-txt-muted hover:text-brand transition-colors min-h-11",
      className,
    )}
    aria-label="Volver al paso anterior"
  >
    <ArrowLeft size={16} aria-hidden="true" />
    <span className="font-medium">Volver</span>
  </button>
);

export const AuthCard = ({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  children,
  showBackButton = false,
  onBack,
  maxWidth = "md",
  hideHeader = false,
  backButtonCorner = false,
  customIcon,
}: AuthCardProps) => {
  return (
    <div
      className={cn(
        "w-full z-10 animate-fade-in-up transition-all duration-500 ease-in-out",
        maxWidthClasses[maxWidth],
      )}
    >
      {/* Card Container (Glassmorphism Metro CDMX) */}
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-paper/85 dark:bg-paper/75 border border-line-struct dark:border-white/20 backdrop-blur-md shadow-2xl shadow-brand/5 dark:shadow-black/20 transition-all duration-500 ease-in-out",
          hideHeader ? "p-0" : "p-8 sm:p-10",
        )}
      >
        {/* Botón Volver en Esquina Superior Izquierda (condicional) */}
        {showBackButton && onBack && backButtonCorner && (
          <BackButton
            onBack={onBack}
            className="absolute top-4 left-4 z-10 px-2 py-2 rounded-lg hover:bg-subtle"
          />
        )}

        {/* Header con Logo SIRES (condicional) */}
        {!hideHeader && (
          <div className="flex flex-col items-center text-center mb-6">
            {/* Logo/Ícono Wrapper */}
            {customIcon ? (
              <div className="w-16 h-16 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand/10">
                {customIcon}
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl shadow-brand/20 mb-6 transition-all duration-300 hover:scale-105 hover:rotate-2">
                <img
                  src="/SIRES.webp"
                  alt="Logo SIRES"
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                />
              </div>
            )}

            {/* Título del paso */}
            <h2
              className={cn(
                "text-xl sm:text-2xl font-display font-semibold text-txt-body",
                titleClassName,
              )}
            >
              {title}
            </h2>

            {/* Subtítulo (opcional) */}
            {subtitle && (
              <p
                className={cn(
                  "text-base text-txt-muted mt-2",
                  subtitleClassName,
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Botón Volver Debajo Header (solo si NO backButtonCorner) */}
        {showBackButton && onBack && !hideHeader && !backButtonCorner && (
          <BackButton onBack={onBack} className="mb-4 -mt-2" />
        )}

        {/* Contenido del Card */}
        <div className={cn("relative z-10", hideHeader && "p-8 sm:p-10")}>
          {/* Botón Volver cuando hideHeader (posición alternativa) */}
          {showBackButton && onBack && hideHeader && (
            <BackButton onBack={onBack} className="mb-4" />
          )}

          {children}
        </div>
      </div>

      {/* Footer Externo (consistente) */}
      <p className="mt-8 text-center text-xs text-txt-muted/70">
        © {currentYear} Sistema de Transporte Colectivo.{" "}
        <br className="sm:hidden" />
        Activación de cuenta de usuario.
      </p>
    </div>
  );
};

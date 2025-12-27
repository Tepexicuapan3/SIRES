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
 * - Identidad: Logo SIRES redondo (no Metro institucional)
 * - Ancho: Configurable (sm/md/lg) con mobile-first responsive
 * - Glassmorphism: bg-paper con backdrop-blur (consistente cross-browser)
 * - Accesibilidad: ARIA labels, navegación por teclado, min-h-[44px] en botones
 *
 * @see LoginPage.tsx - Referencia de diseño glassmorphism
 * @see SHADCN_IMPLEMENTATION.md - Sistema de tokens Metro CDMX
 */

interface AuthCardProps {
  /** Título principal (h1) - requerido solo si hideHeader=false */
  title?: string;
  /** Subtítulo opcional (p) */
  subtitle?: string;
  /** Contenido del card (formularios, términos, etc.) */
  children: React.ReactNode;
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
  customIcon?: React.ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-sm", // ~384px (ej: OTP simple)
  md: "max-w-md", // ~448px (login/password forms)
  lg: "max-w-2xl", // ~672px (términos con mucho texto)
};

export const AuthCard = ({
  title,
  subtitle,
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
      className={`w-full ${maxWidthClasses[maxWidth]} z-10 animate-fade-in-up transition-all duration-500 ease-in-out`}
    >
      {/* 
        Card Container (Glassmorphism Metro CDMX)
        
        TRANSICIÓN SUAVE:
        - transition-all duration-500: Anima resize cuando cambia maxWidth
        - ease-in-out: Curva de animación natural (no abrupta)
        - animate-fade-in-up: Entrada inicial con fade + translateY
        
        CONSISTENCIA VISUAL:
        - bg-paper/85 dark:bg-paper/75: Misma opacidad que LoginPage
        - backdrop-blur-md: Blur moderado (Safari compatible)
        - border-line-struct: Token semántico para bordes estructurales
        - shadow-2xl + shadow-brand/5: Sombra con tinte naranja Metro
        
        RESPONSIVE:
        - p-8 sm:p-10: Padding reducido en móvil
        - rounded-3xl: Bordes suaves (marca SIRES)
      */}
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-paper/85 dark:bg-paper/75 border border-line-struct dark:border-white/20 backdrop-blur-md shadow-2xl shadow-brand/5 dark:shadow-black/20 transition-all duration-500 ease-in-out",
          hideHeader ? "p-0" : "p-8 sm:p-10",
        )}
      >
        {/* 
          Botón Volver en Esquina Superior Izquierda (condicional)
          
          NUEVA FUNCIONALIDAD (Iteración 3):
          - Aparece cuando backButtonCorner={true}
          - Posición absoluta sin ocupar flujo del documento
          - NO desplaza contenido del header
          - Más compacto y discreto que versión debajo del header
        */}
        {showBackButton && onBack && backButtonCorner && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-1 text-xs text-txt-muted hover:text-brand transition-colors z-10 min-h-[44px] px-2 py-2 rounded-lg hover:bg-subtle"
            aria-label="Volver al paso anterior"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span className="font-medium">Volver</span>
          </button>
        )}

        {/* Header con Logo SIRES (condicional) */}
        {!hideHeader && (
          <div className="flex flex-col items-center text-center mb-6">
            {/* 
              Logo/Ícono Wrapper
              
              DECISIÓN DE DISEÑO (Iteración 3):
              - Si customIcon existe → renderiza ícono custom (ej: Lock para password)
              - Si NO customIcon → renderiza logo SIRES tradicional
              
              RAZONAMIENTO:
              - Login/Recovery: Logo SIRES (identidad institucional)
              - Onboarding PASSWORD: Ícono Lock (refuerza seguridad + motivacional)
            */}
            {customIcon ? (
              <div className="w-16 h-16 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand/10">
                {customIcon}
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-xl shadow-brand/20 mb-4 transition-all duration-300 hover:scale-105">
                <img
                  src="/SIRES.webp"
                  alt="Logo SIRES"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </div>
            )}

            {/* Marca SIRES (letreado) - Solo si NO hay customIcon */}
            {!customIcon && (
              <h1 className="text-xl sm:text-2xl font-display font-bold text-txt-body mb-4">
                S I R E S
              </h1>
            )}

            {/* Título del paso */}
            <h2 className="text-lg sm:text-xl font-semibold text-txt-body">
              {title}
            </h2>

            {/* Subtítulo (opcional) */}
            {subtitle && (
              <p className="text-sm text-txt-muted mt-2">{subtitle}</p>
            )}
          </div>
        )}

        {/* Botón Volver Debajo Header (Legacy - solo si NO backButtonCorner) */}
        {showBackButton && onBack && !hideHeader && !backButtonCorner && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-txt-muted flex items-center gap-1 hover:text-brand transition-colors mb-4 min-h-[44px] -mt-2"
            aria-label="Volver al paso anterior"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Volver
          </button>
        )}

        {/* Contenido del Card */}
        <div className={cn("relative z-10", hideHeader && "p-8 sm:p-10")}>
          {/* Botón Volver cuando hideHeader (posición alternativa) */}
          {showBackButton && onBack && hideHeader && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-txt-muted flex items-center gap-1 hover:text-brand transition-colors mb-4 min-h-[44px]"
              aria-label="Volver al paso anterior"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Volver
            </button>
          )}

          {children}
        </div>
      </div>

      {/* Footer Externo (consistente) */}
      <p className="mt-8 text-center text-xs text-txt-muted/70">
        © {new Date().getFullYear()} Sistema de Transporte Colectivo.{" "}
        <br className="sm:hidden" />
        Activación de cuenta de usuario.
      </p>
    </div>
  );
};

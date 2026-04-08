import type { ReactNode } from "react";

import { ArrowLeft } from "lucide-react";
import { cn } from "@shared/utils/styling/cn";
import { Button } from "@shared/ui/button";

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  maxWidth?: "sm" | "md" | "lg";
  hideHeader?: boolean;
  backButtonCorner?: boolean;
  customIcon?: ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

const currentYear = new Date().getFullYear();

const BackButton = ({
  onBack,
  className,
}: {
  onBack: () => void;
  className?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onBack}
    className={cn(
      "group gap-1 text-xs text-txt-muted hover:text-brand",
      className,
    )}
    aria-label="Volver al paso anterior"
  >
    <ArrowLeft
      size={16}
      className="group-hover:-translate-x-1 transition-transform"
      aria-hidden="true"
    />
    <span className="font-medium">Volver</span>
  </Button>
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
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-paper/85 dark:bg-paper/75 border border-line-struct dark:border-white/20 backdrop-blur-md shadow-2xl shadow-brand/5 dark:shadow-black/20 transition-all duration-500 ease-in-out",
          hideHeader ? "p-0" : "p-8 sm:p-10",
        )}
      >
        {showBackButton && onBack && backButtonCorner && (
          <BackButton
            onBack={onBack}
            className="absolute top-4 left-4 z-10 px-2 py-2 rounded-lg hover:bg-subtle"
          />
        )}

        {!hideHeader && (
          <div className="flex flex-col items-center text-center mb-6">
            {customIcon ? (
              <div className="w-16 h-16 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand/10">
                {customIcon}
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl shadow-brand/20 mb-6 transition-all duration-300 hover:scale-105 hover:rotate-2">
                <img
                  src="/assets/brand/logos/primary/sires.webp"
                  alt="Logo SISEM"
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                />
              </div>
            )}

            <h2
              className={cn(
                "text-xl sm:text-2xl font-display font-semibold text-txt-body",
                titleClassName,
              )}
            >
              {title}
            </h2>

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

        {showBackButton && onBack && !hideHeader && !backButtonCorner && (
          <BackButton onBack={onBack} className="mb-4 -mt-2" />
        )}

        <div className={cn("relative z-10", hideHeader && "p-8 sm:p-10")}>
          {showBackButton && onBack && hideHeader && (
            <BackButton onBack={onBack} className="mb-4" />
          )}

          {children}
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-txt-muted/70">
        © {currentYear} Sistema de Transporte Colectivo.{" "}
        <br className="sm:hidden" />
        Activación de cuenta de usuario.
      </p>
    </div>
  );
};

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const containerSizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const logoSizeMap = {
  sm: "w-3 h-3",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
};

export const LoadingSpinner = ({
  size = "md",
  className,
  text,
  fullScreen = true,
}: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center z-50 transition-all duration-300",
        fullScreen
          ? "fixed inset-0 bg-app backdrop-blur-md"
          : "w-full h-full min-h-[200px] bg-transparent",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          containerSizeMap[size]
        )}
      >
        {/* 1. Track del Spinner (Anillo de fondo suave) */}
        <div className="absolute inset-0 rounded-full border-[3px] border-brand/10 dark:border-brand/20" />

        {/* 2. Spinner Activo (Gira) */}
        <div className="absolute inset-0 rounded-full border-[3px] border-t-brand border-r-transparent border-b-transparent border-l-transparent animate-spin" />

        {/* 3. Anillo Decorativo (Efecto sutil de rotación inversa para tecnología) */}
        {size === "xl" && (
          <div
            className="absolute inset-1 rounded-full border-2 border-b-brand/30 border-t-transparent border-r-transparent border-l-transparent animate-spin-slow opacity-50"
            style={{ animationDirection: "reverse" }}
          />
        )}

        {/* 4. Logo Central (Estático o Pulsante) */}
        <div
          className={cn("relative z-10 animate-pulse-slow", logoSizeMap[size])}
        >
          {/* Usamos un div con mask-image o simplemente el SVG img */}
          <img
            src="/icons/metro-logo-bn.svg"
            alt="Cargando"
            className="w-full h-full object-contain opacity-90 drop-shadow-sm"
            // Truco CSS para que el logo negro se vea naranja o blanco según el tema si es SVG
            // style={{ filter: "invert(42%) sepia(93%) saturate(1352%) hue-rotate(346deg) brightness(101%) contrast(101%)" }}
          />
        </div>
      </div>

      {/* Texto de Carga */}
      {text && (
        <div className="mt-4 flex flex-col items-center gap-1 animate-fade-in-up">
          <p className="font-display text-sm font-semibold tracking-wide text-txt-body">
            {text}
          </p>
          {fullScreen && (
            <span className="text-xs text-txt-muted">Por favor espere...</span>
          )}
        </div>
      )}
    </div>
  );
};

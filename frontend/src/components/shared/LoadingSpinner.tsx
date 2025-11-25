import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: "w-5 h-5 border-2",
  md: "w-9 h-9 border-2",
  lg: "w-13 h-13 border-3",
  xl: "w-17 h-17 border-4",
};

const logoSizeMap = {
  sm: "w-2 h-2",
  md: "w-4 h-4",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export const LoadingSpinner = ({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative">
        <div
          className={cn(
            "border-primary border-t-transparent rounded-full animate-spin",
            sizeMap[size],
            className
          )}
          role="status"
          aria-label="Cargando"
        />
        <img
          src="/icons/metro-logo-bn.svg"
          alt="Metro CDMX"
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            logoSizeMap[size]
          )}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
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
        "flex flex-col items-center justify-center z-50",
        fullScreen
          ? "fixed inset-0 bg-app/80 backdrop-blur-sm"
          : "w-full h-full min-h-[100px] flex-1",
        className
      )}
    >
      {/* Spinner de líneas minimalista */}
      <Loader 
        className={cn(
          "animate-spin text-brand", 
          sizeMap[size]
        )} 
      />

      {/* Texto opcional */}
      {text && (
        <p className="mt-3 text-sm font-medium text-txt-muted animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
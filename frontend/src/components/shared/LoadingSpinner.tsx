import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
  xl: "size-14",
} as const;

const Spinner = ({ className, ...props }: ComponentProps<"svg">) => {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin text-brand", className)}
      {...props}
    />
  );
};

export const LoadingSpinner = ({
  size = "md",
  className,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center z-50",
        fullScreen
          ? "fixed inset-0 bg-app/80 backdrop-blur-sm"
          : "w-full h-full min-h-24 flex-1",
        className,
      )}
      aria-live="polite"
    >
      <Spinner className={sizeMap[size]} />
    </div>
  );
};

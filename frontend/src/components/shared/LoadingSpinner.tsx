import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  fullScreen?: boolean;
}

const Spinner = ({ className, ...props }: ComponentProps<"svg">) => {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin text-brand", className)}
      {...props}
    />
  );
};

export const LoadingSpinner = ({
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
      <Spinner />
    </div>
  );
};

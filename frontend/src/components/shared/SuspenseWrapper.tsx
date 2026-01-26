import { Suspense, type ReactNode } from "react";

import { LoadingSpinner } from "./LoadingSpinner";

/**
 * SuspenseWrapper - Wrapper para lazy-loaded routes
 *
 * Muestra LoadingSpinner mientras se carga el componente asíncrono.
 * Extraído de Routes.tsx para evitar Fast Refresh warnings.
 *
 * Props:
 * - fullScreen: Usa spinner fullscreen para pantallas sin layout.
 * - className: Ajusta el contenedor del spinner cuando no es fullscreen.
 * - size: Propagado a LoadingSpinner para controlar el tamaño del loader.
 */
export const SuspenseWrapper = ({
  children,
  fullScreen = false,
  className,
  size,
}: {
  children: ReactNode;
  fullScreen?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) => (
  <Suspense
    fallback={
      <LoadingSpinner
        fullScreen={fullScreen}
        className={className}
        size={size}
      />
    }
  >
    {children}
  </Suspense>
);

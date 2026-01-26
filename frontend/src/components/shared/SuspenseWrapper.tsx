import { Suspense, type ReactNode } from "react";

import { LoadingSpinner } from "@components/shared/LoadingSpinner";

/**
 * SuspenseWrapper - Wrapper para lazy-loaded routes
 *
 * Muestra LoadingSpinner mientras se carga el componente asíncrono.
 * Extraído de Routes.tsx para evitar Fast Refresh warnings.
 *
 * Props:
 * - fullScreen: Usa spinner fullscreen para pantallas sin layout.
 * - className: Ajusta el contenedor del spinner cuando no es fullscreen.
 */
export const SuspenseWrapper = ({
  children,
  fullScreen = false,
  className,
}: {
  children: ReactNode;
  fullScreen?: boolean;
  className?: string;
}) => (
  <Suspense
    fallback={<LoadingSpinner fullScreen={fullScreen} className={className} />}
  >
    {children}
  </Suspense>
);

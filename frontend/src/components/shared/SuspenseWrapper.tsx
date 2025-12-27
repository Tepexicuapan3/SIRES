import { Suspense } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * SuspenseWrapper - Wrapper para lazy-loaded routes
 *
 * Muestra LoadingSpinner mientras se carga el componente asíncrono.
 * Extraído de Routes.tsx para evitar Fast Refresh warnings.
 */
export const SuspenseWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <Suspense
    fallback={<LoadingSpinner fullScreen={true} text="Cargando sistema..." />}
  >
    {children}
  </Suspense>
);

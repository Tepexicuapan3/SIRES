/**
 * ============================================
 * MAIN LAYOUT - TEMPORAL (Sin Sidebar)
 * ============================================
 *
 * Layout simplificado mientras reinstalamos sidebar-08 limpio.
 * TODO: Restaurar sidebar + breadcrumbs después de la instalación.
 */

import { Outlet } from "react-router-dom";
import { Suspense } from "react";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-app">
      <NavigationProgressBar />

      {/* Header temporal */}
      <header className="sticky top-0 z-50 border-b border-line-hairline bg-paper px-6 py-4">
        <h1 className="text-lg font-semibold text-txt-body">
          SIRES - Metro CDMX
        </h1>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto p-6">
        <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

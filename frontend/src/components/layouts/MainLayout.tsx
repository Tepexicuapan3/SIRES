import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const MainLayout = () => {
  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Barra de progreso invisible que se activa al navegar */}
      <NavigationProgressBar />

      {/* Sidebar Persistente */}
      {/* <Sidebar /> */}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Persistente */}
        {/* <Header /> */}

        <main className="flex-1 overflow-auto relative p-4 sm:p-6">
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

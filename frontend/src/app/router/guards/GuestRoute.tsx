import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthSession } from "@features/auth/queries/useAuthSession";
import { LoadingSpinner } from "@shared/components/LoadingSpinner";

interface GuestRouteProps {
  children: ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const { data: sessionUser, isLoading } = useAuthSession();
  const isAuthenticated = Boolean(sessionUser);
  const requiresOnboarding = Boolean(
    sessionUser?.requiresOnboarding ?? sessionUser?.mustChangePassword,
  );

  if (isLoading && !sessionUser) {
    return <LoadingSpinner fullScreen />;
  }

  if (isAuthenticated) {
    if (requiresOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    const landingRoute =
      sessionUser?.landingRoute && sessionUser.landingRoute !== "/login"
        ? sessionUser.landingRoute
        : "/dashboard";

    return <Navigate to={landingRoute} replace />;
  }

  return <>{children}</>;
};

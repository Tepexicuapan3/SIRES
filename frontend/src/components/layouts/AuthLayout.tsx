import { ReactNode } from "react";
import { ParticlesBackground } from "@/features/auth/animations/ParticlesBackground";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fondo con degradado */}
      <div className="fixed inset-0 -z-20 bg-background" />

      {/* Animación de partículas */}
      <ParticlesBackground />

      {/* Contenido */}
      <div className="relative z-10 w-full px-4">{children}</div>
    </div>
  );
};

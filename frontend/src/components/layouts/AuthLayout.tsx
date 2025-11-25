import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  backgroundImage: string;
  backgroundAlt?: string;
}

export const AuthLayout = ({
  children,
  backgroundImage,
  backgroundAlt = "Background",
}: AuthLayoutProps) => {
  return (
    <main className="min-h-screen bg-background overflow-hidden relative">
      {/* Degradado de fondo */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/30" />

        {/* Patrón geométrico Metro */}
        <div className="absolute -inset-1/2 opacity-10 dark:opacity-20 rotate-45">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="metro-pattern"
                x="0"
                y="0"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <image
                  href="/icons/metro-geometrico.svg"
                  x="10"
                  y="10"
                  width="60"
                  height="60"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#metro-pattern)" />
          </svg>
        </div>

        {/* Líneas horizontales del techo */}
        <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none">
          <div className="absolute w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent top-1/4" />
          <div className="absolute w-full h-px bg-linear-to-r from-transparent via-primary/10 to-transparent top-1/2" />
          <div className="absolute w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent top-3/4" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-0">
        <div className="w-full h-screen flex flex-col lg:flex-row items-stretch justify-stretch">
          {/* Panel izquierdo - Imagen */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
            <div className="relative w-full h-full">
              <img
                src={backgroundImage}
                alt={backgroundAlt}
                className="w-full h-full object-cover"
              />

              {/* Gradientes de transición */}
              <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-background via-background/50 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background via-background/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background via-background/30 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-primary/10 pointer-events-none" />
            </div>
          </div>

          {/* Panel derecho - Formulario */}
          <div className="w-full lg:w-1/2 h-screen flex items-center justify-center bg-background overflow-y-auto p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
};

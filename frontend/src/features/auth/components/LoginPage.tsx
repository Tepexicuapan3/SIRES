import { LoginForm } from "./LoginForm";
import { ParticlesBackground } from "../animations/ParticlesBackground";

export const LoginPage = () => {
  return (
    <main className="relative min-h-screen w-full bg-app flex items-center justify-center p-4 overflow-hidden">
      {/* === BACKGROUND ANIMADO === */}
      <ParticlesBackground
        quantity={400} // Cantidad justa para no saturar
        staticity={7} // Movimiento lento y estable (Clínico)
        ease={50} // Suavidad alta
      />
      <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/80 pointer-events-none z-0" />

      {/* === TARJETA DE LOGIN === */}
      <div className="w-full max-w-[440px] z-10 animate-fade-in-up">
        {/* Card Container */}
        <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden bg-paper/60 dark:bg-paper/40 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-black/10 transition-all duration-300">
          {/* Header de Identidad */}
          <div className="flex flex-col items-center text-center">
            {/* Logo Wrapper */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center shadow-xl shadow-brand/20 mb-4 sm:mb-6 transition-all duration-300 hover:scale-105 hover:rotate-2">
              <img
                src="/SIRES.svg"
                alt="Logo SIRES"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
              />
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-txt-body tracking-tight">
              S I R E S
            </h1>

            <p className="mt-2 text-txt-muted text-sm sm:text-base font-normal max-w-xs mx-auto">
              Sistema de Información de Registro Electrónico para la Salud
            </p>
          </div>
          {/* Formulario */}
          <LoginForm />
        </div>

        {/* Footer Externo */}
        <p className="mt-8 text-center text-xs text-txt-muted/70">
          © {new Date().getFullYear()} Sistema de Transporte Colectivo.{" "}
          <br className="sm:hidden" />
          Uso exclusivo personal autorizado.
        </p>
      </div>
    </main>
  );
};

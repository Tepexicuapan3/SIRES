export const LoginFooter = () => {
  return (
    <div className="mt-6 space-y-4">
      {/* Enlaces de ayuda */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <a
          href="#forgot-password"
          className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </a>
        <span className="text-border">•</span>
        <a
          href="#help"
          className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
        >
          Necesitas ayuda
        </a>
      </div>

      {/* Mensaje de seguridad */}
      <p className="text-center text-xs text-muted-foreground">
        Este es un sistema seguro. Tus datos están protegidos.
      </p>

      {/* Información adicional */}
      <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/40">
        <p>Sistema de Información y Registro de Expedientes</p>
        <p className="mt-1">Metro CDMX © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

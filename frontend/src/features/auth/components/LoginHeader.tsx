export const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="w-50 h-50">
          <img
            src="/public/SIRES.svg"
            alt="SIRES Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">S I R E S</h1>
      <h3 className="text-lg font-medium text-foreground mb-1">
        Sistema Integral de Reportes y Estadísticas de Seguridad
      </h3>
      <p className="text-sm text-muted-foreground">
        Sistema de Transporte Colectivo
      </p>
      <p className="text-sm text-muted-foreground">Metro CDMX</p>
    </div>
  );
};

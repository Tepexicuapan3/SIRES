export const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard - SIRES
          </h1>
          <p className="text-muted-foreground">
            Sistema de Registro de Expedientes - Metro CDMX
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de ejemplo */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Total Expedientes
                </h3>
                <p className="text-sm text-muted-foreground">Este mes</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">1,234</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Completados
                </h3>
                <p className="text-sm text-muted-foreground">Últimos 7 días</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">856</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  En Proceso
                </h3>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">378</p>
          </div>
        </div>

        <div className="mt-8 bg-card border border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Bienvenido al Sistema SIRES
          </h2>
          <p className="text-muted-foreground">
            Dashboard funcionando correctamente. Las rutas protegidas están
            activas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

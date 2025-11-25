export const ExpedientesPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Expedientes
          </h1>
          <p className="text-muted-foreground">
            Gestión de expedientes médicos - Metro CDMX
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Lista de Expedientes
            </h2>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium">
              + Nuevo Expediente
            </button>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {item.toString().padStart(3, "0")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Expediente #{item.toString().padStart(6, "0")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Paciente de ejemplo - Línea {item}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Activo
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizado hace 2 horas
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Mostrando 5 de 1,234 expedientes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpedientesPage;

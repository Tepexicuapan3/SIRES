import { ThemeToggle } from "./ThemeToggle";

export const SettingsPage = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-txt-body">
        Configuración
      </h1>

      {/* Card de Preferencias Visuales */}
      <section className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-txt-body mb-1">
          Preferencias de Interfaz
        </h2>
        <p className="text-sm text-txt-muted mb-6">
          Personaliza cómo visualizas el expediente clínico.
        </p>

        {/* Aquí integramos tu componente */}
        <div className="max-w-md">
          <ThemeToggle />
        </div>
      </section>

      {/* Otras secciones... */}
    </div>
  );
};

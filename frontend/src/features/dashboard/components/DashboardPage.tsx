import {
  LogOut,
  Bell,
  Check,
  AlertTriangle,
  Info,
  XOctagon,
  Loader2,
  MousePointerClick,
  Settings2, // Icono para la nueva sección
} from "lucide-react";
import { useLogout } from "../../auth/hooks/useLogout";
import { toast } from "sonner";
import { ThemeToggle } from "../../settings/components/ThemeToggle"; // <--- 1. Importar el Toggle

export const DashboardPage = () => {
  const { mutate: logout, isPending } = useLogout();

  const handlePromise = (shouldFail = false) => {
    const promise = () =>
      new Promise((resolve, reject) =>
        setTimeout(
          () => (shouldFail ? reject() : resolve({ name: "Expediente 402" })),
          2000
        )
      );

    toast.promise(promise, {
      loading: "Sincronizando con base de datos...",
      success: (data: any) => `${data.name} actualizado correctamente`,
      error: "Error de conexión: No se pudo sincronizar",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 animate-fade-in transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* === HEADER === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-txt-body text-foreground tracking-tight">
              Dashboard / UI Kit
            </h1>
            <p className="text-muted-foreground text-txt-body mt-1">
              Entorno de pruebas y configuración del sistema
            </p>
          </div>

          <button
            onClick={() => logout()}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-paper border border-line-struct rounded-lg text-status-critical font-medium hover:bg-status-critical/10 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <LogOut size={18} />
            )}
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* === CONTENIDO PRINCIPAL === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA 1: CONFIGURACIÓN (NUEVA) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de Apariencia */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand/10 rounded-lg text-brand">
                  <Settings2 size={20} />
                </div>
                <h2 className="text-lg font-semibold text-txt-body">
                  Configuración
                </h2>
              </div>

              {/* Aquí renderizamos tu componente */}
              <ThemeToggle />
            </div>

            {/* Tarjeta de Info (Relleno visual) */}
            <div className="bg-paper-lift border border-line-struct rounded-xl p-6 shadow-sm opacity-80">
              <h3 className="text-sm font-semibold text-txt-body mb-2">
                Estado del Sistema
              </h3>
              <div className="text-xs text-txt-muted space-y-2">
                <div className="flex justify-between">
                  <span>Versión</span>
                  <span className="font-mono">v1.0.4-beta</span>
                </div>
                <div className="flex justify-between">
                  <span>Conexión</span>
                  <span className="text-status-stable flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-status-stable animate-pulse" />{" "}
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2 y 3: NOTIFICACIONES (OCUPAN EL RESTO) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sección Notificaciones Básicas */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand/10 rounded-lg text-brand">
                  <Bell size={20} />
                </div>
                <h2 className="text-lg font-semibold text-txt-body">
                  Playground de Notificaciones
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => toast.success("Operación Exitosa")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-stable/10 hover:border-status-stable transition-colors text-txt-body font-medium"
                >
                  <Check size={16} className="text-status-stable" /> Success
                </button>

                <button
                  onClick={() => toast.error("Error del Sistema")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-critical/10 hover:border-status-critical transition-colors text-txt-body font-medium"
                >
                  <XOctagon size={16} className="text-status-critical" /> Error
                </button>

                <button
                  onClick={() => toast.warning("Advertencia")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-alert/10 hover:border-status-alert transition-colors text-txt-body font-medium"
                >
                  <AlertTriangle size={16} className="text-status-alert" />{" "}
                  Warning
                </button>

                <button
                  onClick={() => toast.info("Información")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-info/10 hover:border-status-info transition-colors text-txt-body font-medium"
                >
                  <Info size={16} className="text-status-info" /> Info
                </button>
              </div>
            </div>

            {/* Sección Detalles */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-txt-muted uppercase tracking-wider mb-4">
                Con Descripción
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() =>
                    toast.success("Paciente Alta", {
                      description:
                        "El expediente 45920 ha sido cerrado correctamente.",
                    })
                  }
                  className="w-full h-12 border border-line-struct rounded-lg flex items-center px-4 hover:bg-paper-hover transition-colors text-txt-body text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-status-stable mr-3" />
                  Éxito detallado
                </button>

                <button
                  onClick={() =>
                    toast.error("Fallo de Auth", {
                      description: "Credenciales expiradas. (Código: AUTH_002)",
                    })
                  }
                  className="w-full h-12 border border-line-struct rounded-lg flex items-center px-4 hover:bg-paper-hover transition-colors text-txt-body text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-status-critical mr-3" />
                  Error detallado
                </button>
              </div>
            </div>

            {/* Sección Interactivos */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MousePointerClick size={16} className="text-brand" />
                <h3 className="text-sm font-semibold text-txt-muted uppercase tracking-wider">
                  Interacción
                </h3>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    toast("Archivo eliminado", {
                      description: "¿Deseas recuperarlo?",
                      action: {
                        label: "Deshacer",
                        onClick: () => toast.success("Recuperado"),
                      },
                    })
                  }
                  className="w-full h-10 bg-white dark:bg-zinc-900 border border-line-struct rounded-lg text-sm hover:shadow-sm transition-all"
                >
                  Toast con Acción
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePromise(false)}
                    className="h-10 border border-line-struct rounded-lg text-xs hover:border-status-stable hover:text-status-stable transition-colors"
                  >
                    Simular Carga OK
                  </button>
                  <button
                    onClick={() => handlePromise(true)}
                    className="h-10 border border-line-struct rounded-lg text-xs hover:border-status-critical hover:text-status-critical transition-colors"
                  >
                    Simular Carga Error
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import {
  LogOut,
  Bell,
  Check,
  AlertTriangle,
  Info,
  XOctagon,
  Loader2,
  MousePointerClick,
  Palette, // Icono para la sección de botones
} from "lucide-react";
import { useLogout } from "../../auth/hooks/useLogout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const DashboardPage = () => {
  const { mutate: logout, isPending } = useLogout();

  const handlePromise = (shouldFail = false) => {
    const promise = () =>
      new Promise<{ name: string }>((resolve, reject) =>
        setTimeout(
          () => (shouldFail ? reject() : resolve({ name: "Expediente 402" })),
          2000,
        ),
      );

    toast.promise(promise, {
      loading: "Sincronizando con base de datos...",
      success: (data) => `${data.name} actualizado correctamente`,
      error: "Error de conexión: No se pudo sincronizar",
    });
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10 animate-fade-in transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* === HEADER === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-line-struct pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-txt-body tracking-tight">
              Dashboard / UI Kit
            </h1>
            <p className="text-txt-muted mt-1">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* COLUMNA 1: ESTADO DEL SISTEMA */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de Info */}
            <div className="bg-paper-lift border border-line-struct rounded-xl p-6 shadow-sm">
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

          {/* COLUMNA 2-4: NOTIFICACIONES (OCUPAN EL RESTO) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* === SECCIÓN DE BOTONES shadcn/ui + Metro CDMX === */}
        <div className="mt-8 bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-txt-body">
                Sistema de Botones - Metro CDMX
              </h2>
              <p className="text-sm text-txt-muted">
                Componentes shadcn/ui adaptados al sistema de diseño Metro
              </p>
            </div>
          </div>

          {/* Variantes */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Variantes disponibles:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default (Brand)</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
          </div>

          {/* Tamaños */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Tamaños disponibles:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="default">
                  Small
                </Button>
                <Button size="default" variant="default">
                  Default
                </Button>
                <Button size="lg" variant="default">
                  Large
                </Button>
              </div>
            </div>
          </div>

          {/* Con Iconos */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Con iconos:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
                <Button variant="destructive">
                  <XOctagon className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
                <Button variant="outline">
                  <Info className="mr-2 h-4 w-4" />
                  Información
                </Button>
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">Estados:</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Normal</Button>
                <Button variant="default" disabled>
                  Disabled
                </Button>
                <Button variant="outline">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              </div>
            </div>
          </div>

          {/* Nota técnica */}
          <div className="mt-6 p-4 bg-status-info/10 border border-status-info/30 rounded-lg">
            <p className="text-xs text-txt-muted">
              <strong className="text-status-info">Nota técnica:</strong> Estos
              botones usan tokens semánticos Metro CDMX (
              <code className="px-1 py-0.5 bg-paper rounded text-brand font-mono">
                bg-brand
              </code>
              ,{" "}
              <code className="px-1 py-0.5 bg-paper rounded text-status-critical font-mono">
                status-critical
              </code>
              , etc.) y NO colores hardcodeados. Se adaptan automáticamente al
              tema dark/light.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

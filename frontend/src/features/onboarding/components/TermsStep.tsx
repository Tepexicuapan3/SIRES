import { useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/ScrollArea"; // <--- Importamos el componente nuevo

interface Props {
  onAccept: () => void;
}

export const TermsStep = ({ onAccept }: Props) => {
  const [hasReadBottom, setHasReadBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // La lógica de scroll cambia ligeramente porque Radix maneja el evento en el Viewport
  // Pero para simplificar, permitiremos aceptar sin forzar scroll estricto,
  // o usamos un truco simple con onScrollCapture si es vital bloquearlo.

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-brand">Acta Responsiva</h2>
        <p className="text-txt-muted">
          Por favor lee y acepta los términos de uso del SIBMI WEB / SIRES.
        </p>
      </div>

      {/* COMPONENTE SCROLL AREA */}
      <div className="border border-line-struct rounded-lg bg-paper shadow-inner overflow-hidden">
        <ScrollArea className="h-96 w-full rounded-lg p-4">
          <div className="space-y-4 pr-4 text-sm text-txt-body leading-relaxed">
            <div className="flex items-center gap-3 border-b border-line-struct pb-4 mb-4">
              <Shield className="text-brand h-8 w-8" />
              <div>
                <h3 className="font-bold text-lg">
                  SISTEMA DE TRANSPORTE COLECTIVO
                </h3>
                <p className="text-xs text-txt-muted uppercase">
                  Gerencia de Organización y Sistemas
                </p>
              </div>
            </div>

            <p>
              Por este conducto, hago constar que he recibido la clave de
              ingreso al sistema, otorgada por la Coordinación de Programación y
              Diseño de Sistemas.
            </p>

            <p className="font-semibold">En consecuencia, me comprometo a:</p>

            <ol className="list-decimal pl-5 space-y-3">
              <li>
                Utilizar el sistema exclusivamente para los fines autorizados
                por el Sistema de Transporte Colectivo.
              </li>
              <li>
                Mantener la confidencialidad de mi usuario y contraseña, y no
                compartir esta información con terceros.
              </li>
              <li>
                Notificar de inmediato a la Coordinación en caso de pérdida o
                sospecha de compromiso de mis credenciales.
              </li>
              <li>
                No utilizar el sistema para actividades ilícitas o no éticas que
                puedan perjudicar al Organismo.
              </li>
              <li>
                Tomar las precauciones necesarias para que la clave de acceso no
                sea expuesta a personas ajenas.
              </li>
            </ol>

            <div className="bg-status-warning/10 border-l-4 border-status-warning p-4 my-4 rounded-r-lg">
              <h4 className="font-bold flex items-center gap-2 text-status-warning mb-1">
                <AlertTriangle size={16} /> Responsabilidad Legal
              </h4>
              <p className="text-xs text-txt-body">
                El incumplimiento de lo anterior se considerará una falta
                Administrativa conforme al artículo 49, fracción V, de la Ley de
                Responsabilidades Administrativas de la Ciudad de México.
              </p>
            </div>

            <p className="text-xs text-txt-muted italic mt-4 border-t border-line-struct pt-4">
              <strong>Nota importante:</strong> La clave o acceso que no sea
              utilizado durante un periodo de noventa (90) días será desactivado
              automáticamente por el sistema, sin previo aviso.
            </p>

            <div className="h-4"></div>
          </div>
        </ScrollArea>
      </div>

      {/* Checkbox de Aceptación */}
      <div className="flex flex-col gap-4">
        <label
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer select-none",
            accepted
              ? "border-brand bg-brand/5 shadow-sm"
              : "border-line-struct hover:bg-paper-hover"
          )}
        >
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <div
              className={cn(
                "w-5 h-5 border-2 rounded transition-colors flex items-center justify-center",
                accepted
                  ? "bg-brand border-brand"
                  : "border-txt-muted peer-focus:ring-2 peer-focus:ring-brand/20"
              )}
            >
              {accepted && (
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="text-sm">
            <span className="font-medium block text-txt-body">
              He leído y comprendo mis responsabilidades
            </span>
            <span className="text-txt-muted text-xs">
              Acepto cumplir con los lineamientos de seguridad establecidos en
              el Acta Responsiva.
            </span>
          </div>
        </label>

        <button
          onClick={onAccept}
          disabled={!accepted}
          className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99]"
        >
          Aceptar y Continuar
        </button>
      </div>
    </div>
  );
};

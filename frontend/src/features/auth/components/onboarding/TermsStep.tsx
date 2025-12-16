import { useState } from "react";
import { Shield, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface Props {
  onAccept: () => void;
}

export const TermsStep = ({ onAccept }: Props) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-brand/10 text-brand mb-3">
          <FileText size={24} />
        </div>
        <h2 className="text-2xl font-bold text-txt-body">Términos de Uso</h2>
        <p className="text-txt-muted text-sm">
          Acta responsiva para el uso del sistema SIRES.
        </p>
      </div>

      {/* Área de Texto con Scroll */}
      <div className="border border-line-struct rounded-xl bg-paper-subtle overflow-hidden shadow-inner">
        <ScrollArea className="h-64 w-full p-5">
          <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
            <div className="flex items-center gap-3 border-b border-line-hairline pb-4 mb-4">
              <Shield className="text-brand shrink-0" size={28} />
              <div>
                <h3 className="font-bold text-base m-0 text-txt-body">
                  SISTEMA DE TRANSPORTE COLECTIVO
                </h3>
                <p className="text-[10px] text-txt-muted uppercase tracking-wider m-0">
                  Gerencia de Organización y Sistemas
                </p>
              </div>
            </div>

            <p className="text-xs text-txt-body leading-relaxed">
              Por este conducto, hago constar que he recibido la clave de
              ingreso al sistema...
            </p>

            <p className="font-bold text-xs mt-4">Mis compromisos:</p>
            <ul className="text-xs list-disc pl-4 space-y-2 text-txt-muted marker:text-brand">
              <li>
                Utilizar el sistema exclusivamente para fines autorizados.
              </li>
              <li>Mantener la confidencialidad absoluta de mi contraseña.</li>
              <li>
                Notificar inmediatamente cualquier sospecha de acceso no
                autorizado.
              </li>
              <li>
                Asumir la responsabilidad legal (Ley de Responsabilidades
                Administrativas CDMX) por el mal uso.
              </li>
            </ul>

            <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
              <p className="text-[10px] text-status-warning font-medium m-0">
                ⚠️ La inactividad por 90 días causará la baja automática del
                usuario.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Checkbox Mejorado */}
      <label
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none group",
          accepted
            ? "border-brand bg-brand/5 ring-1 ring-brand/20"
            : "border-line-struct hover:border-brand/50 hover:bg-paper-hover"
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
              "w-5 h-5 rounded border transition-all flex items-center justify-center",
              accepted
                ? "bg-brand border-brand shadow-sm scale-110"
                : "border-txt-muted group-hover:border-brand bg-paper"
            )}
          >
            <Check
              size={14}
              className={cn(
                "text-white transition-transform",
                accepted ? "scale-100" : "scale-0"
              )}
              strokeWidth={3}
            />
          </div>
        </div>
        <div className="space-y-0.5">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              accepted ? "text-brand" : "text-txt-body"
            )}
          >
            Acepto los términos y condiciones
          </span>
          <p className="text-xs text-txt-muted">
            Entiendo mis responsabilidades como usuario del sistema.
          </p>
        </div>
      </label>

      <button
        onClick={onAccept}
        disabled={!accepted}
        className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-medium rounded-lg disabled:opacity-50 disabled:grayscale transition-all shadow-lg active:scale-[0.98]"
      >
        Continuar
      </button>
    </div>
  );
};

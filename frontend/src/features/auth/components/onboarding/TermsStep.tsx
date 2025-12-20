import { useState } from "react";
import { Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface Props {
  onAccept: () => void;
}

export const TermsStep = ({ onAccept }: Props) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-paper/60 dark:bg-paper/40 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-black/10 animate-fade-in">
      {/* === HEADER INSTITUCIONAL === */}
      <div className="bg-linear-to-r from-brand/10 via-brand/5 to-transparent p-6 sm:p-8 border-b border-line-hairline">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Logos Institucionales */}
          <div className="flex items-center gap-4">
            <img
              src="/icons/metro-logo-borde.svg"
              alt="Metro CDMX"
              className="h-16 sm:h-18 w-auto"
            />
          </div>

          {/* Título */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-lg sm:text-xl font-display font-bold text-txt-body">
              Términos y Condiciones de Uso
            </h1>
            <p className="text-sm text-txt-muted mt-1">
              Sistema Integral de Registro Electrónico para la Salud (SIRES)
            </p>
          </div>
        </div>
      </div>

      {/* === CONTENIDO DE TÉRMINOS === */}
      <div className="p-6 sm:p-8">
        <ScrollArea className="h-[320px] sm:h-[360px] w-full pr-4">
          <div className="space-y-6">
            {/* Acta Responsiva Header */}
            <div className="flex items-start gap-4 p-4 bg-subtle/50 rounded-xl border border-line-hairline">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={28} className="text-brand" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-txt-body">
                  Acta Responsiva de Usuario
                </h2>
                <p className="text-sm text-txt-muted mt-1">
                  Gerencia de Organización y Sistemas — Sistema de Transporte
                  Colectivo
                </p>
              </div>
            </div>

            {/* Declaración Principal */}
            <div className="space-y-4">
              <p className="text-sm text-txt-body leading-relaxed">
                Por este conducto, hago constar que he recibido la clave de
                ingreso al <strong>Sistema SIRES</strong> y me comprometo a
                utilizarla de manera responsable, confidencial y exclusivamente
                para los fines autorizados por el Sistema de Transporte
                Colectivo.
              </p>

              <p className="text-sm text-txt-body leading-relaxed">
                Reconozco que el acceso a este sistema implica el manejo de
                información sensible relacionada con expedientes médicos y datos
                personales de los trabajadores, por lo que me comprometo a
                observar las siguientes disposiciones:
              </p>
            </div>

            {/* Compromisos */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-txt-body uppercase tracking-wide">
                Mis Compromisos como Usuario
              </h3>

              <div className="grid gap-3">
                {[
                  {
                    title: "Uso Exclusivo Autorizado",
                    desc: "Utilizar el sistema únicamente para las funciones propias de mi cargo y las actividades expresamente autorizadas.",
                  },
                  {
                    title: "Confidencialidad de Credenciales",
                    desc: "Mantener en estricta confidencialidad mi contraseña y no compartirla con terceros bajo ninguna circunstancia.",
                  },
                  {
                    title: "Notificación de Incidentes",
                    desc: "Reportar inmediatamente a la Gerencia de Sistemas cualquier sospecha de acceso no autorizado o compromiso de mis credenciales.",
                  },
                  {
                    title: "Responsabilidad Legal",
                    desc: "Asumir la responsabilidad administrativa y legal correspondiente conforme a la Ley de Responsabilidades Administrativas de la Ciudad de México.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-paper hover:bg-subtle/30 transition-colors border border-line-hairline"
                  >
                    <span className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-txt-body">
                        {item.title}
                      </p>
                      <p className="text-xs text-txt-muted mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Inactividad */}
            <div className="flex items-start gap-3 p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl">
              <AlertTriangle
                size={22}
                className="text-status-alert shrink-0 mt-0.5"
              />
              <div>
                <p className="font-semibold text-sm text-txt-body">
                  Aviso Importante
                </p>
                <p className="text-sm text-txt-muted mt-1 leading-relaxed">
                  La inactividad por más de <strong>90 días</strong> causará la
                  baja automática del usuario. Cualquier uso indebido del
                  sistema será sancionado conforme a la normatividad vigente.
                </p>
              </div>
            </div>

            {/* Fundamento Legal */}
            <div className="p-4 bg-subtle/30 rounded-xl border border-line-hairline">
              <p className="text-xs text-txt-muted leading-relaxed">
                <strong>Fundamento Legal:</strong> Ley de Protección de Datos
                Personales en Posesión de Sujetos Obligados de la Ciudad de
                México, Ley de Responsabilidades Administrativas de la Ciudad de
                México, y normatividad interna del Sistema de Transporte
                Colectivo.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t border-line-hairline">
          <div className="space-y-4">
            {/* Checkbox de Aceptación */}
            <label
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none group",
                accepted
                  ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                  : "border-line-struct hover:border-brand/50 hover:bg-subtle/30"
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
                    "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                    accepted
                      ? "bg-brand border-brand shadow-md"
                      : "border-txt-muted/50 group-hover:border-brand bg-paper"
                  )}
                >
                  <Check
                    size={16}
                    className={cn(
                      "text-white transition-all",
                      accepted ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )}
                    strokeWidth={3}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    accepted ? "text-brand" : "text-txt-body"
                  )}
                >
                  He leído y acepto los términos y condiciones
                </span>
                <p className="text-xs text-txt-muted leading-relaxed">
                  Declaro que entiendo mis responsabilidades como usuario del
                  sistema SIRES.
                </p>
              </div>
            </label>

            {/* Botón Continuar */}
            <div className="mx-md">
              <button
                onClick={onAccept}
                disabled={!accepted}
                className={cn(
                  "w-full h-12 font-semibold rounded-xl transition-all shadow-lg",
                  accepted
                    ? "bg-brand hover:bg-brand-hover text-white active:scale-[0.98]"
                    : "bg-line-struct text-txt-muted cursor-not-allowed"
                )}
              >
                Continuar al Paso 2
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
